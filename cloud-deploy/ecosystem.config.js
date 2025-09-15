// PM2 配置文件 - Nano Banana Backend Service
module.exports = {
  apps: [
    {
      name: 'nano-banana-backend',
      script: 'server.js',
      cwd: '/www/wwwroot/nano-banana/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: '/www/wwwroot/nano-banana/logs/combined.log',
      out_file: '/www/wwwroot/nano-banana/logs/out.log',
      error_file: '/www/wwwroot/nano-banana/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      time: true
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/nano-banana.git',
      path: '/www/wwwroot/nano-banana',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
