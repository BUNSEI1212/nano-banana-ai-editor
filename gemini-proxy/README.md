# Gemini Proxy Service

A secure proxy service for Gemini API with authentication, quota management, and usage tracking.

## Features

- 🔐 JWT-based authentication with Casdoor integration
- 📊 Usage tracking and quota management
- 🚦 Rate limiting and concurrency control
- 💾 SQLite database for local data storage
- 📝 Comprehensive logging
- 🛡️ Security middleware (Helmet, CORS)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the service:**
   ```bash
   npm start
   ```

   For development:
   ```bash
   npm run dev
   ```

## Configuration

### Required Environment Variables

- `GEMINI_API_KEY`: Your Gemini API key
- `CASDOOR_ENDPOINT`: Casdoor server URL (e.g., http://localhost:8000)
- `CASDOOR_CLIENT_ID`: Casdoor application client ID
- `CASDOOR_CLIENT_SECRET`: Casdoor application client secret

### Optional Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_PATH`: SQLite database path (default: ./data/proxy.db)
- `JWT_SECRET`: JWT secret for development mode
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window

## API Endpoints

### Authentication
- `GET /auth/me` - Get current user info and usage

### Gemini Proxy
- `POST /api/generate` - Generate image with Gemini
- `POST /api/edit` - Edit image with Gemini

### Billing
- `GET /billing/plans` - Get available plans
- `GET /billing/subscription` - Get user subscription

### Health Check
- `GET /health` - Service health status

## Usage Examples

### Generate Image
```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "options": {
      "temperature": 0.7
    }
  }'
```

### Edit Image
```bash
curl -X POST http://localhost:3001/api/edit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageId": "image_123",
    "instruction": "Add a rainbow to the sky",
    "mask": "base64_encoded_mask"
  }'
```

## Database Schema

The service uses SQLite with the following tables:
- `users` - User information mirrored from Casdoor
- `subscriptions` - User subscription data
- `plan_catalog` - Available plans and their limits
- `usage_events` - Individual usage events
- `usage_agg` - Aggregated usage by month
- `active_requests` - Track concurrent requests

## Development

### Running Tests
```bash
npm test
```

### Logging
Logs are written to both console and `logs/proxy.log` file. Log level can be controlled with `LOG_LEVEL` environment variable.

### Security
- All endpoints require valid JWT tokens
- Rate limiting prevents abuse
- Quota system enforces usage limits
- CORS and security headers configured

## Integration with Casdoor

This service integrates with Casdoor for:
- User authentication via JWT tokens
- User subscription management
- Plan and pricing information

Make sure your Casdoor application is configured with the correct callback URLs and permissions.

## License

MIT
