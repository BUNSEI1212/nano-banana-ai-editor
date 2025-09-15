#!/bin/bash

# 云服务器更新和诊断脚本

set -e

# 颜色输出函数
print_status() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

print_status "开始云服务器诊断和更新..."

# 1. 检查服务状态
print_status "检查服务状态..."
pm2 status

# 2. 查看最新日志
print_status "查看最新错误日志..."
pm2 logs nano-banana-backend --err --lines 20

# 3. 检查环境变量
print_status "检查环境变量配置..."
cd /www/wwwroot/nano-banana/backend
echo "当前环境变量:"
cat .env | grep -E "(USE_RELAY_API|RELAY_API_KEY|RELAY_API_URL)" || echo "未找到中转API配置"

# 4. 测试中转API连接
print_status "测试中转API连接..."
curl -s -X POST https://hiapi.online/v1/chat/completions \
  -H "Authorization: Bearer sk-xo5EQglG3ojnJVqZm8XzCBAIIex0ibo1cRGH3u6aDR0iQwyS" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"test"}],"max_tokens":5}' \
  | head -c 200

echo ""

# 5. 更新代码
print_status "更新最新代码..."
cd /tmp
rm -rf nano-banana-update
git clone https://github.com/BUNSEI1212/nano-banana-ai-editor.git nano-banana-update

# 6. 备份当前配置
print_status "备份当前配置..."
cp /www/wwwroot/nano-banana/backend/.env /www/wwwroot/nano-banana/backend/.env.backup

# 7. 更新后端文件
print_status "更新后端文件..."
cd /www/wwwroot/nano-banana/backend
find . -mindepth 1 -maxdepth 1 ! -name 'data' ! -name '.env*' ! -name 'node_modules' -exec rm -rf {} +
cp -r /tmp/nano-banana-update/nano-banana-desktop/backend/* .

# 8. 恢复配置
print_status "恢复配置文件..."
mv .env.backup .env

# 9. 更新依赖
print_status "更新依赖..."
npm install --production

# 10. 重启服务
print_status "重启服务..."
pm2 restart nano-banana-backend

# 11. 等待服务启动
sleep 5

# 12. 测试服务
print_status "测试服务..."
curl -s http://localhost:3001/health | jq '.' || echo "健康检查失败"

# 13. 测试API生成
print_status "测试API生成..."
curl -s -X POST http://localhost:3001/api/generate \
  -H "Authorization: Bearer electron-app" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test image","options":{"temperature":0.7}}' \
  | head -c 200

echo ""

# 14. 显示最新日志
print_status "显示最新日志..."
pm2 logs nano-banana-backend --lines 10

print_success "诊断和更新完成！"

# 清理临时文件
rm -rf /tmp/nano-banana-update
