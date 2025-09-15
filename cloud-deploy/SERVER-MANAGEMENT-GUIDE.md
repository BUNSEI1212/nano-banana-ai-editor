# 🖥️ Nano Banana 云服务器管理完全指南

## 📋 服务器信息

- **服务器IP**: 43.142.153.33
- **操作系统**: OpenCloudOS (CentOS兼容)
- **服务端口**: 3001
- **应用目录**: /www/wwwroot/nano-banana
- **Git仓库**: https://github.com/BUNSEI1212/nano-banana-ai-editor

## 🌐 网络连接测试

### 1. Ping连接测试

```bash
# 从本地测试服务器连通性
ping 43.142.153.33

# 测试特定端口连通性 (Windows)
telnet 43.142.153.33 3001

# 测试特定端口连通性 (Linux/Mac)
nc -zv 43.142.153.33 3001

# 测试HTTP服务响应
curl -I http://43.142.153.33:3001/health
```

### 2. 网络状态检查

```bash
# 在服务器上检查端口监听状态
netstat -tlnp | grep 3001

# 检查所有监听端口
ss -tlnp

# 检查防火墙状态
firewall-cmd --list-ports
systemctl status firewalld
```

## 🔐 服务器连接方式

### 方式1: SSH连接 (推荐)

```bash
# 基本SSH连接
ssh root@43.142.153.33

# 指定端口连接 (如果SSH端口不是22)
ssh -p 22 root@43.142.153.33

# 使用密钥连接
ssh -i /path/to/private-key root@43.142.153.33
```

### 方式2: 腾讯云控制台

1. 登录腾讯云控制台
2. 进入轻量应用服务器管理页面
3. 点击"登录"按钮
4. 选择"WebShell登录"

## 📊 服务状态监控

### 1. PM2服务管理

```bash
# 查看所有服务状态
pm2 status

# 查看详细服务信息
pm2 describe nano-banana-backend

# 实时监控服务
pm2 monit

# 查看服务列表
pm2 list
```

### 2. 服务日志查看

```bash
# 查看实时日志
pm2 logs nano-banana-backend

# 查看最近50行日志
pm2 logs nano-banana-backend --lines 50

# 只查看错误日志
pm2 logs nano-banana-backend --err

# 清空日志
pm2 flush

# 查看应用日志文件
tail -f /www/wwwroot/nano-banana/logs/combined.log
tail -f /www/wwwroot/nano-banana/logs/error.log
```

### 3. 系统资源监控

```bash
# 查看CPU和内存使用情况
top
htop  # 如果已安装

# 查看内存使用
free -h

# 查看磁盘使用
df -h

# 查看系统负载
uptime

# 查看进程信息
ps aux | grep node
```

## 🔄 服务操作命令

### 1. 基本服务控制

```bash
# 启动服务
pm2 start nano-banana-backend

# 停止服务
pm2 stop nano-banana-backend

# 重启服务
pm2 restart nano-banana-backend

# 重载服务 (零停机重启)
pm2 reload nano-banana-backend

# 删除服务
pm2 delete nano-banana-backend
```

### 2. 服务配置管理

```bash
# 保存当前PM2配置
pm2 save

# 设置开机自启
pm2 startup

# 恢复保存的配置
pm2 resurrect
```

## 🚀 代码更新操作

### 1. 快速更新 (推荐)

```bash
# 下载快速更新脚本
wget https://raw.githubusercontent.com/BUNSEI1212/nano-banana-ai-editor/main/cloud-deploy/quick-update.sh

# 执行快速更新
chmod +x quick-update.sh
./quick-update.sh
```

### 2. 完整重新部署

```bash
# 下载完整部署脚本
wget https://raw.githubusercontent.com/BUNSEI1212/nano-banana-ai-editor/main/cloud-deploy/git-deploy.sh

# 执行完整部署
chmod +x git-deploy.sh
./git-deploy.sh
```

### 3. 手动更新流程

```bash
# 1. 停止服务
pm2 stop nano-banana-backend

# 2. 备份数据
cp -r /www/wwwroot/nano-banana/data /www/wwwroot/nano-banana/data.backup.$(date +%Y%m%d_%H%M%S)

# 3. 获取最新代码
cd /tmp
rm -rf nano-banana-update
git clone https://github.com/BUNSEI1212/nano-banana-ai-editor.git nano-banana-update

# 4. 更新后端文件
cd /www/wwwroot/nano-banana/backend
cp .env .env.backup
find . -mindepth 1 -maxdepth 1 ! -name 'data' ! -name '.env*' ! -name 'node_modules' -exec rm -rf {} +
cp -r /tmp/nano-banana-update/nano-banana-desktop/backend/* .
mv .env.backup .env

# 5. 更新依赖
npm install --production

# 6. 启动服务
pm2 start nano-banana-backend

# 7. 清理临时文件
rm -rf /tmp/nano-banana-update
```

