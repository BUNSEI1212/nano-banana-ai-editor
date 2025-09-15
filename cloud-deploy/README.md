# Nano Banana Cloud Deployment

云服务器自动化部署工具，支持Git仓库自动拉取和PM2进程管理。

## 🚀 快速部署

### 方法一：Git自动化部署（推荐）

```bash
# 1. 下载部署脚本
wget https://raw.githubusercontent.com/BUNSEI1212/nano-banana-ai-editor/main/cloud-deploy/git-deploy.sh

# 2. 赋予执行权限
chmod +x git-deploy.sh

# 3. 执行部署
./git-deploy.sh
```

### 方法二：手动部署

```bash
# 1. 克隆仓库
git clone https://github.com/BUNSEI1212/nano-banana-ai-editor.git
cd nano-banana-ai-editor

# 2. 复制gemini-proxy到部署目录
sudo mkdir -p /www/wwwroot/nano-banana/backend
sudo cp -r gemini-proxy/* /www/wwwroot/nano-banana/backend/

# 3. 安装依赖
cd /www/wwwroot/nano-banana/backend
sudo npm install --production

# 4. 配置环境变量
sudo cp .env.example .env
sudo nano .env  # 编辑配置

# 5. 启动服务
sudo npm install -g pm2
sudo pm2 start server.js --name nano-banana-backend
```

## 📋 部署架构

```
/www/wwwroot/nano-banana/
├── backend/          # gemini-proxy服务文件
│   ├── server.js     # 主服务器文件
│   ├── services/     # 服务层
│   ├── middleware/   # 中间件
│   ├── utils/        # 工具函数
│   └── package.json  # 依赖配置
├── data/            # 数据库文件
│   └── proxy.db     # SQLite数据库
└── logs/            # 日志文件
    ├── proxy.log    # 应用日志
    ├── err.log      # 错误日志
    └── out.log      # 输出日志
```

## ⚙️ 环境配置

### 必需的环境变量

```bash
# 中转API配置（推荐）
USE_RELAY_API=true
RELAY_API_KEY=your_relay_api_key_here
RELAY_API_URL=https://hiapi.online/v1

# 服务器配置
PORT=3001
NODE_ENV=production

# 数据库
DATABASE_PATH=/www/wwwroot/nano-banana/data/proxy.db

# JWT密钥
JWT_SECRET=your_jwt_secret_here
```

### 可选配置

```bash
# 速率限制
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 日志
LOG_LEVEL=info
LOG_FILE=/www/wwwroot/nano-banana/logs/proxy.log

# 安全
CORS_ORIGIN=*
HELMET_ENABLED=true

# 性能
MAX_REQUEST_SIZE=50mb
```

## 🔧 服务管理

### PM2 命令

```bash
# 启动服务
pm2 start ecosystem.config.js --env production

# 查看状态
pm2 status

# 查看日志
pm2 logs nano-banana-backend

# 重启服务
pm2 restart nano-banana-backend

# 停止服务
pm2 stop nano-banana-backend

# 删除服务
pm2 delete nano-banana-backend

# 监控面板
pm2 monit
```

### 服务检查

```bash
# 健康检查
curl http://localhost:3001/health

# API密钥状态
curl http://localhost:3001/api/keys/status

# 测试图像生成
curl -X POST http://localhost:3001/api/generate \
  -H "Authorization: Bearer electron-app" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"测试图像生成"}'
```

## 📊 监控和日志

### 日志文件位置

- **应用日志**: `/www/wwwroot/nano-banana/logs/proxy.log`
- **PM2错误日志**: `/www/wwwroot/nano-banana/logs/err.log`
- **PM2输出日志**: `/www/wwwroot/nano-banana/logs/out.log`

### 日志查看命令

```bash
# 实时查看应用日志
tail -f /www/wwwroot/nano-banana/logs/proxy.log

# 查看错误日志
tail -f /www/wwwroot/nano-banana/logs/err.log

# 搜索特定错误
grep "ERROR" /www/wwwroot/nano-banana/logs/proxy.log

# 查看API密钥使用情况
grep "API key" /www/wwwroot/nano-banana/logs/proxy.log
```

## 🔄 更新部署

### 自动更新

```bash
# 使用Git部署脚本更新
./git-deploy.sh
```

### 手动更新

```bash
# 1. 停止服务
pm2 stop nano-banana-backend

# 2. 备份当前版本
cp -r /www/wwwroot/nano-banana/backend /www/wwwroot/nano-banana/backend.backup

# 3. 拉取最新代码
cd /tmp
git clone https://github.com/BUNSEI1212/nano-banana-ai-editor.git
cp -r nano-banana-ai-editor/gemini-proxy/* /www/wwwroot/nano-banana/backend/

# 4. 更新依赖
cd /www/wwwroot/nano-banana/backend
npm install --production

# 5. 重启服务
pm2 start nano-banana-backend
```

## 🛠️ 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   netstat -tlnp | grep :3001
   
   # 杀死占用进程
   kill -9 <PID>
   ```

2. **权限问题**
   ```bash
   # 修复目录权限
   chown -R root:root /www/wwwroot/nano-banana
   chmod -R 755 /www/wwwroot/nano-banana
   ```

3. **依赖安装失败**
   ```bash
   # 清理npm缓存
   npm cache clean --force
   
   # 重新安装
   rm -rf node_modules package-lock.json
   npm install --production
   ```

4. **数据库连接失败**
   ```bash
   # 检查数据库目录权限
   ls -la /www/wwwroot/nano-banana/data/
   
   # 创建数据库目录
   mkdir -p /www/wwwroot/nano-banana/data
   ```

### 服务状态检查

```bash
# 检查服务是否运行
systemctl status pm2-root

# 检查端口监听
ss -tlnp | grep :3001

# 检查进程
ps aux | grep node
```

## 📞 技术支持

如果遇到部署问题，请检查：

1. **环境变量配置**是否正确
2. **网络连接**是否正常
3. **API密钥**是否有效
4. **日志文件**中的错误信息

更多帮助请查看项目文档或提交Issue。
