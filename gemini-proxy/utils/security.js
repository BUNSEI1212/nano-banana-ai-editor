const crypto = require('crypto');
const logger = require('./logger');

class SecurityUtils {
  constructor() {
    // Store recent nonces to prevent replay attacks
    this.recentNonces = new Map();
    this.nonceCleanupInterval = 5 * 60 * 1000; // 5 minutes
    
    // Start cleanup interval
    setInterval(() => {
      this.cleanupExpiredNonces();
    }, this.nonceCleanupInterval);
  }

  /**
   * Validate request timestamp and nonce to prevent replay attacks
   * @param {number} timestamp Request timestamp
   * @param {string} nonce Request nonce
   * @param {number} maxAge Maximum age in milliseconds (default: 5 minutes)
   * @returns {Object} Validation result
   */
  validateRequestSecurity(timestamp, nonce, maxAge = 5 * 60 * 1000) {
    try {
      // 1. Validate timestamp
      const now = Date.now();
      const requestAge = now - timestamp;
      
      if (requestAge > maxAge) {
        return {
          valid: false,
          error: 'Request expired',
          code: 'REQUEST_EXPIRED'
        };
      }
      
      if (requestAge < -60000) { // Allow 1 minute clock skew
        return {
          valid: false,
          error: 'Request timestamp is in the future',
          code: 'INVALID_TIMESTAMP'
        };
      }
      
      // 2. Validate nonce (prevent replay attacks)
      if (!nonce || typeof nonce !== 'string' || nonce.length < 16) {
        return {
          valid: false,
          error: 'Invalid nonce format',
          code: 'INVALID_NONCE'
        };
      }
      
      // 3. Check if nonce was already used
      if (this.recentNonces.has(nonce)) {
        logger.warn(`Replay attack detected: nonce ${nonce} already used`);
        return {
          valid: false,
          error: 'Nonce already used',
          code: 'REPLAY_ATTACK'
        };
      }
      
      // 4. Store nonce with expiration
      this.recentNonces.set(nonce, {
        timestamp: now,
        expires: now + maxAge
      });
      
      return {
        valid: true,
        requestAge
      };
      
    } catch (error) {
      logger.error('Security validation error:', error);
      return {
        valid: false,
        error: 'Security validation failed',
        code: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Clean up expired nonces
   */
  cleanupExpiredNonces() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [nonce, data] of this.recentNonces.entries()) {
      if (data.expires < now) {
        this.recentNonces.delete(nonce);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired nonces`);
    }
  }

  /**
   * Generate a secure random nonce
   * @param {number} length Nonce length in bytes (default: 16)
   * @returns {string} Hex-encoded nonce
   */
  generateNonce(length = 16) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Rate limiting check for activation attempts
   * @param {string} identifier Device ID or IP address
   * @param {number} maxAttempts Maximum attempts per window
   * @param {number} windowMs Time window in milliseconds
   * @returns {Object} Rate limit result
   */
  checkActivationRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const key = `activation_${identifier}`;
    const now = Date.now();
    
    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map();
    }
    
    const record = this.rateLimitStore.get(key) || {
      attempts: 0,
      windowStart: now
    };
    
    // Reset window if expired
    if (now - record.windowStart > windowMs) {
      record.attempts = 0;
      record.windowStart = now;
    }
    
    // Check if limit exceeded
    if (record.attempts >= maxAttempts) {
      const resetTime = record.windowStart + windowMs;
      return {
        allowed: false,
        attempts: record.attempts,
        maxAttempts,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000)
      };
    }
    
    // Increment attempts
    record.attempts++;
    this.rateLimitStore.set(key, record);
    
    return {
      allowed: true,
      attempts: record.attempts,
      maxAttempts,
      remaining: maxAttempts - record.attempts
    };
  }

  /**
   * Validate device fingerprint consistency
   * @param {Object} currentDevice Current device info
   * @param {Object} storedDevice Stored device info
   * @returns {Object} Validation result
   */
  validateDeviceConsistency(currentDevice, storedDevice) {
    try {
      // Core hardware characteristics that shouldn't change
      const coreFields = ['platform', 'arch', 'cpus', 'totalmem'];
      const inconsistencies = [];
      
      for (const field of coreFields) {
        if (currentDevice[field] !== storedDevice[field]) {
          inconsistencies.push({
            field,
            current: currentDevice[field],
            stored: storedDevice[field]
          });
        }
      }
      
      // Network interfaces can change, so we're more lenient
      const currentMacs = currentDevice.networkInterfaces || [];
      const storedMacs = storedDevice.networkInterfaces || [];
      const commonMacs = currentMacs.filter(mac => storedMacs.includes(mac));
      
      // At least one MAC address should match
      if (currentMacs.length > 0 && storedMacs.length > 0 && commonMacs.length === 0) {
        inconsistencies.push({
          field: 'networkInterfaces',
          current: currentMacs,
          stored: storedMacs,
          message: 'No common network interfaces found'
        });
      }
      
      const suspiciousLevel = this.calculateSuspiciousLevel(inconsistencies);
      
      return {
        valid: suspiciousLevel < 0.7, // Allow some flexibility
        suspiciousLevel,
        inconsistencies,
        recommendation: this.getSecurityRecommendation(suspiciousLevel)
      };
      
    } catch (error) {
      logger.error('Device consistency validation error:', error);
      return {
        valid: false,
        error: 'Device validation failed'
      };
    }
  }

  /**
   * Calculate suspicious level based on inconsistencies
   * @param {Array} inconsistencies List of inconsistencies
   * @returns {number} Suspicious level (0-1)
   */
  calculateSuspiciousLevel(inconsistencies) {
    if (inconsistencies.length === 0) return 0;
    
    const weights = {
      platform: 0.4,
      arch: 0.3,
      cpus: 0.2,
      totalmem: 0.1,
      networkInterfaces: 0.3
    };
    
    let totalWeight = 0;
    let suspiciousWeight = 0;
    
    for (const inconsistency of inconsistencies) {
      const weight = weights[inconsistency.field] || 0.1;
      totalWeight += weight;
      suspiciousWeight += weight;
    }
    
    return Math.min(suspiciousWeight / Math.max(totalWeight, 1), 1);
  }

  /**
   * Get security recommendation based on suspicious level
   * @param {number} level Suspicious level (0-1)
   * @returns {string} Security recommendation
   */
  getSecurityRecommendation(level) {
    if (level < 0.3) return 'ALLOW';
    if (level < 0.7) return 'MONITOR';
    return 'BLOCK';
  }

  /**
   * Hash sensitive data for logging
   * @param {string} data Sensitive data
   * @returns {string} Hashed data
   */
  hashForLogging(data) {
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
  }

  /**
   * Sanitize request data for logging
   * @param {Object} data Request data
   * @returns {Object} Sanitized data
   */
  sanitizeForLogging(data) {
    const sanitized = { ...data };
    
    // Remove or hash sensitive fields
    const sensitiveFields = ['activationCode', 'token', 'deviceId'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = this.hashForLogging(sanitized[field]);
      }
    }
    
    return sanitized;
  }
}

module.exports = new SecurityUtils();
