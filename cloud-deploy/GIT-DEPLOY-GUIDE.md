# 🚀 Nano Banana Git自动化部署指南

## 📋 部署概述

使用Git仓库进行自动化部署，具有以下优势：
- ✅ 版本控制和回滚能力
- ✅ 自动化程度高
- ✅ 可重复性强
- ✅ 支持持续集成
- ✅ 便于团队协作

## 🛠️ 准备工作

### 1. 服务器要求
- **操作系统**: CentOS 7+, Ubuntu 18+, Debian 9+
- **Node.js**: 18+ 版本
- **内存**: 至少 1GB
- **存储**: 至少 5GB 可用空间
- **网络**: 能够访问GitHub

### 2. 必需软件
- Git
- Node.js & npm
- PM2 (脚本会自动安装)

## 🚀 一键部署

### 方法1: 直接下载脚本执行

```bash
# 1. 连接到服务器
ssh root@43.142.153.33

# 2. 下载部署脚本
wget https://raw.githubusercontent.com/BUNSEI1212/nano-banana-ai-editor/main/cloud-deploy/git-deploy.sh

# 3. 给脚本执行权限
chmod +x git-deploy.sh

# 4. 执行部署
./git-deploy.sh
```

### 方法2: 克隆仓库后执行

```bash
# 1. 连接到服务器
ssh root@43.142.153.33

# 2. 克隆仓库
git clone https://github.com/BUNSEI1212/nano-banana-ai-editor.git

# 3. 进入部署目录
cd nano-banana-ai-editor/cloud-deploy

# 4. 给脚本执行权限
chmod +x git-deploy.sh

# 5. 执行部署
./git-deploy.sh
```

## 🔄 更新部署

### 快速更新 (推荐)

```bash
# 下载快速更新脚本
wget https://raw.githubusercontent.com/BUNSEI1212/nano-banana-ai-editor/main/cloud-deploy/quick-update.sh

# 执行快速更新
chmod +x quick-update.sh
./quick-update.sh
```

### 完整重新部署

```bash
# 重新运行完整部署脚本
./git-deploy.sh
```

## 📁 部署后目录结构

```
/www/wwwroot/nano-banana/
├── backend/              # 后端应用
│   ├── server.js        # 主服务文件
│   ├── package.json     # 依赖配置
│   ├── .env            # 环境变量
│   ├── middleware/      # 中间件
│   ├── services/        # 服务层
│   ├── utils/          # 工具函数
│   └── data/           # 数据文件 (自动创建)
├── logs/                # 日志文件
│   ├── combined.log    # 综合日志
│   ├── out.log         # 输出日志
│   └── error.log       # 错误日志
└── ecosystem.config.js  # PM2配置
```

## 🛠️ 服务管理

### 基本命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs nano-banana-backend

# 重启服务
pm2 restart nano-banana-backend

# 停止服务
pm2 stop nano-banana-backend

# 监控服务
pm2 monit
```

### 高级管理

```bash
# 查看详细信息
pm2 describe nano-banana-backend

# 重载服务 (零停机)
pm2 reload nano-banana-backend

# 查看实时日志
pm2 logs nano-banana-backend --lines 100

# 清空日志
pm2 flush
```

## 🔧 配置说明

### 环境变量配置

编辑 `/www/wwwroot/nano-banana/backend/.env`：

```bash
# 服务端口
PORT=3001

# 运行环境
NODE_ENV=production

# API配置
USE_RELAY_API=true
RELAY_API_KEY=your_api_key_here
RELAY_API_URL=https://hiapi.online/v1

# 数据库配置
DATABASE_PATH=./data/proxy.db

# JWT配置 (生产环境请修改)
JWT_SECRET=your_strong_jwt_secret_here

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/proxy.log

# CORS配置
CORS_ORIGIN=*
```

### PM2配置

PM2配置文件位于 `/www/wwwroot/nano-banana/ecosystem.config.js`

## 🔒 安全配置

### 1. 防火墙设置

```bash
# CentOS/RHEL
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload

# Ubuntu/Debian
ufw allow 3001

# 或使用iptables
iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
iptables-save
```

### 2. SSL证书 (可选)

如果需要HTTPS，可以使用Nginx反向代理：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🆘 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   netstat -tlnp | grep 3001
   
   # 杀死占用进程
   kill -9 <PID>
   ```

2. **权限问题**
   ```bash
   # 修复文件权限
   chown -R root:root /www/wwwroot/nano-banana
   chmod -R 755 /www/wwwroot/nano-banana
   chmod 600 /www/wwwroot/nano-banana/backend/.env
   ```

3. **依赖安装失败**
   ```bash
   # 清理npm缓存
   npm cache clean --force
   
   # 删除node_modules重新安装
   cd /www/wwwroot/nano-banana/backend
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **服务启动失败**
   ```bash
   # 查看详细错误日志
   pm2 logs nano-banana-backend --err
   
   # 手动启动测试
   cd /www/wwwroot/nano-banana/backend
   node server.js
   ```

### 日志查看

```bash
# PM2日志
pm2 logs nano-banana-backend

# 应用日志
tail -f /www/wwwroot/nano-banana/logs/combined.log

# 错误日志
tail -f /www/wwwroot/nano-banana/logs/error.log
```

## 🔄 开发工作流

### 1. 本地开发

```bash
# 修改代码
git add .
git commit -m "feat: 添加新功能"
git push origin main
```

### 2. 服务器更新

```bash
# 在服务器上执行快速更新
./quick-update.sh
```

### 3. 回滚版本

```bash
# 查看提交历史
git log --oneline

# 回滚到指定版本
git reset --hard <commit-hash>
./git-deploy.sh
```

## 📞 技术支持

如果遇到问题：
1. 查看日志文件
2. 检查服务状态
3. 验证配置文件
4. 确认网络连接
5. 检查系统资源

**仓库地址**: https://github.com/BUNSEI1212/nano-banana-ai-editor
**问题反馈**: 在GitHub仓库中创建Issue
