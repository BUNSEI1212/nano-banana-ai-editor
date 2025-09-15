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
        features: JSON.stringify({ maxConcurrency: 2, price: 13.9, currency: 'CNY', interval: 'one-time' }),
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
