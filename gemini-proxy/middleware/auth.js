const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const logger = require('../utils/logger');

// JWKS client for Casdoor
const client = jwksClient({
  jwksUri: `${process.env.CASDOOR_ENDPOINT}/.well-known/jwks`,
  requestHeaders: {}, // Optional
  timeout: 30000, // Defaults to 30s
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      logger.error('Error getting signing key:', err);
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Special handling for Electron desktop app
    if (token === 'electron-app') {
      req.user = {
        sub: 'electron-user',
        name: 'Electron Desktop App',
        email: 'electron@nanobanana.local',
        // Add unlimited quota for desktop app
        quota: { unlimited: true }
      };
      return next();
    }

    // For development, allow a simple JWT secret verification
    if (process.env.NODE_ENV === 'development' && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
      } catch (devError) {
        // Fall through to Casdoor verification
        logger.debug('Development JWT verification failed, trying Casdoor');
      }
    }

    // Verify JWT with Casdoor's public key
    jwt.verify(token, getKey, {
      audience: process.env.CASDOOR_CLIENT_ID,
      issuer: process.env.CASDOOR_ENDPOINT,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        logger.error('JWT verification failed:', err);
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Add user info to request
      req.user = decoded;
      next();
    });

  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = authMiddleware;
