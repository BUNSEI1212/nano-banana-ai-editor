const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DATABASE_PATH || './data/proxy.db';
  }

  init() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Initialize SQLite database
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Error opening database:', err);
          throw err;
        }
        logger.info(`Database connected: ${this.dbPath}`);
      });

      // Create tables
      this.createTables();
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  createTables() {
    const tables = [
      // Users table (mirrors Casdoor users)
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        casdoor_user_id TEXT UNIQUE NOT NULL,
        email TEXT,
        nickname TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Plan catalog table (create first as it's referenced by others)
      `CREATE TABLE IF NOT EXISTS plan_catalog (
        plan_code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        monthly_credits INTEGER DEFAULT 0,
        features TEXT, -- JSON string
        concurrency_limit INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Subscriptions table (mirrors Casdoor subscriptions)
      `CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        plan_code TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        start_at DATETIME,
        end_at DATETIME,
        renew_type TEXT,
        provider TEXT,
        last_sync_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Usage events table
      `CREATE TABLE IF NOT EXISTS usage_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL, -- 'generate' or 'edit'
        units INTEGER DEFAULT 1,
        request_id TEXT,
        metadata TEXT, -- JSON string
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Usage aggregation table
      `CREATE TABLE IF NOT EXISTS usage_agg (
        user_id TEXT NOT NULL,
        period TEXT NOT NULL, -- YYYYMM format
        gen_count INTEGER DEFAULT 0,
        edit_count INTEGER DEFAULT 0,
        credits_used INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, period),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Active requests tracking
      `CREATE TABLE IF NOT EXISTS active_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        request_id TEXT NOT NULL,
        type TEXT NOT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Activation codes table (for global unique activation system)
      `CREATE TABLE IF NOT EXISTS activation_codes (
        code TEXT PRIMARY KEY,
        plan_type INTEGER NOT NULL,
        credits INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'unused',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        used_at DATETIME NULL,
        expires_at DATETIME NULL
      )`,

      // Activations table (device binding)
      `CREATE TABLE IF NOT EXISTS activations (
        id TEXT PRIMARY KEY,
        activation_code TEXT NOT NULL,
        device_id TEXT NOT NULL,
        device_info TEXT,
        user_identifier TEXT,
        credits_granted INTEGER NOT NULL,
        credits_used INTEGER DEFAULT 0,
        activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (activation_code) REFERENCES activation_codes (code),
        UNIQUE(activation_code, device_id)
      )`,

      // Activation usage table
      `CREATE TABLE IF NOT EXISTS activation_usage (
        id TEXT PRIMARY KEY,
        activation_id TEXT NOT NULL,
        operation_type TEXT NOT NULL,
        credits_consumed INTEGER DEFAULT 1,
        request_metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (activation_id) REFERENCES activations (id)
      )`,

      // Device fingerprints table
      `CREATE TABLE IF NOT EXISTS device_fingerprints (
        device_id TEXT PRIMARY KEY,
        hardware_info TEXT,
        first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        activation_count INTEGER DEFAULT 0
      )`
    ];

    // Create tables sequentially to avoid race conditions
    this.createTablesSequentially(tables, 0);
  }

  createTablesSequentially(tables, index) {
    if (index >= tables.length) {
      // All tables created, now insert default plans
      setTimeout(() => this.insertDefaultPlans(), 100);
      return;
    }

    this.db.run(tables[index], (err) => {
      if (err) {
        logger.error(`Error creating table ${index}:`, err);
      } else {
        logger.debug(`Table ${index} created or verified`);
      }
      // Create next table
      this.createTablesSequentially(tables, index + 1);
    });
  }

  insertDefaultPlans() {
    const defaultPlans = [
      {
        plan_code: 'free',
        name: 'Free',
        monthly_credits: 3,
        features: JSON.stringify({ maxConcurrency: 1 }),
        concurrency_limit: 1
      },
      {
        plan_code: 'nano-banana-credits',
        name: 'Experience Pack',
        monthly_credits: 20,
        features: JSON.stringify({ maxConcurrency: 2, price: 9.9, currency: 'CNY', interval: 'one-time' }),
        concurrency_limit: 2
      },
      {
        plan_code: 'lite-plan',
        name: 'Lite',
        monthly_credits: 100,
        features: JSON.stringify({ maxConcurrency: 2 }),
        concurrency_limit: 2
      },
      {
        plan_code: 'pro-plan',
        name: 'Pro',
        monthly_credits: 500,
        features: JSON.stringify({ maxConcurrency: 5 }),
        concurrency_limit: 5
      }
    ];

    const insertPlan = this.db.prepare(`
      INSERT OR IGNORE INTO plan_catalog (plan_code, name, monthly_credits, features, concurrency_limit)
      VALUES (?, ?, ?, ?, ?)
    `);

    defaultPlans.forEach(plan => {
      insertPlan.run([
        plan.plan_code,
        plan.name,
        plan.monthly_credits,
        plan.features,
        plan.concurrency_limit
      ]);
    });

    insertPlan.finalize();
  }

  async getUserInfo(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.*, s.plan_code, s.status as subscription_status, 
               p.monthly_credits, p.concurrency_limit
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
        LEFT JOIN plan_catalog p ON s.plan_code = p.plan_code
        WHERE u.casdoor_user_id = ?
      `;

      this.db.get(sql, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            plan: row.plan_code || 'free',
            monthlyCredits: row.monthly_credits || 3,
            maxConcurrency: row.concurrency_limit || 1
          });
        } else {
          // Create user if not exists
          this.createUser(userId).then(resolve).catch(reject);
        }
      });
    });
  }

  async createUser(casdoorUserId, email = null, nickname = null) {
    return new Promise((resolve, reject) => {
      const userId = require('uuid').v4();
      const sql = `
        INSERT INTO users (id, casdoor_user_id, email, nickname)
        VALUES (?, ?, ?, ?)
      `;

      this.db.run(sql, [userId, casdoorUserId, email, nickname], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: userId,
            casdoor_user_id: casdoorUserId,
            email,
            nickname,
            plan: 'free',
            monthlyCredits: 3,
            maxConcurrency: 1
          });
        }
      });
    });
  }

  async upsertUser({ id, email, displayName, avatar }) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO users (id, casdoor_user_id, email, nickname)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(casdoor_user_id) DO UPDATE SET
          email = excluded.email,
          nickname = excluded.nickname,
          updated_at = CURRENT_TIMESTAMP
      `;

      this.db.run(sql, [require('uuid').v4(), id, email, displayName], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: id,
            email,
            displayName,
            avatar
          });
        }
      });
    });
  }

  async getUserUsage(userId) {
    return new Promise((resolve, reject) => {
      const currentPeriod = new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM
      
      const sql = `
        SELECT * FROM usage_agg 
        WHERE user_id = (SELECT id FROM users WHERE casdoor_user_id = ?) 
        AND period = ?
      `;

      this.db.get(sql, [userId, currentPeriod], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || {
            genCount: 0,
            editCount: 0,
            creditsUsed: 0
          });
        }
      });
    });
  }

  async recordUsage({ userId, type, units = 1, requestId, metadata = {} }) {
    return new Promise((resolve, reject) => {
      const eventId = require('uuid').v4();
      const currentPeriod = new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM

      this.db.serialize(() => {
        // Insert usage event
        const insertEvent = `
          INSERT INTO usage_events (id, user_id, type, units, request_id, metadata)
          SELECT ?, u.id, ?, ?, ?, ?
          FROM users u WHERE u.casdoor_user_id = ?
        `;

        this.db.run(insertEvent, [
          eventId, type, units, requestId, JSON.stringify(metadata), userId
        ], (err) => {
          if (err) {
            return reject(err);
          }

          // Update usage aggregation
          const updateAgg = `
            INSERT INTO usage_agg (user_id, period, gen_count, edit_count, credits_used)
            SELECT u.id, ?, 
                   CASE WHEN ? = 'generate' THEN ? ELSE 0 END,
                   CASE WHEN ? = 'edit' THEN ? ELSE 0 END,
                   ?
            FROM users u WHERE u.casdoor_user_id = ?
            ON CONFLICT(user_id, period) DO UPDATE SET
              gen_count = gen_count + CASE WHEN ? = 'generate' THEN ? ELSE 0 END,
              edit_count = edit_count + CASE WHEN ? = 'edit' THEN ? ELSE 0 END,
              credits_used = credits_used + ?,
              updated_at = CURRENT_TIMESTAMP
          `;

          this.db.run(updateAgg, [
            currentPeriod, type, units, type, units, units, userId,
            type, units, type, units, units
          ], (err) => {
            if (err) {
              reject(err);
            } else {
              resolve({ eventId, period: currentPeriod });
            }
          });
        });
      });
    });
  }

  async getActiveRequests(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) as count
        FROM active_requests ar
        JOIN users u ON ar.user_id = u.id
        WHERE u.casdoor_user_id = ?
      `;

      this.db.get(sql, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count || 0);
        }
      });
    });
  }

  // Activation code management methods
  async createActivationCode({ code, planType, credits, price, expiresAt = null }) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO activation_codes (code, plan_type, credits, price, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [code, planType, credits, price, expiresAt], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ code, planType, credits, price });
        }
      });
    });
  }

  async getActivationCode(code) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM activation_codes WHERE code = ?
      `;

      this.db.get(sql, [code], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async markActivationCodeUsed(code) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE activation_codes
        SET status = 'used', used_at = CURRENT_TIMESTAMP
        WHERE code = ?
      `;

      this.db.run(sql, [code], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Device activation management
  async createActivation({ activationCode, deviceId, deviceInfo, creditsGranted, userIdentifier = null }) {
    return new Promise((resolve, reject) => {
      const activationId = require('uuid').v4();
      const sql = `
        INSERT INTO activations (id, activation_code, device_id, device_info, user_identifier, credits_granted)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [activationId, activationCode, deviceId, JSON.stringify(deviceInfo), userIdentifier, creditsGranted], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: activationId,
            activationCode,
            deviceId,
            creditsGranted,
            creditsUsed: 0,
            creditsRemaining: creditsGranted
          });
        }
      });
    });
  }

  async getActivation(activationCode, deviceId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM activations
        WHERE activation_code = ? AND device_id = ?
      `;

      this.db.get(sql, [activationCode, deviceId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            resolve({
              ...row,
              creditsRemaining: row.credits_granted - row.credits_used,
              deviceInfo: JSON.parse(row.device_info || '{}')
            });
          } else {
            resolve(null);
          }
        }
      });
    });
  }

  async getActivationById(activationId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT a.*, ac.plan_type, ac.credits as total_credits, ac.price
        FROM activations a
        JOIN activation_codes ac ON a.activation_code = ac.code
        WHERE a.id = ?
      `;

      this.db.get(sql, [activationId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            resolve({
              ...row,
              creditsRemaining: row.credits_granted - row.credits_used,
              deviceInfo: JSON.parse(row.device_info || '{}')
            });
          } else {
            resolve(null);
          }
        }
      });
    });
  }

  async updateActivationUsage(activationId, creditsConsumed) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE activations
        SET credits_used = credits_used + ?, last_used_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.run(sql, [creditsConsumed, activationId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async recordActivationUsage({ activationId, operationType, creditsConsumed = 1, requestMetadata = {} }) {
    return new Promise((resolve, reject) => {
      const usageId = require('uuid').v4();
      const sql = `
        INSERT INTO activation_usage (id, activation_id, operation_type, credits_consumed, request_metadata)
        VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [usageId, activationId, operationType, creditsConsumed, JSON.stringify(requestMetadata)], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: usageId, activationId, operationType, creditsConsumed });
        }
      });
    });
  }

  // Device fingerprint management
  async upsertDeviceFingerprint(deviceId, hardwareInfo) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO device_fingerprints (device_id, hardware_info, activation_count)
        VALUES (?, ?, 1)
        ON CONFLICT(device_id) DO UPDATE SET
          hardware_info = excluded.hardware_info,
          last_seen_at = CURRENT_TIMESTAMP,
          activation_count = activation_count + 1
      `;

      this.db.run(sql, [deviceId, JSON.stringify(hardwareInfo)], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deviceId, activationCount: this.changes });
        }
      });
    });
  }

  async getUserSubscription(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT s.*, p.name as plan_name, p.monthly_credits, p.features
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        JOIN plan_catalog p ON s.plan_code = p.plan_code
        WHERE u.casdoor_user_id = ? AND s.status = 'active'
        ORDER BY s.created_at DESC
        LIMIT 1
      `;

      this.db.get(sql, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || {
            plan_code: 'free',
            plan_name: 'Free',
            status: 'active',
            monthly_credits: 3
          });
        }
      });
    });
  }

  async createSubscription({ userId, planCode, paymentId, startAt, endAt, provider = 'casdoor' }) {
    return new Promise((resolve, reject) => {
      const subscriptionId = require('uuid').v4();

      // First get the user's internal ID
      const getUserIdSql = `SELECT id FROM users WHERE casdoor_user_id = ?`;

      this.db.get(getUserIdSql, [userId], (err, userRow) => {
        if (err) {
          return reject(err);
        }

        if (!userRow) {
          return reject(new Error('User not found'));
        }

        // Deactivate existing subscriptions
        const deactivateSql = `UPDATE subscriptions SET status = 'expired' WHERE user_id = ? AND status = 'active'`;

        this.db.run(deactivateSql, [userRow.id], (err) => {
          if (err) {
            return reject(err);
          }

          // Create new subscription
          const insertSql = `
            INSERT INTO subscriptions (id, user_id, plan_code, status, start_at, end_at, provider, created_at)
            VALUES (?, ?, ?, 'active', ?, ?, ?, CURRENT_TIMESTAMP)
          `;

          this.db.run(insertSql, [
            subscriptionId, userRow.id, planCode, startAt, endAt, provider
          ], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                id: subscriptionId,
                user_id: userRow.id,
                plan_code: planCode,
                status: 'active',
                start_at: startAt,
                end_at: endAt,
                provider
              });
            }
          });
        });
      });
    });
  }

  async activateSubscription(userId, planCode, paymentData = {}) {
    try {
      // Calculate subscription period based on plan
      const now = new Date();
      let endDate;

      if (planCode === 'nano-banana-credits') {
        // One-time purchase, no expiration
        endDate = new Date('2099-12-31');
      } else {
        // Monthly subscription
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const subscription = await this.createSubscription({
        userId,
        planCode,
        paymentId: paymentData.paymentId || null,
        startAt: now.toISOString(),
        endAt: endDate.toISOString(),
        provider: paymentData.provider || 'casdoor'
      });

      // Reset usage for the new subscription period
      await this.resetUserUsage(userId);

      return subscription;
    } catch (error) {
      throw error;
    }
  }

  async resetUserUsage(userId) {
    return new Promise((resolve, reject) => {
      const currentPeriod = new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM

      // Delete current period usage
      const deleteSql = `
        DELETE FROM usage_agg
        WHERE user_id = (SELECT id FROM users WHERE casdoor_user_id = ?)
        AND period = ?
      `;

      this.db.run(deleteSql, [userId, currentPeriod], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async syncSubscriptionFromCasdoor(userId, casdoorSubscriptionData) {
    try {
      const { plan, status, startTime, endTime } = casdoorSubscriptionData;

      if (status === 'Active') {
        await this.createSubscription({
          userId,
          planCode: plan,
          paymentId: null,
          startAt: startTime,
          endAt: endTime,
          provider: 'casdoor'
        });
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  async getExpiredSubscriptions() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT s.*, u.casdoor_user_id
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'active' AND s.end_at < datetime('now')
      `;

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async expireSubscription(subscriptionId) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE subscriptions SET status = 'expired' WHERE id = ?`;

      this.db.run(sql, [subscriptionId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
        } else {
          logger.info('Database connection closed');
        }
      });
    }
  }
}

module.exports = new DatabaseService();
