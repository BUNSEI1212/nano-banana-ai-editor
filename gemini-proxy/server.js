const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import modules
const authMiddleware = require('./middleware/auth');
const quotaMiddleware = require('./middleware/quota');
const geminiService = require('./services/gemini');
const dbService = require('./services/database');
const logger = require('./utils/logger');

// Import activation routes
const activationRoutes = require('./routes/activation');

// Initialize database
dbService.init();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3000', 'https://your-domain.com'] 
    : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'gemini-proxy'
  });
});

// API Keys status endpoint
app.get('/api/keys/status', (req, res) => {
  try {
    const keyStats = geminiService.getApiKeyStats();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      keyStats: keyStats
    });
  } catch (error) {
    logger.error('Failed to get API key stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve API key statistics'
    });
  }
});

// Mount activation routes
app.use('/api/activation', activationRoutes);

// OAuth callback endpoint
app.post('/auth/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`${process.env.CASDOOR_ENDPOINT}/api/login/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.CASDOOR_CLIENT_ID,
        client_secret: process.env.CASDOOR_CLIENT_SECRET,
        code: code,
        redirect_uri: `${process.env.FRONTEND_URL}/oauth/callback`
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error('Token exchange failed:', errorText);
      return res.status(400).json({ error: 'Failed to exchange authorization code' });
    }

    const tokenData = await tokenResponse.json();

    // Get user info using the access token
    const userResponse = await fetch(`${process.env.CASDOOR_ENDPOINT}/api/get-account`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      logger.error('Failed to get user info');
      return res.status(400).json({ error: 'Failed to get user information' });
    }

    const userData = await userResponse.json();

    // Store user info in database if needed
    await dbService.upsertUser({
      id: userData.name,
      email: userData.email,
      displayName: userData.displayName,
      avatar: userData.avatar
    });

    res.json({
      token: tokenData.access_token,
      user: {
        id: userData.name,
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar
      }
    });
  } catch (error) {
    logger.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Authentication endpoint
app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const userInfo = await dbService.getUserInfo(userId);
    const usage = await dbService.getUserUsage(userId);
    
    res.json({
      userId: userId,
      email: req.user.email,
      roles: req.user.roles || [],
      plan: userInfo.plan || 'free',
      usage: {
        genCount: usage.genCount || 0,
        editCount: usage.editCount || 0,
        creditsRemaining: Math.max(0, (userInfo.monthlyCredits || 0) - (usage.creditsUsed || 0))
      }
    });
  } catch (error) {
    logger.error('Error getting user info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Gemini generate endpoint
app.post('/api/generate', authMiddleware, quotaMiddleware, async (req, res) => {
  try {
    const { prompt, refImages = [], options = {} } = req.body;
    const userId = req.user.sub;
    const requestId = require('uuid').v4();

    // Validate request
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    logger.info(`Generate request from user ${userId}:`, { requestId, prompt: prompt.substring(0, 100) });

    // Call Gemini API
    const result = await geminiService.generateImage({
      prompt,
      refImages,
      options,
      requestId
    });

    // Record usage
    await dbService.recordUsage({
      userId,
      type: 'generate',
      units: 1,
      requestId,
      metadata: { prompt: prompt.substring(0, 200) }
    });

    res.json({
      success: true,
      requestId,
      result
    });

  } catch (error) {
    logger.error('Generate error:', error);
    
    if (error.message.includes('quota')) {
      return res.status(429).json({ 
        error: 'Quota exceeded', 
        message: 'Please upgrade your plan or wait for quota reset' 
      });
    }
    
    res.status(500).json({ error: 'Generation failed' });
  }
});

// Gemini edit endpoint
app.post('/api/edit', authMiddleware, quotaMiddleware, async (req, res) => {
  try {
    const { imageId, mask, instruction, refImages = [] } = req.body;
    const userId = req.user.sub;
    const requestId = require('uuid').v4();

    // Validate request
    if (!imageId || !instruction) {
      return res.status(400).json({ error: 'ImageId and instruction are required' });
    }

    logger.info(`Edit request from user ${userId}:`, { requestId, imageId, instruction: instruction.substring(0, 100) });

    // Call Gemini API
    const result = await geminiService.editImage({
      imageId,
      mask,
      instruction,
      refImages,
      requestId
    });

    // Record usage
    await dbService.recordUsage({
      userId,
      type: 'edit',
      units: 1,
      requestId,
      metadata: { imageId, instruction: instruction.substring(0, 200) }
    });

    // Format response to match expected structure
    const response = {
      success: true,
      requestId,
      result: {
        images: result.images || [],
        content: result.images ? result.images.map(img => ({ inlineData: { data: img } })) : [],
        finishReason: result.finishReason,
        safetyRatings: result.safetyRatings,
        metadata: result.metadata
      }
    };

    res.json(response);

  } catch (error) {
    logger.error('Edit error:', error);
    
    if (error.message.includes('quota')) {
      return res.status(429).json({ 
        error: 'Quota exceeded', 
        message: 'Please upgrade your plan or wait for quota reset' 
      });
    }
    
    res.status(500).json({ error: 'Edit failed' });
  }
});

// Billing endpoints (placeholder for Casdoor integration)
app.get('/billing/plans', (req, res) => {
  res.json({
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'CNY',
        interval: 'month',
        features: {
          monthlyCredits: 3,
          maxConcurrency: 1
        },
        description: '免费用户每月3次图像生成额度'
      },
      {
        id: 'nano-banana-credits',
        name: 'Experience Pack',
        price: 13.9,
        currency: 'CNY',
        interval: 'one-time',
        features: {
          monthlyCredits: 20,
          maxConcurrency: 2
        },
        description: '体验套餐，一次性购买获得20次图像生成额度',
        popular: true
      },
      {
        id: 'lite-plan',
        name: 'Lite',
        price: 69.9,
        currency: 'CNY',
        interval: 'month',
        features: {
          monthlyCredits: 100,
          maxConcurrency: 2
        },
        description: '轻量套餐，每月100次图像生成额度'
      },
      {
        id: 'pro-plan',
        name: 'Pro',
        price: 199.9,
        currency: 'CNY',
        interval: 'month',
        features: {
          monthlyCredits: 500,
          maxConcurrency: 5
        },
        description: '专业套餐，每月500次图像生成额度，支持更高并发'
      }
    ]
  });
});