## 🔧 配置文件管理

### 1. 环境变量配置

```bash
# 查看当前环境配置
cat /www/wwwroot/nano-banana/backend/.env

# 编辑环境配置
nano /www/wwwroot/nano-banana/backend/.env
# 或使用 vi
vi /www/wwwroot/nano-banana/backend/.env

# 重要配置项说明:
# PORT=3001                    # 服务端口
# NODE_ENV=production          # 运行环境
# USE_RELAY_API=true          # 使用中转API
# RELAY_API_KEY=sk-xxx        # 中转API密钥
# JWT_SECRET=xxx              # JWT密钥
```

### 2. PM2配置管理

```bash
# 查看PM2配置
cat /www/wwwroot/nano-banana/ecosystem.config.js

# 重新加载配置
pm2 reload ecosystem.config.js --env production
```

## 🛡️ 安全和防火墙

### 1. 防火墙管理

```bash
# 查看防火墙状态
systemctl status firewalld

# 查看开放端口
firewall-cmd --list-ports

# 开放3001端口
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload

# 关闭端口
firewall-cmd --permanent --remove-port=3001/tcp
firewall-cmd --reload
```

### 2. 腾讯云安全组

1. 登录腾讯云控制台
2. 进入轻量应用服务器管理
3. 点击"防火墙"选项卡
4. 添加规则：
   - 协议：TCP
   - 端口：3001
   - 来源：0.0.0.0/0
   - 策略：允许

## 📈 性能优化

### 1. 内存优化

```bash
# 查看Node.js进程内存使用
ps aux | grep node

# 设置PM2内存限制
pm2 start ecosystem.config.js --max-memory-restart 1G
```

### 2. 日志管理

```bash
# 设置日志轮转
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 🆘 故障排除

### 1. 服务无法启动

```bash
# 查看详细错误信息
pm2 logs nano-banana-backend --err --lines 100

# 手动启动测试
cd /www/wwwroot/nano-banana/backend
node server.js

# 检查端口占用
netstat -tlnp | grep 3001
lsof -i :3001
```

### 2. 外部无法访问

```bash
# 检查服务监听地址
netstat -tlnp | grep 3001

# 测试本地访问
curl http://localhost:3001/health

# 测试内网访问
curl http://43.142.153.33:3001/health

# 检查防火墙
firewall-cmd --list-ports
```

### 3. 内存不足

```bash
# 查看内存使用
free -h

# 清理系统缓存
sync && echo 3 > /proc/sys/vm/drop_caches

# 重启服务释放内存
pm2 restart nano-banana-backend
```

## 📞 快速命令参考

### 常用检查命令

```bash
# 一键状态检查
pm2 status && curl -s http://localhost:3001/health

# 查看最新日志
pm2 logs nano-banana-backend --lines 20

# 检查系统资源
free -h && df -h

# 检查网络连接
netstat -tlnp | grep 3001
```

### 紧急恢复命令

```bash
# 紧急重启服务
pm2 restart nano-banana-backend

# 完全重新部署
wget -O git-deploy.sh https://raw.githubusercontent.com/BUNSEI1212/nano-banana-ai-editor/main/cloud-deploy/git-deploy.sh && chmod +x git-deploy.sh && ./git-deploy.sh

# 恢复备份数据
cp -r /www/wwwroot/nano-banana/data.backup.* /www/wwwroot/nano-banana/data
```

## 📱 监控脚本

创建自动监控脚本：

```bash
# 创建监控脚本
cat > /root/monitor.sh << 'EOF'
#!/bin/bash
echo "=== Nano Banana 服务监控 ==="
echo "时间: $(date)"
echo "服务状态:"
pm2 status
echo ""
echo "系统资源:"
free -h
echo ""
echo "磁盘使用:"
df -h /
echo ""
echo "网络连接:"
netstat -tlnp | grep 3001
echo ""
echo "最新日志:"
pm2 logs nano-banana-backend --lines 5 --nostream
EOF

chmod +x /root/monitor.sh

# 运行监控
./monitor.sh
```

## 🔄 定期维护

### 每日检查

```bash
# 检查服务状态
pm2 status

# 查看错误日志
pm2 logs nano-banana-backend --err --lines 10

# 检查系统资源
free -h && df -h
```

### 每周维护

```bash
# 清理日志
pm2 flush

# 重启服务
pm2 restart nano-banana-backend

# 更新系统包
yum update -y  # CentOS/RHEL
```

### 每月维护

```bash
# 备份数据
cp -r /www/wwwroot/nano-banana/data /backup/nano-banana-$(date +%Y%m%d)

# 检查更新
./quick-update.sh

# 清理临时文件
find /tmp -name "*nano-banana*" -type d -exec rm -rf {} +
```

---

**📞 技术支持**
- GitHub仓库: https://github.com/BUNSEI1212/nano-banana-ai-editor
- 问题反馈: 在GitHub仓库中创建Issue
