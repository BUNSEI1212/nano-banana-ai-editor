#!/bin/bash

# Nano Banana 快速更新脚本
# 用于快速更新已部署的服务

set -e

# 配置变量
REPO_URL="https://github.com/BUNSEI1212/nano-banana-ai-editor.git"
APP_NAME="nano-banana-backend"
APP_DIR="/www/wwwroot/nano-banana"
BACKEND_DIR="$APP_DIR/backend"
TEMP_DIR="/tmp/nano-banana-update"

# 颜色输出函数
print_status() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

print_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1"
}

print_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

# 检查服务是否存在
check_service() {
    if ! pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        print_error "服务 $APP_NAME 不存在，请先运行完整部署脚本"
        exit 1
    fi
}

# 获取最新代码
update_code() {
    print_status "获取最新代码..."
    
    # 清理临时目录
    rm -rf "$TEMP_DIR"
    
    # 克隆最新代码
    git clone "$REPO_URL" "$TEMP_DIR"
    
    print_success "代码更新完成"
}

# 停止服务
stop_service() {
    print_status "停止服务..."
    pm2 stop "$APP_NAME"
    print_success "服务已停止"
}

# 更新后端文件
update_backend() {
    print_status "更新后端文件..."
    
    if [ -d "$TEMP_DIR/gemini-proxy" ]; then
        # 备份当前的.env文件
        if [ -f "$BACKEND_DIR/.env" ]; then
            cp "$BACKEND_DIR/.env" "$BACKEND_DIR/.env.backup"
        fi

        # 清空现有后端目录（保留数据和环境文件）
        find "$BACKEND_DIR" -mindepth 1 -maxdepth 1 ! -name 'data' ! -name '.env' ! -name '.env.backup' ! -name 'node_modules' -exec rm -rf {} +

        # 复制gemini-proxy文件（包含完整的激活系统）
        cp -r "$TEMP_DIR/gemini-proxy/"* "$BACKEND_DIR/"

        # 恢复.env文件
        if [ -f "$BACKEND_DIR/.env.backup" ]; then
            mv "$BACKEND_DIR/.env.backup" "$BACKEND_DIR/.env"
        fi

        print_success "Gemini Proxy文件更新完成"
    else
        print_error "未找到gemini-proxy源码目录"
        exit 1
    fi
}

# 更新依赖
update_dependencies() {
    print_status "更新依赖..."
    
    cd "$BACKEND_DIR"
    npm install --production
    
    print_success "依赖更新完成"
}

# 启动服务
start_service() {
    print_status "启动服务..."
    pm2 start "$APP_NAME"
    print_success "服务已启动"
}

# 清理临时文件
cleanup() {
    print_status "清理临时文件..."
    rm -rf "$TEMP_DIR"
    print_success "清理完成"
}

# 显示状态
show_status() {
    print_status "服务状态:"
    pm2 status
    
    echo
    print_success "快速更新完成！"
    echo
    echo "如果遇到问题，可以查看日志："
    echo "  pm2 logs $APP_NAME"
}

# 主函数
main() {
    echo "========================================"
    echo "    Nano Banana 快速更新脚本"
    echo "========================================"
    echo
    
    check_service
    update_code
    stop_service
    update_backend
    update_dependencies
    start_service
    cleanup
    show_status
}

# 执行主函数
main "$@"
