# 🚀 Nano Banana 手动部署指南

由于你的系统没有安装OpenSSH客户端，我们使用手动方式部署。

## 📋 部署步骤

### 1. 准备文件

需要上传到服务器的文件：

**部署配置文件** (cloud-deploy目录下的所有文件):
- `.env.production` - 生产环境配置
- `deploy.sh` - 自动部署脚本
- `ecosystem.config.js` - PM2配置
- `package.json` - 部署包配置

**后端源码** (nano-banana-desktop/backend目录下的所有文件):
- `server.js` - 主服务文件
- `package.json` - 依赖配置
- `middleware/` - 中间件目录
- `services/` - 服务层目录
- `utils/` - 工具函数目录
- 其他所有文件和目录

### 2. 上传方式选择

#### 方式A: 使用腾讯云控制台文件管理器

1. 登录腾讯云轻量应用服务器控制台
2. 点击"文件管理器"
3. 进入 `/root/` 目录
4. 创建文件夹 `cloud-deploy`
5. 上传 cloud-deploy 目录下的所有文件到 `/root/cloud-deploy/`
6. 创建文件夹 `nano-banana-desktop`
7. 在其中创建 `backend` 文件夹
8. 上传 nano-banana-desktop/backend 目录下的所有文件到 `/root/nano-banana-desktop/backend/`

#### 方式B: 使用FTP/SFTP工具

推荐工具：
- **WinSCP** (Windows)
- **FileZilla** (跨平台)
- **MobaXterm** (Windows)

连接信息：
- **主机**: 43.142.153.33
- **端口**: 22
- **用户名**: root
- **密码**: (你的服务器密码)

上传目录结构：
```
/root/
├── cloud-deploy/
│   ├── .env.production
│   ├── deploy.sh
│   ├── ecosystem.config.js
│   └── package.json
└── nano-banana-desktop/
    └── backend/
        ├── server.js
        ├── package.json
        ├── middleware/
        ├── services/
        ├── utils/
        └── (所有其他文件)
```

### 3. 连接服务器

使用以下任一方式连接服务器：

#### 方式A: 腾讯云控制台终端
1. 在腾讯云控制台点击"登录"
2. 选择"WebShell登录"

#### 方式B: SSH客户端
如果你有SSH客户端（如PuTTY、MobaXterm等）：
```
ssh root@43.142.153.33
```

### 4. 执行部署

连接到服务器后，执行以下命令：

```bash
# 1. 进入部署目录
cd /root/cloud-deploy

# 2. 给部署脚本执行权限
chmod +x deploy.sh

# 3. 执行部署脚本
./deploy.sh
```

### 5. 验证部署

部署完成后，检查服务状态：

```bash
# 查看PM2服务状态
pm2 status

# 查看服务日志
pm2 logs nano-banana-backend

# 测试API接口
curl http://localhost:3001/health
```

如果一切正常，你应该看到：
```json
{
  "status": "ok",
  "timestamp": "2024-xx-xxTxx:xx:xx.xxxZ",
  "service": "gemini-proxy"
}
```

### 6. 配置防火墙

确保开放3001端口：

```bash
# 使用ufw (Ubuntu/Debian)
ufw allow 3001

# 或使用iptables
iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
iptables-save
```

### 7. 访问服务

部署成功后，你可以通过以下地址访问：
- **API服务**: http://43.142.153.33:3001
- **健康检查**: http://43.142.153.33:3001/health

## 🔧 常用管理命令

```bash
# 查看服务状态
pm2 status

# 重启服务
pm2 restart nano-banana-backend

# 停止服务
pm2 stop nano-banana-backend

# 查看日志
pm2 logs nano-banana-backend

# 监控服务
pm2 monit
```

## ❗ 注意事项

1. **确保服务器已安装Node.js 18+版本**
2. **确保防火墙开放3001端口**
3. **如果部署失败，查看日志文件排查问题**
4. **生产环境建议修改JWT密钥等敏感配置**

## 🆘 故障排除

如果遇到问题：

1. **检查Node.js版本**: `node --version`
2. **检查端口占用**: `netstat -tlnp | grep 3001`
3. **查看详细日志**: `pm2 logs nano-banana-backend --lines 50`
4. **手动启动测试**: `cd /www/wwwroot/nano-banana/backend && node server.js`

需要帮助时，请提供错误日志信息。
