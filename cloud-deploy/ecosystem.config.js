module.exports = {
  apps: [{
    name: 'nano-banana-backend',
    script: 'server.js',
    cwd: '/www/wwwroot/nano-banana/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      USE_RELAY_API: 'true',
      RELAY_API_KEY: 'sk-xo5EQglG3ojnJVqZm8XzCBAIIex0ibo1cRGH3u6aDR0iQwyS',
      RELAY_API_URL: 'https://hiapi.online/v1',
      DATABASE_PATH: '/www/wwwroot/nano-banana/data/proxy.db',
      JWT_SECRET: 'nano_banana_production_jwt_secret_2024_change_this_in_production',
      RATE_LIMIT_WINDOW_MS: 900000,
      RATE_LIMIT_MAX_REQUESTS: 100,
      LOG_LEVEL: 'info',
      LOG_FILE: '/www/wwwroot/nano-banana/logs/proxy.log',
      CORS_ORIGIN: '*',
      HELMET_ENABLED: 'true',
      MAX_REQUEST_SIZE: '50mb'
    },
    error_file: '/www/wwwroot/nano-banana/logs/err.log',
    out_file: '/www/wwwroot/nano-banana/logs/out.log',
    log_file: '/www/wwwroot/nano-banana/logs/combined.log',
    time: true
  }]
};
