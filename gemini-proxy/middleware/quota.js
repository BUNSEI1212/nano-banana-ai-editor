const dbService = require('../services/database');
const logger = require('../utils/logger');

const quotaMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.sub;

    // Skip quota check for desktop app with unlimited quota
    if (req.user.quota && req.user.quota.unlimited) {
      req.quota = {
        creditsUsed: 0,
        monthlyCredits: 999999,
        creditsRemaining: 999999,
        maxConcurrency: 10,
        activeRequests: 0
      };
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
        message: `You can only have ${maxConcurrency} concurrent request(s). Please wait for your current request to complete.`,
        usage: {
          activeRequests,
          maxConcurrency
        }
      });
    }

    // Attach quota info to request for later use
    req.quota = {
      creditsUsed,
      monthlyCredits,
      creditsRemaining,
      maxConcurrency,
      activeRequests
    };

    logger.debug(`Quota check passed for user ${userId}:`, req.quota);
    next();

  } catch (error) {
    logger.error('Quota middleware error:', error);
    res.status(500).json({ error: 'Failed to check quota' });
  }
};

module.exports = quotaMiddleware;
