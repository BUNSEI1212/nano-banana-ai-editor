const express = require('express');
const router = express.Router();
const activationService = require('../services/activation');
const logger = require('../utils/logger');
const security = require('../utils/security');

// Middleware to verify activation token
const activationAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const verification = await activationService.verifyActivationToken(token);

    if (!verification.valid) {
      return res.status(401).json({ error: verification.error || 'Invalid token' });
    }

    req.activation = verification.activation;
    next();
  } catch (error) {
    logger.error('Activation auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Enhanced middleware with device consistency check
const enhancedActivationAuthMiddleware = async (req, res, next) => {
  try {
    // First run standard auth
    await new Promise((resolve, reject) => {
      activationAuthMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Additional device consistency check for sensitive operations
    const { deviceInfo } = req.body;
    if (deviceInfo && req.activation) {
      const dbService = require('../services/database');
      const storedActivation = await dbService.getActivationById(req.activation.id);

      if (storedActivation && storedActivation.device_info) {
        const storedDeviceInfo = JSON.parse(storedActivation.device_info);
        const consistencyCheck = security.validateDeviceConsistency(deviceInfo, storedDeviceInfo);

        if (!consistencyCheck.valid) {
          logger.warn(`Device consistency check failed for activation ${req.activation.id}`, {
            suspiciousLevel: consistencyCheck.suspiciousLevel,
            inconsistencies: consistencyCheck.inconsistencies,
            recommendation: consistencyCheck.recommendation
          });

          if (consistencyCheck.recommendation === 'BLOCK') {
            return res.status(403).json({
              error: 'Device verification failed',
              code: 'DEVICE_MISMATCH'
            });
          }
        }

        // Log device consistency for monitoring
        req.deviceConsistency = consistencyCheck;
      }
    }

    next();
  } catch (error) {
    logger.error('Enhanced activation auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// POST /api/activation/verify - Verify activation code and create activation
router.post('/verify', async (req, res) => {
  try {
    const { activationCode, deviceInfo, timestamp, nonce } = req.body;

    // Validate request
    if (!activationCode) {
      return res.status(400).json({ error: 'Activation code is required' });
    }

    if (!deviceInfo) {
      return res.status(400).json({ error: 'Device info is required' });
    }

    // Security validation: timestamp and nonce
    const securityCheck = security.validateRequestSecurity(timestamp, nonce);
    if (!securityCheck.valid) {
      logger.warn(`Security check failed: ${securityCheck.error}`, {
        code: securityCheck.code,
        activationCode: security.hashForLogging(activationCode)
      });
      return res.status(400).json({
        error: securityCheck.error,
        code: securityCheck.code
      });
    }

    // Rate limiting check
    const deviceFingerprint = activationService.generateDeviceFingerprint(deviceInfo);
    const rateLimit = security.checkActivationRateLimit(deviceFingerprint);

    if (!rateLimit.allowed) {
      logger.warn(`Rate limit exceeded for device: ${security.hashForLogging(deviceFingerprint)}`, {
        attempts: rateLimit.attempts,
        retryAfter: rateLimit.retryAfter
      });
      return res.status(429).json({
        error: 'Too many activation attempts',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimit.retryAfter
      });
    }

    // Log sanitized request
    logger.info(`Activation verification request from device ${deviceInfo.platform}-${deviceInfo.arch}`, {
      ...security.sanitizeForLogging({ activationCode, deviceInfo }),
      requestAge: securityCheck.requestAge,
      attempts: rateLimit.attempts
    });

    // Verify and activate
    const result = await activationService.verifyAndActivate(activationCode, deviceInfo);

    // Log successful activation
    logger.info(`Activation successful`, {
      activationCode: security.hashForLogging(activationCode),
      deviceId: security.hashForLogging(result.activation?.id || 'unknown'),
      planType: result.activation?.planType
    });

    res.json(result);
  } catch (error) {
    logger.error('Activation verification error:', error);
    res.status(400).json({
      error: error.message || 'Activation verification failed',
      code: 'ACTIVATION_FAILED'
    });
  }
});

// GET /api/activation/status - Get activation status
router.get('/status', activationAuthMiddleware, async (req, res) => {
  try {
    const status = await activationService.getActivationStatus(req.activation.id);
    res.json(status);
  } catch (error) {
    logger.error('Get activation status error:', error);
    res.status(500).json({ error: 'Failed to get activation status' });
  }
});

// POST /api/activation/consume - Consume credits
router.post('/consume', enhancedActivationAuthMiddleware, async (req, res) => {
  try {
    const { operation, credits = 1, metadata = {} } = req.body;

    if (!operation) {
      return res.status(400).json({ error: 'Operation type is required' });
    }

    const result = await activationService.consumeCredits(
      req.activation.id,
      operation,
      credits,
      metadata
    );

    res.json(result);
  } catch (error) {
    logger.error('Credit consumption error:', error);
    res.status(400).json({ 
      error: error.message || 'Credit consumption failed',
      code: 'CREDIT_CONSUMPTION_FAILED'
    });
  }
});

// GET /api/activation/plans - Get available plans
router.get('/plans', (req, res) => {
  const plans = {
    1: { name: '🍌 尝鲜套餐', credits: 10, price: 13.9 },
    2: { name: '💎 基础套餐', credits: 100, price: 69.9 },
    3: { name: '🚀 高阶套餐', credits: 300, price: 199.9 },
    9: { name: '🎨 自定义套餐', credits: 0, price: 0 } // 自定义套餐
  };

  res.json({ plans });
});

// POST /api/activation/refresh - Refresh activation token
router.post('/refresh', activationAuthMiddleware, async (req, res) => {
  try {
    // Generate new token with same activation data
    const { createSigner } = require('fast-jwt');
    const JWT_SECRET = process.env.ACTIVATION_JWT_SECRET || 'activation-jwt-secret-change-in-production';
    
    const tokenSigner = createSigner({
      key: JWT_SECRET,
      algorithm: 'HS512',
      expiresIn: '30d'
    });

    const newToken = tokenSigner({
      activationId: req.activation.id,
      deviceId: req.activation.deviceId,
      planType: req.activation.planType,
      type: 'activation'
    });

    res.json({
      success: true,
      token: newToken,
      activation: req.activation
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Health check for activation service
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'activation-service',
    timestamp: new Date().toISOString()
  });
});

// Security monitoring endpoint (admin only)
router.get('/security/stats', (req, res) => {
  // This would typically require admin authentication
  // For now, just return basic stats

  const stats = {
    recentNonces: security.recentNonces ? security.recentNonces.size : 0,
    rateLimitStore: security.rateLimitStore ? security.rateLimitStore.size : 0,
    timestamp: new Date().toISOString()
  };

  res.json(stats);
});

// Generate secure nonce for client use
router.get('/nonce', (req, res) => {
  const nonce = security.generateNonce();
  res.json({
    nonce,
    timestamp: Date.now(),
    expiresIn: 5 * 60 * 1000 // 5 minutes
  });
});

module.exports = router;
