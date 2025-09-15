const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const DeviceFingerprint = require('./deviceFingerprint');

// Activation code plans
const PLANS = {
  1: { name: '尝鲜套餐', credits: 10, price: 13.9 },
  2: { name: '基础套餐', credits: 100, price: 69.9 },
  3: { name: '高阶套餐', credits: 300, price: 199.9 },
  9: { name: '自定义套餐', credits: 0, price: 0 } // 自定义套餐，实际额度从激活码中提取
};

class ActivationManager {
  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'activation.json');
    this.secretKey = 'NB2024-SECRET-KEY-FOR-ACTIVATION'; // In production, this should be more secure
  }

  // Generate activation code (for admin use)
  generateCode(planType, serial) {
    const planPrefix = planType.toString();
    const serialHex = serial.toString(16).padStart(3, '0').toUpperCase();
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    
    // Create base code
    const baseCode = `${planPrefix}${randomHex}${serialHex}`;
    
    // Generate checksum
    const checksum = this.generateChecksum(baseCode);
    
    // Format: NB-XXXX-YYYY-ZZZZ
    return `NB-${baseCode.substring(0, 4)}-${baseCode.substring(4, 8)}-${checksum}`;
  }

  // Generate checksum for activation code
  generateChecksum(baseCode) {
    const hash = crypto.createHmac('sha256', this.secretKey)
                      .update(baseCode)
                      .digest('hex');
    return hash.substring(0, 4).toUpperCase();
  }

  // Validate activation code format and checksum
  validateCode(code) {
    // Check format: NB-XXXX-XXXX-XXXX
    const codeRegex = /^NB-([A-F0-9]{4})-([A-F0-9]{4})-([A-F0-9]{4})$/;
    const match = code.match(codeRegex);
    
    if (!match) {
      return { valid: false, error: '激活码格式错误' };
    }

    const [, part1, part2, checksum] = match;
    const baseCode = part1 + part2;
    
    // Verify checksum
    const expectedChecksum = this.generateChecksum(baseCode);
    if (checksum !== expectedChecksum) {
      return { valid: false, error: '激活码无效' };
    }

    // Extract plan type
    const planType = parseInt(baseCode.charAt(0));
    if (!PLANS[planType]) {
      return { valid: false, error: '未知的套餐类型' };
    }

    // For custom plans (planType = 9), we need to extract credits from the code
    let plan = PLANS[planType];
    if (planType === 9) {
      // For custom plans, extract credits from the serial number part
      // This is a simplified approach - in production you might want to store custom plan details in a database
      const serial = parseInt(baseCode.substring(5, 8), 16);
      // Use serial as a simple encoding for credits (you can modify this logic)
      const customCredits = Math.max(1, serial % 1000); // Extract credits from serial, minimum 1
      plan = {
        name: '自定义套餐',
        credits: customCredits,
        price: 0 // Price will be determined by the generator
      };
    }

    return {
      valid: true,
      planType,
      plan,
      serial: parseInt(baseCode.substring(5, 8), 16)
    };
  }

  // Load activation data from file
  async loadActivationData() {
    try {
      const data = await fs.readFile(this.dbPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is corrupted, return default
      return {
        isActivated: false,
        activationCode: null,
        planType: null,
        totalCredits: 0,
        usedCredits: 0,
        activatedAt: null,
        usageHistory: [],
        activationHistory: []
      };
    }
  }

  // Save activation data to file
  async saveActivationData(data) {
    try {
      await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
      throw new Error('保存激活数据失败: ' + error.message);
    }
  }

  // Check if app is activated (enhanced with server mode support)
  async checkActivationStatus() {
    const data = await this.loadActivationData();

    if (!data.isActivated) {
      return false;
    }

    // If in server mode, try to sync with server
    if (data.serverMode && data.token) {
      try {
        const syncResult = await this.syncWithServer();
        if (syncResult.success) {
          return syncResult.creditsRemaining > 0;
        }
        // If sync fails, fall back to offline mode
        return this.handleOfflineMode(data);
      } catch (error) {
        console.warn('Server sync failed, using offline mode:', error);
        return this.handleOfflineMode(data);
      }
    }

    // Local mode
    return data.totalCredits > data.usedCredits;
  }

  // Sync activation status with server
  async syncWithServer() {
    try {
      const data = await this.loadActivationData();

      if (!data.serverMode || !data.token) {
        throw new Error('Not in server mode');
      }

      const proxyUrl = process.env.PROXY_ENDPOINT || 'http://localhost:3002';
      const response = await fetch(`${proxyUrl}/api/activation/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Server sync failed: ${response.status}`);
      }

      const result = await response.json();

      // Update local data with server data
      const updatedData = {
        ...data,
        creditsRemaining: result.creditsRemaining,
        usedCredits: result.creditsUsed,
        totalCredits: result.creditsGranted,
        lastSyncAt: new Date().toISOString()
      };

      await this.saveActivationData(updatedData);

      return {
        success: true,
        creditsRemaining: result.creditsRemaining,
        creditsUsed: result.creditsUsed,
        totalCredits: result.creditsGranted
      };

    } catch (error) {
      console.error('Server sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle offline mode with grace period
  handleOfflineMode(data) {
    const offlineGracePeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
    const lastSync = new Date(data.lastSyncAt || data.activatedAt);
    const now = new Date();

    if (now - lastSync > offlineGracePeriod) {
      console.warn('Offline grace period expired');
      return false; // Require online verification
    }

    // Allow limited offline usage
    const offlineCreditsLimit = Math.min(data.creditsRemaining || 0, 10);
    return offlineCreditsLimit > 0;
  }

  // Activate the application with a code (enhanced with server verification support)
  async activateCode(activationCode) {
    try {
      // 1. First perform local format validation
      const localValidation = this.validateCode(activationCode);
      if (!localValidation.valid) {
        return { success: false, error: localValidation.error };
      }

      // 2. Check if server verification is enabled
      const serverVerificationEnabled = process.env.ENABLE_SERVER_VERIFICATION === 'true';

      if (serverVerificationEnabled) {
        // 3. Use server verification mode
        return await this.activateWithServerVerification(activationCode);
      } else {
        // 4. Use local verification mode (existing logic)
        return await this.activateWithLocalVerification(activationCode);
      }
    } catch (error) {
      console.error('Activation error:', error);
      return {
        success: false,
        error: '激活过程中发生错误，请重试'
      };
    }
  }

  // Server verification mode (new)
  async activateWithServerVerification(activationCode) {
    try {
      // 1. Generate device fingerprint
      const { deviceId, deviceInfo } = DeviceFingerprint.generate();

      // 2. Get secure nonce from server (optional, fallback to local generation)
      let nonce;
      try {
        const proxyUrl = process.env.PROXY_ENDPOINT || 'http://localhost:3002';
        const nonceResponse = await fetch(`${proxyUrl}/api/activation/nonce`);
        if (nonceResponse.ok) {
          const nonceData = await nonceResponse.json();
          nonce = nonceData.nonce;
        } else {
          nonce = crypto.randomBytes(16).toString('hex');
        }
      } catch (error) {
        // Fallback to local nonce generation
        nonce = crypto.randomBytes(16).toString('hex');
      }

      // 3. Prepare request with anti-replay protection
      const requestData = {
        activationCode,
        deviceInfo,
        timestamp: Date.now(),
        nonce
      };

      // 4. Send verification request to server
      const proxyUrl = process.env.PROXY_ENDPOINT || 'http://localhost:3002';
      const response = await fetch(`${proxyUrl}/api/activation/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Server verification failed' };
      }

      const result = await response.json();

      // 5. Save activation data with server mode flag
      const activationData = {
        isActivated: true,
        activationId: result.activation.id,
        activationCode,
        planType: result.activation.planType,
        totalCredits: result.activation.creditsGranted,
        usedCredits: 0, // Server tracks usage
        creditsRemaining: result.activation.creditsRemaining,
        deviceId,
        token: result.token,
        activatedAt: result.activation.activatedAt,
        lastSyncAt: new Date().toISOString(),
        serverMode: true,  // Mark as server verification mode
        usageHistory: [],
        activationHistory: [{
          code: activationCode,
          activatedAt: result.activation.activatedAt,
          planType: result.activation.planType,
          credits: result.activation.creditsGranted,
          serverMode: true
        }]
      };

      await this.saveActivationData(activationData);

      console.log('Server activation successful:', activationCode);

      return {
        success: true,
        data: {
          plan: PLANS[result.activation.planType],
          credits: result.activation.creditsGranted,
          totalCredits: result.activation.creditsGranted,
          remainingCredits: result.activation.creditsRemaining,
          serverMode: true
        }
      };

    } catch (error) {
      console.error('Server verification failed:', error);

      // Fallback to local verification if server is unreachable
      console.log('Falling back to local verification...');
      return await this.activateWithLocalVerification(activationCode);
    }
  }

  // Local verification mode (existing logic, preserved for backward compatibility)
  async activateWithLocalVerification(activationCode) {
    // Load current activation data
    const data = await this.loadActivationData();

    // Check if already activated with this code
    const activationHistory = data.activationHistory || [];
    const alreadyUsed = activationHistory.find(record => record.code === activationCode);
    if (alreadyUsed) {
      return { success: false, error: '此激活码已经使用过' };
    }

    // Get validation from local check (already done in parent method)
    const validation = this.validateCode(activationCode);

    // Calculate new credits (add to existing credits)
    const currentRemainingCredits = Math.max(0, data.totalCredits - data.usedCredits);
    const newTotalCredits = data.totalCredits + validation.plan.credits;

    // Create activation record
    const activationRecord = {
      code: activationCode,
      planType: validation.planType,
      credits: validation.plan.credits,
      activatedAt: new Date().toISOString(),
      serverMode: false  // Mark as local verification
    };

    // Update activation data
    const newData = {
      isActivated: true,
      activationCode: data.activationCode || activationCode, // Keep first activation code as primary
      planType: data.planType || validation.planType, // Keep original plan type or set new one
      totalCredits: newTotalCredits,
      usedCredits: data.usedCredits || 0,
      activatedAt: data.activatedAt || new Date().toISOString(), // Keep original activation time
      usageHistory: data.usageHistory || [],
      activationHistory: [...activationHistory, activationRecord],
      serverMode: false  // Mark as local verification mode
    };

    await this.saveActivationData(newData);

    return {
      success: true,
      data: {
        plan: validation.plan,
        credits: validation.plan.credits,
        totalCredits: newTotalCredits,
        remainingCredits: newTotalCredits - (data.usedCredits || 0),
        serverMode: false
      }
    };
  }

  // Get remaining credits
  async getRemainingCredits() {
    const data = await this.loadActivationData();
    
    if (!data.isActivated) {
      return 0;
    }

    return Math.max(0, data.totalCredits - data.usedCredits);
  }

  // Use credits (enhanced with server mode support)
  async useCredits(count = 1, operationType = 'generate', requestMetadata = {}) {
    const data = await this.loadActivationData();

    if (!data.isActivated) {
      throw new Error('应用未激活');
    }

    // If in server mode, consume credits on server
    if (data.serverMode && data.token) {
      try {
        return await this.useCreditsOnServer(count, operationType, requestMetadata);
      } catch (error) {
        console.warn('Server credit consumption failed, using local mode:', error);
        // Fall back to local mode
      }
    }

    // Local mode credit consumption
    const remaining = data.totalCredits - data.usedCredits;
    if (remaining < count) {
      throw new Error('额度不足');
    }

    // Update usage
    data.usedCredits += count;
    data.usageHistory.push({
      timestamp: new Date().toISOString(),
      creditsUsed: count,
      remainingCredits: data.totalCredits - data.usedCredits,
      operationType,
      metadata: requestMetadata
    });

    await this.saveActivationData(data);

    return data.totalCredits - data.usedCredits;
  }

  // Use credits on server
  async useCreditsOnServer(count, operationType, requestMetadata) {
    try {
      const data = await this.loadActivationData();

      const proxyUrl = process.env.PROXY_ENDPOINT || 'http://localhost:3002';
      const response = await fetch(`${proxyUrl}/api/activation/consume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: operationType,
          credits: count,
          metadata: requestMetadata
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Server credit consumption failed');
      }

      const result = await response.json();

      // Update local data
      const updatedData = {
        ...data,
        creditsRemaining: result.creditsRemaining,
        lastSyncAt: new Date().toISOString()
      };

      await this.saveActivationData(updatedData);

      return result.creditsRemaining;

    } catch (error) {
      console.error('Server credit consumption failed:', error);
      throw error;
    }
  }

  // Get activation info
  async getActivationInfo() {
    const data = await this.loadActivationData();
    
    if (!data.isActivated) {
      return { activated: false };
    }

    return {
      activated: true,
      planType: data.planType,
      plan: PLANS[data.planType],
      totalCredits: data.totalCredits,
      usedCredits: data.usedCredits,
      remainingCredits: data.totalCredits - data.usedCredits,
      activatedAt: data.activatedAt
    };
  }

  // Reset activation (for testing)
  async resetActivation() {
    const defaultData = {
      isActivated: false,
      activationCode: null,
      planType: null,
      totalCredits: 0,
      usedCredits: 0,
      activatedAt: null,
      usageHistory: []
    };

    await this.saveActivationData(defaultData);
  }
}

module.exports = ActivationManager;
