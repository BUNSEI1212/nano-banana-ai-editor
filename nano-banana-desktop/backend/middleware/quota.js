const dbService = require('../services/database');
const logger = require('../utils/logger');

const quotaMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.sub;

    // Skip quota check for Electron users (they use activation codes)
    if (req.user.isElectron || userId === 'electron-user') {
      return next();
    }

    // Get user's current usage and plan
    const userInfo = await dbService.getUserInfo(userId);
    const usage = await dbService.getUserUsage(userId);
    
    const monthlyCredits = userInfo.monthlyCredits || 3; // Default free tier
    const creditsUsed = usage.creditsUsed || 0;
    const creditsRemaining = monthlyCredits - creditsUsed;

    // Check if user has remaining credits
    if (creditsRemaining <= 0) {
      logger.warn(`User ${userId} exceeded quota: ${creditsUsed}/${monthlyCredits}`);
      return res.status(429).json({
        error: 'Quota exceeded',
        message: 'You have exceeded your monthly quota. Please upgrade your plan.',
        usage: {
          creditsUsed,
          monthlyCredits,
          creditsRemaining: 0
        },
        upgradeUrl: `${process.env.CASDOOR_ENDPOINT}/pricing`
      });
    }

    // Check concurrent requests (if applicable)
    const maxConcurrency = userInfo.maxConcurrency || 1;
    const activeRequests = await dbService.getActiveRequests(userId);
    
    if (activeRequests >= maxConcurrency) {
      logger.warn(`User ${userId} exceeded concurrency limit: ${activeRequests}/${maxConcurrency}`);
      return res.status(429).json({
        error: 'Concurrency limit exceeded',
        message: `You can only have ${maxConcurrency} concurrent requests. Please wait for current requests to complete.`,
        activeRequests,
        maxConcurrency
      });
    }

    // Add quota info to request for logging
    req.quota = {
      creditsUsed,
      monthlyCredits,
      creditsRemaining,
      maxConcurrency,
      activeRequests
    };

    next();
  } catch (error) {
    logger.error('Quota middleware error:', error);
    res.status(500).json({ error: 'Quota check failed' });
  }
};

module.exports = quotaMiddleware;