app.get('/billing/subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const subscription = await dbService.getUserSubscription(userId);
    res.json(subscription);
  } catch (error) {
    logger.error('Error getting subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Payment webhook endpoint for Casdoor
app.post('/billing/webhook/payment', async (req, res) => {
  try {
    const { userId, planId, paymentId, status, provider } = req.body;

    logger.info('Payment webhook received:', { userId, planId, paymentId, status, provider });

    if (status === 'paid' || status === 'completed') {
      // Activate subscription for the user
      const subscription = await dbService.activateSubscription(userId, planId, {
        paymentId,
        provider
      });

      logger.info('Subscription activated:', subscription);

      res.json({
        success: true,
        message: 'Subscription activated successfully',
        subscription
      });
    } else {
      logger.warn('Payment not completed:', { userId, planId, status });
      res.json({
        success: false,
        message: 'Payment not completed'
      });
    }
  } catch (error) {
    logger.error('Payment webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment webhook'
    });
  }
});

// Manual subscription activation endpoint (for testing)
app.post('/billing/activate-subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    logger.info('Manual subscription activation:', { userId, planId });

    const subscription = await dbService.activateSubscription(userId, planId, {
      provider: 'manual'
    });

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription
    });
  } catch (error) {
    logger.error('Manual subscription activation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate subscription'
    });
  }
});

// Subscription sync endpoint
app.post('/billing/sync-subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { subscriptionData } = req.body;

    logger.info('Syncing subscription from Casdoor:', { userId, subscriptionData });

    await dbService.syncSubscriptionFromCasdoor(userId, subscriptionData);

    res.json({
      success: true,
      message: 'Subscription synced successfully'
    });
  } catch (error) {
    logger.error('Subscription sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync subscription'
    });
  }
});

// Periodic task to check and expire subscriptions
const checkExpiredSubscriptions = async () => {
  try {
    const expiredSubs = await dbService.getExpiredSubscriptions();

    for (const sub of expiredSubs) {
      await dbService.expireSubscription(sub.id);
      logger.info('Expired subscription:', {
        subscriptionId: sub.id,
        userId: sub.casdoor_user_id,
        planCode: sub.plan_code
      });
    }

    if (expiredSubs.length > 0) {
      logger.info(`Processed ${expiredSubs.length} expired subscriptions`);
    }
  } catch (error) {
    logger.error('Error checking expired subscriptions:', error);
  }
};

// Run subscription check every hour
setInterval(checkExpiredSubscriptions, 60 * 60 * 1000);

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Gemini Proxy Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
