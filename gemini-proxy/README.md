# Gemini Proxy Service

A robust proxy service for Gemini AI API with authentication, quota management, and relay API support.

## Features

- 🔄 **Relay API Support**: Compatible with OpenAI-style APIs for better reliability
- 🔐 **Authentication**: JWT-based authentication with Casdoor integration
- 📊 **Quota Management**: User-based quota tracking and enforcement
- 🔑 **API Key Management**: Multiple API key support with automatic failover
- 📝 **Comprehensive Logging**: Structured logging with file and console output
- 🛡️ **Security**: Rate limiting, CORS, and security headers
- 💾 **Database**: SQLite-based user and usage tracking

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Relay API Configuration (Recommended)
USE_RELAY_API=true
RELAY_API_KEY=your_relay_api_key_here
RELAY_API_URL=https://hiapi.online/v1

# Server Configuration
PORT=3001
NODE_ENV=production

# Database
DATABASE_PATH=./data/proxy.db

# JWT Secret
JWT_SECRET=your_jwt_secret_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Service

```bash
# Production
npm start

# Development with auto-reload
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

### Image Generation
```
POST /api/generate
Authorization: Bearer <token>

{
  "prompt": "A beautiful sunset over mountains",
  "refImages": [],
  "options": {
    "temperature": 0.7
  }
}
```

### Image Editing
```
POST /api/edit
Authorization: Bearer <token>

{
  "imageId": "image_data_or_url",
  "instruction": "Add a rainbow to the sky",
  "mask": "base64_mask_data",
  "refImages": []
}
```

### API Key Status
```
GET /api/keys/status
```

## Authentication

### Desktop App
Use the special token for Electron desktop applications:
```
Authorization: Bearer electron-app
```

### Web App
Use JWT tokens from Casdoor authentication:
```
Authorization: Bearer <jwt_token>
```

## Configuration

### Relay API vs Direct API

**Relay API (Recommended)**:
- More reliable and stable
- OpenAI-compatible format
- Better error handling
- Higher rate limits

**Direct API**:
- Direct connection to Gemini
- Original Google format
- Lower rate limits
- More prone to errors

### Multiple API Keys

For direct API, you can configure multiple keys:
```bash
GEMINI_API_KEY_1=key1
GEMINI_API_KEY_2=key2
GEMINI_API_KEY_3=key3
```

## Deployment

### Using PM2
```bash
pm2 start server.js --name gemini-proxy
pm2 logs gemini-proxy
pm2 restart gemini-proxy
```

### Using Docker
```bash
docker build -t gemini-proxy .
docker run -p 3001:3001 --env-file .env gemini-proxy
```

## Monitoring

### Logs
- Console output with colors
- File logging to `./logs/proxy.log`
- Structured JSON format

### API Key Statistics
```bash
curl http://localhost:3001/api/keys/status
```

### Health Check
```bash
curl http://localhost:3001/health
```

## Development

### Running Tests
```bash
npm test
```

### Debug Mode
```bash
LOG_LEVEL=debug npm run dev
```

## Troubleshooting

### Common Issues

1. **No API keys configured**
   - Set `RELAY_API_KEY` or `GEMINI_API_KEY` in environment

2. **Database connection failed**
   - Check `DATABASE_PATH` directory permissions
   - Ensure SQLite3 is properly installed

3. **Authentication failed**
   - Verify JWT_SECRET is set
   - Check Casdoor configuration

4. **Quota exceeded**
   - Check user's subscription status
   - Verify quota calculations in database

### Logs Analysis

```bash
# View recent logs
tail -f logs/proxy.log

# Search for errors
grep "ERROR" logs/proxy.log

# Monitor API key usage
grep "API key" logs/proxy.log
```

## License

MIT License
