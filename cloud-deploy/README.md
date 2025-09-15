# Nano Banana Backend 云服务器部署指南

## 🚀 快速部署

### 1. 准备工作

确保你的腾讯云轻量应用服务器已安装：
- Node.js 18+ 版本
- npm 包管理器
- Git (可选)

### 2. 上传部署文件

将以下文件上传到服务器：
```
cloud-deploy/
├── deploy.sh              # 部署脚本
├── ecosystem.config.js     # PM2配置
├── .env.production        # 生产环境配置
├── package.json           # 部署包配置
└── README.md             # 说明文档
```

同时上传整个项目：
```
nano-banana-desktop/
└── backend/              # 后端源码
```

### 3. 执行部署

```bash
# 1. 上传文件到服务器
scp -r cloud-deploy/ root@your-server-ip:/root/
scp -r nano-banana-desktop/ root@your-server-ip:/root/

# 2. 登录服务器
ssh root@your-server-ip

# 3. 进入部署目录
cd /root/cloud-deploy

# 4. 执行部署脚本
chmod +x deploy.sh
./deploy.sh
```

## 📋 部署脚本功能

部署脚本会自动完成：

1. ✅ 检查Node.js环境
2. ✅ 安装PM2进程管理器
3. ✅ 创建应用目录结构
4. ✅ 复制后端文件
5. ✅ 安装Node.js依赖
6. ✅ 配置生产环境变量
7. ✅ 配置PM2进程管理
8. ✅ 启动服务

## 🛠️ 服务管理命令

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

## 📁 目录结构

部署后的目录结构：
```
/www/wwwroot/nano-banana/
├── backend/              # 后端应用
│   ├── server.js        # 主服务文件
│   ├── package.json     # 依赖配置
│   ├── .env            # 环境变量
│   ├── middleware/      # 中间件
│   ├── services/        # 服务层
│   └── utils/          # 工具函数
├── logs/                # 日志文件
│   ├── combined.log    # 综合日志
│   ├── out.log         # 输出日志
│   └── error.log       # 错误日志
├── data/                # 数据文件
│   └── proxy.db        # SQLite数据库
└── ecosystem.config.js  # PM2配置
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

# JWT密钥 (请修改为强密码)
JWT_SECRET=your_strong_jwt_secret_here
```

### 防火墙配置

确保开放必要端口：
```bash
# 开放3001端口
ufw allow 3001

# 或者使用iptables
iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
```

## 🔍 故障排除

### 1. 服务无法启动

```bash
# 查看详细错误日志
pm2 logs nano-banana-backend --lines 50

# 检查端口占用
netstat -tlnp | grep 3001

# 手动启动测试
cd /www/wwwroot/nano-banana/backend
node server.js
```

### 2. 依赖安装失败

```bash
# 清理npm缓存
npm cache clean --force

# 重新安装依赖
cd /www/wwwroot/nano-banana/backend
rm -rf node_modules package-lock.json
npm install
```

### 3. 数据库问题

```bash
# 检查数据库文件权限
ls -la /www/wwwroot/nano-banana/data/

# 重新创建数据库目录
mkdir -p /www/wwwroot/nano-banana/data
chmod 755 /www/wwwroot/nano-banana/data
```

## 📞 技术支持

如遇问题，请检查：
1. Node.js版本是否为18+
2. 端口3001是否被占用
3. 环境变量配置是否正确
4. 防火墙是否开放端口
5. 服务器内存是否充足

## 🔄 更新部署

```bash
# 1. 停止服务
pm2 stop nano-banana-backend

# 2. 备份数据
cp -r /www/wwwroot/nano-banana/data /www/wwwroot/nano-banana/data.backup

# 3. 更新代码
# (上传新的代码文件)

# 4. 重新安装依赖
cd /www/wwwroot/nano-banana/backend
npm install

# 5. 启动服务
pm2 start nano-banana-backend
```
