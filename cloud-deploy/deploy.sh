#!/bin/bash

# Nano Banana Backend 云服务器部署脚本
# 使用方法: ./deploy.sh

set -e

echo "=========================================="
echo "    Nano Banana Backend 云服务器部署"
echo "=========================================="
echo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
APP_NAME="nano-banana-backend"
APP_DIR="/www/wwwroot/nano-banana"
BACKEND_DIR="$APP_DIR/backend"
LOG_DIR="$APP_DIR/logs"
DATA_DIR="$APP_DIR/data"

# 函数：打印彩色消息
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用root用户运行此脚本"
        exit 1
    fi
}

# 检查Node.js是否安装
check_nodejs() {
    print_status "检查Node.js环境..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js未安装，请先安装Node.js 18+版本"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js版本: $NODE_VERSION"
}

# 检查PM2是否安装
check_pm2() {
    print_status "检查PM2进程管理器..."
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2未安装，正在安装..."
        npm install -g pm2
        print_success "PM2安装完成"
    else
        print_success "PM2已安装"
    fi
}

# 创建目录结构
create_directories() {
    print_status "创建应用目录结构..."
    
    mkdir -p "$APP_DIR"
    mkdir -p "$BACKEND_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$DATA_DIR"
    
    print_success "目录结构创建完成"
}

# 复制后端文件
copy_backend_files() {
    print_status "复制后端文件..."
    
    # 假设当前目录包含nano-banana项目
    if [ -d "./nano-banana-desktop/backend" ]; then
        cp -r ./nano-banana-desktop/backend/* "$BACKEND_DIR/"
        print_success "后端文件复制完成"
    else
        print_error "未找到后端源码目录 ./nano-banana-desktop/backend"
        exit 1
    fi
}

# 安装依赖
install_dependencies() {
    print_status "安装Node.js依赖..."
    
    cd "$BACKEND_DIR"
    npm install --production
    
    print_success "依赖安装完成"
}

# 配置环境变量
setup_environment() {
    print_status "配置生产环境变量..."
    
    # 复制生产环境配置
    if [ -f "./cloud-deploy/.env.production" ]; then
        cp "./cloud-deploy/.env.production" "$BACKEND_DIR/.env"
        print_success "环境配置文件已复制"
    else
        print_warning "未找到生产环境配置文件，使用示例配置"
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    fi
    
    # 设置文件权限
    chmod 600 "$BACKEND_DIR/.env"
}

# 配置PM2
setup_pm2() {
    print_status "配置PM2进程管理..."
    
    # 复制PM2配置文件
    if [ -f "./cloud-deploy/ecosystem.config.js" ]; then
        cp "./cloud-deploy/ecosystem.config.js" "$APP_DIR/"
        
        # 更新配置文件中的路径
        sed -i "s|/www/wwwroot/nano-banana|$APP_DIR|g" "$APP_DIR/ecosystem.config.js"
        
        print_success "PM2配置完成"
    else
        print_error "未找到PM2配置文件"
        exit 1
    fi
}

# 启动服务
start_service() {
    print_status "启动Nano Banana Backend服务..."
    
    cd "$APP_DIR"
    
    # 停止现有服务（如果存在）
    pm2 stop "$APP_NAME" 2>/dev/null || true
    pm2 delete "$APP_NAME" 2>/dev/null || true
    
    # 启动新服务
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
    
    print_success "服务启动完成"
}

# 显示服务状态
show_status() {
    print_status "服务状态:"
    pm2 status
    
    echo
    print_success "部署完成！"
    echo
    echo "服务信息:"
    echo "  - 应用名称: $APP_NAME"
    echo "  - 运行端口: 3001"
    echo "  - 应用目录: $APP_DIR"
    echo "  - 日志目录: $LOG_DIR"
    echo
    echo "常用命令:"
    echo "  - 查看状态: pm2 status"
    echo "  - 查看日志: pm2 logs $APP_NAME"
    echo "  - 重启服务: pm2 restart $APP_NAME"
    echo "  - 停止服务: pm2 stop $APP_NAME"
    echo
    print_warning "请确保防火墙已开放3001端口"
}

# 主函数
main() {
    check_root
    check_nodejs
    check_pm2
    create_directories
    copy_backend_files
    install_dependencies
    setup_environment
    setup_pm2
    start_service
    show_status
}

# 执行主函数
main "$@"
