const crypto = require('crypto');
const { createSigner, createVerifier } = require('fast-jwt');
const dbService = require('./database');
const logger = require('../utils/logger');

// Plans configuration (same as desktop app)
const PLANS = {
  1: { name: '🍌 尝鲜套餐', credits: 10, price: 13.9 },
  2: { name: '💎 基础套餐', credits: 100, price: 69.9 },
  3: { name: '🚀 高阶套餐', credits: 300, price: 199.9 },
  9: { name: '🎨 自定义套餐', credits: 0, price: 0 } // 自定义套餐，实际额度从激活码中提取
};

// Secret key for activation code validation (same as desktop app)
const ACTIVATION_SECRET_KEY = 'NB2024-SECRET-KEY-FOR-ACTIVATION';

// JWT configuration for activation tokens
const JWT_SECRET = process.env.ACTIVATION_JWT_SECRET || 'activation-jwt-secret-change-in-production';

const tokenSigner = createSigner({
  key: JWT_SECRET,
  algorithm: 'HS512',
  expiresIn: '30d'
});

const tokenVerifier = createVerifier({
  key: JWT_SECRET,
  algorithms: ['HS512'],
  cache: true,
  errorCacheTTL: 60000 // Cache errors for 1 minute
});

class ActivationService {
  // Validate activation code format and checksum
  validateActivationCode(code) {
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
      const serial = parseInt(baseCode.substring(5, 8), 16);
      // Use serial as a simple encoding for credits (you can modify this logic)
      const customCredits = Math.max(1, serial % 1000); // Extract credits from serial, minimum 1
      plan = {
        name: '🎨 自定义套餐',
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

  // Generate checksum for activation code (same algorithm as desktop app)
  generateChecksum(baseCode) {
    const hash = crypto.createHmac('sha256', ACTIVATION_SECRET_KEY)
                      .update(baseCode)
                      .digest('hex');
    return hash.substring(0, 4).toUpperCase();
  }

  // Generate device fingerprint hash
  generateDeviceFingerprint(deviceInfo) {
    const fingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(deviceInfo))
      .digest('hex');
    return fingerprint;
  }

  // Verify activation code and create activation
  async verifyAndActivate(activationCode, deviceInfo) {
    try {
      // 1. Validate activation code format
      const validation = this.validateActivationCode(activationCode);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 2. Check if activation code exists in database
      let codeRecord = await dbService.getActivationCode(activationCode);
      
      // If code doesn't exist, create it (for backward compatibility)
      if (!codeRecord) {
        await dbService.createActivationCode({
          code: activationCode,
          planType: validation.planType,
          credits: validation.plan.credits,
          price: validation.plan.price
        });
        codeRecord = await dbService.getActivationCode(activationCode);
      }

      // 3. Check if code is already used
      if (codeRecord.status === 'used') {
        throw new Error('此激活码已经使用过');
      }

      // 4. Check if code is expired
      if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
        throw new Error('此激活码已过期');
      }

      // 5. Generate device fingerprint
      const deviceId = this.generateDeviceFingerprint(deviceInfo);

      // 6. Check if this code is already activated on this device
      const existingActivation = await dbService.getActivation(activationCode, deviceId);
      if (existingActivation) {
        // Return existing activation with fresh token
        const token = tokenSigner({
          activationId: existingActivation.id,
          deviceId: deviceId,
          planType: validation.planType,
          type: 'activation'
        });

        return {
          success: true,
          token,
          activation: {
            id: existingActivation.id,
            planType: validation.planType,
            creditsGranted: existingActivation.credits_granted,
            creditsUsed: existingActivation.credits_used,
            creditsRemaining: existingActivation.creditsRemaining,
            activatedAt: existingActivation.activated_at
          }
        };
      }

      // 7. Create new activation
      const activation = await dbService.createActivation({
        activationCode,
        deviceId,
        deviceInfo,
        creditsGranted: validation.plan.credits
      });

      // 8. Mark activation code as used
      await dbService.markActivationCodeUsed(activationCode);

      // 9. Update device fingerprint
      await dbService.upsertDeviceFingerprint(deviceId, deviceInfo);

      // 10. Generate JWT token
      const token = tokenSigner({
        activationId: activation.id,
        deviceId: deviceId,
        planType: validation.planType,
        type: 'activation'
      });

      logger.info(`Activation successful: ${activationCode} on device ${deviceId.substring(0, 8)}...`);

      return {
        success: true,
        token,
        activation: {
          id: activation.id,
          planType: validation.planType,
          creditsGranted: activation.creditsGranted,
          creditsUsed: activation.creditsUsed,
          creditsRemaining: activation.creditsRemaining,
          activatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Activation verification failed:', error);
      throw error;
    }
  }

  // Verify activation token
  async verifyActivationToken(token) {
    try {
      const decoded = tokenVerifier(token);
      
      if (decoded.type !== 'activation') {
        throw new Error('Invalid token type');
      }

      // Get activation details
      const activation = await dbService.getActivationById(decoded.activationId);
      if (!activation) {
        throw new Error('Activation not found');
      }

      return {
        valid: true,
        activation: {
          id: activation.id,
          planType: activation.plan_type,
          creditsGranted: activation.credits_granted,
          creditsUsed: activation.credits_used,
          creditsRemaining: activation.creditsRemaining,
          deviceId: activation.device_id,
          activatedAt: activation.activated_at,
          lastUsedAt: activation.last_used_at
        }
      };
    } catch (error) {
      logger.error('Token verification failed:', error);
      return { valid: false, error: error.message };
    }
  }

  // Consume credits
  async consumeCredits(activationId, operationType, creditsToConsume = 1, requestMetadata = {}) {
    try {
      // Get current activation
      const activation = await dbService.getActivationById(activationId);
      if (!activation) {
        throw new Error('Activation not found');
      }

      // Check if enough credits available
      const creditsRemaining = activation.credits_granted - activation.credits_used;
      if (creditsRemaining < creditsToConsume) {
        throw new Error('Insufficient credits');
      }

      // Update activation usage
      await dbService.updateActivationUsage(activationId, creditsToConsume);

      // Record usage
      await dbService.recordActivationUsage({
        activationId,
        operationType,
        creditsConsumed: creditsToConsume,
        requestMetadata
      });

      logger.info(`Credits consumed: ${creditsToConsume} for activation ${activationId}, operation: ${operationType}`);

      return {
        success: true,
        creditsConsumed: creditsToConsume,
        creditsRemaining: creditsRemaining - creditsToConsume
      };
    } catch (error) {
      logger.error('Credit consumption failed:', error);
      throw error;
    }
  }

  // Get activation status
  async getActivationStatus(activationId) {
    try {
      const activation = await dbService.getActivationById(activationId);
      if (!activation) {
        throw new Error('Activation not found');
      }

      return {
        activated: true,
        planType: activation.plan_type,
        creditsGranted: activation.credits_granted,
        creditsUsed: activation.credits_used,
        creditsRemaining: activation.creditsRemaining,
        deviceId: activation.device_id,
        activatedAt: activation.activated_at,
        lastUsedAt: activation.last_used_at
      };
    } catch (error) {
      logger.error('Get activation status failed:', error);
      throw error;
    }
  }
}

module.exports = new ActivationService();
