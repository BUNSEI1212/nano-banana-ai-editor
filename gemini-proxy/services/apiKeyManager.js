const logger = require('../utils/logger');

class ApiKeyManager {
  constructor() {
    this.apiKeys = [];
    this.keyStats = new Map();
    this.currentKeyIndex = 0;
    this.loadApiKeys();
  }

  // 加载API密钥
  loadApiKeys() {
    const keys = [];

    // 检查是否使用中转API
    if (process.env.USE_RELAY_API === 'true') {
      // 使用中转API配置
      if (process.env.RELAY_API_KEY) {
        keys.push({
          key: process.env.RELAY_API_KEY,
          name: 'relay_api',
          maxQPM: 1000, // 中转API通常有更高的限制
          maxDaily: 10000,
          priority: 1,
          isRelayApi: true
        });
        logger.info('🔄 Using Relay API configuration');
      }
    } else {
      // 传统的直连API配置
      // 加载多个API密钥
      let index = 1;
      while (process.env[`GEMINI_API_KEY_${index}`]) {
        const key = process.env[`GEMINI_API_KEY_${index}`];
        keys.push({
          key: key,
          name: `key_${index}`,
          maxQPM: parseInt(process.env.GEMINI_MAX_QPM) || 60,
          maxDaily: parseInt(process.env.GEMINI_MAX_DAILY) || 1000,
          priority: index,
          isRelayApi: false
        });
        index++;
      }

      // 向后兼容：如果没有找到多密钥配置，尝试单密钥
      if (keys.length === 0 && process.env.GEMINI_API_KEY) {
        keys.push({
          key: process.env.GEMINI_API_KEY,
          name: 'primary',
          maxQPM: parseInt(process.env.GEMINI_MAX_QPM) || 60,
          maxDaily: parseInt(process.env.GEMINI_MAX_DAILY) || 1000,
          priority: 1,
          isRelayApi: false
        });
      }
    }

    if (keys.length === 0) {
      logger.error('❌ No API keys configured! Please set RELAY_API_KEY or GEMINI_API_KEY environment variables.');
      throw new Error('No API keys configured');
    }

    this.apiKeys = keys;
    
    // 初始化密钥统计
    this.apiKeys.forEach(keyConfig => {
      this.keyStats.set(keyConfig.key, {
        name: keyConfig.name,
        requestCount: 0,
        errorCount: 0,
        lastUsed: null,
        lastError: null,
        isDisabled: false,
        dailyCount: 0,
        lastDailyReset: new Date().toDateString(),
        maxQPM: keyConfig.maxQPM,
        maxDaily: keyConfig.maxDaily,
        isRelayApi: keyConfig.isRelayApi
      });
    });

    logger.info(`✅ Loaded ${this.apiKeys.length} API key(s):`, 
      this.apiKeys.map(k => ({ name: k.name, isRelay: k.isRelayApi })));
  }

  // 获取下一个可用的API密钥
  getNextApiKey() {
    if (this.apiKeys.length === 0) {
      throw new Error('No API keys available');
    }

    // 重置每日计数（如果需要）
    this.resetDailyCountsIfNeeded();

    // 找到可用的密钥
    const availableKeys = this.apiKeys.filter(keyConfig => {
      const stats = this.keyStats.get(keyConfig.key);
      return !stats.isDisabled && stats.dailyCount < keyConfig.maxDaily;
    });

    if (availableKeys.length === 0) {
      throw new Error('所有API密钥都已达到每日限制或被禁用');
    }

    // 使用轮询策略选择密钥
    this.currentKeyIndex = (this.currentKeyIndex + 1) % availableKeys.length;
    const selectedKey = availableKeys[this.currentKeyIndex];

    // 更新使用统计
    const stats = this.keyStats.get(selectedKey.key);
    stats.requestCount++;
    stats.dailyCount++;
    stats.lastUsed = new Date();

    logger.debug(`Selected API key: ${selectedKey.name} (${stats.requestCount} requests, ${stats.dailyCount} daily)`);
    
    return selectedKey.key;
  }

  // 记录密钥错误
  recordKeyError(apiKey, error) {
    const stats = this.keyStats.get(apiKey);
    if (stats) {
      stats.errorCount++;
      stats.lastError = {
        message: error.message,
        timestamp: new Date(),
        statusCode: error.response?.status
      };

      // 如果错误率过高，暂时禁用密钥
      const errorRate = stats.errorCount / Math.max(stats.requestCount, 1);
      if (errorRate > 0.5 && stats.requestCount > 5) {
        stats.isDisabled = true;
        logger.warn(`🚫 Disabled API key ${stats.name} due to high error rate: ${(errorRate * 100).toFixed(1)}%`);
        
        // 10分钟后重新启用
        setTimeout(() => {
          stats.isDisabled = false;
          logger.info(`✅ Re-enabled API key ${stats.name}`);
        }, 10 * 60 * 1000);
      }

      logger.warn(`API key ${stats.name} error:`, {
        error: error.message,
        errorCount: stats.errorCount,
        requestCount: stats.requestCount,
        errorRate: `${(errorRate * 100).toFixed(1)}%`
      });
    }
  }

  // 重置每日计数
  resetDailyCountsIfNeeded() {
    const today = new Date().toDateString();
    
    this.keyStats.forEach((stats, key) => {
      if (stats.lastDailyReset !== today) {
        stats.dailyCount = 0;
        stats.lastDailyReset = today;
        logger.debug(`Reset daily count for key ${stats.name}`);
      }
    });
  }

  // 检查是否有可用的密钥
  hasAvailableKeys() {
    this.resetDailyCountsIfNeeded();
    
    return this.apiKeys.some(keyConfig => {
      const stats = this.keyStats.get(keyConfig.key);
      return !stats.isDisabled && stats.dailyCount < keyConfig.maxDaily;
    });
  }

  // 获取密钥统计信息
  getKeyStats() {
    const stats = [];
    
    this.apiKeys.forEach(keyConfig => {
      const keyStats = this.keyStats.get(keyConfig.key);
      stats.push({
        name: keyConfig.name,
        isRelayApi: keyConfig.isRelayApi,
        requestCount: keyStats.requestCount,
        errorCount: keyStats.errorCount,
        dailyCount: keyStats.dailyCount,
        maxDaily: keyConfig.maxDaily,
        isDisabled: keyStats.isDisabled,
        lastUsed: keyStats.lastUsed,
        lastError: keyStats.lastError,
        errorRate: keyStats.requestCount > 0 ? 
          `${((keyStats.errorCount / keyStats.requestCount) * 100).toFixed(1)}%` : '0%'
      });
    });
    
    return {
      totalKeys: this.apiKeys.length,
      availableKeys: this.apiKeys.filter(keyConfig => {
        const stats = this.keyStats.get(keyConfig.key);
        return !stats.isDisabled && stats.dailyCount < keyConfig.maxDaily;
      }).length,
      keys: stats
    };
  }

  // 手动重新启用所有密钥
  enableAllKeys() {
    this.keyStats.forEach((stats, key) => {
      stats.isDisabled = false;
      stats.errorCount = 0;
      stats.lastError = null;
    });
    
    logger.info('✅ All API keys have been re-enabled');
  }

  // 手动重置每日计数
  resetDailyCounts() {
    const today = new Date().toDateString();
    
    this.keyStats.forEach((stats, key) => {
      stats.dailyCount = 0;
      stats.lastDailyReset = today;
    });
    
    logger.info('✅ Daily counts reset for all API keys');
  }
}

module.exports = ApiKeyManager;
