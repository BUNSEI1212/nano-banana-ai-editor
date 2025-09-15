#!/bin/bash

# Nano Banana Backend Git部署脚本
# 使用Git仓库进行自动化部署

set -e  # 遇到错误立即退出

# 配置变量
REPO_URL="https://github.com/BUNSEI1212/nano-banana-ai-editor.git"
APP_NAME="nano-banana-backend"
APP_DIR="/www/wwwroot/nano-banana"
BACKEND_DIR="$APP_DIR/backend"
LOG_DIR="$APP_DIR/logs"
DATA_DIR="$APP_DIR/data"
TEMP_DIR="/tmp/nano-banana-deploy"

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

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用root用户运行此脚本"
        exit 1
    fi
}

# 检查Git是否安装
check_git() {
    print_status "检查Git环境..."
    if ! command -v git &> /dev/null; then
        print_error "Git未安装，正在安装..."
        if command -v yum &> /dev/null; then
            yum install -y git
        elif command -v apt-get &> /dev/null; then
            apt-get update && apt-get install -y git
        else
            print_error "无法自动安装Git，请手动安装"
            exit 1
        fi
    fi
    
    GIT_VERSION=$(git --version)
    print_success "Git版本: $GIT_VERSION"
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

# 停止现有服务
stop_existing_service() {
    print_status "停止现有服务..."
    pm2 stop "$APP_NAME" 2>/dev/null || true
    pm2 delete "$APP_NAME" 2>/dev/null || true
    print_success "现有服务已停止"
}

# 备份数据
backup_data() {
    if [ -d "$DATA_DIR" ]; then
        print_status "备份现有数据..."
        BACKUP_DIR="$DATA_DIR.backup.$(date +%Y%m%d_%H%M%S)"
        cp -r "$DATA_DIR" "$BACKUP_DIR"
        print_success "数据已备份到: $BACKUP_DIR"
    fi
}

# 克隆或更新代码
clone_or_update_code() {
    print_status "获取最新代码..."
    
    # 清理临时目录
    rm -rf "$TEMP_DIR"
    
    # 克隆代码到临时目录
    git clone "$REPO_URL" "$TEMP_DIR"
    
    print_success "代码获取完成"
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
    
    if [ -d "$TEMP_DIR/gemini-proxy" ]; then
        # 清空现有后端目录（保留数据目录）
        find "$BACKEND_DIR" -mindepth 1 -maxdepth 1 ! -name 'data' -exec rm -rf {} +

        # 复制gemini-proxy文件（包含完整的激活系统）
        cp -r "$TEMP_DIR/gemini-proxy/"* "$BACKEND_DIR/"
        print_success "Gemini Proxy文件复制完成"
    else
        print_error "未找到gemini-proxy源码目录"
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
    if [ -f "$TEMP_DIR/cloud-deploy/.env.production" ]; then
        cp "$TEMP_DIR/cloud-deploy/.env.production" "$BACKEND_DIR/.env"
        print_success "环境配置文件已复制"
    else
        print_warning "未找到生产环境配置文件，使用示例配置"
        if [ -f "$BACKEND_DIR/.env.example" ]; then
            cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        fi
    fi
    
    # 设置文件权限
    chmod 600 "$BACKEND_DIR/.env"
}

# 配置PM2
setup_pm2() {
    print_status "配置PM2进程管理..."
    
    # 复制PM2配置文件
    if [ -f "$TEMP_DIR/cloud-deploy/ecosystem.config.js" ]; then
        cp "$TEMP_DIR/cloud-deploy/ecosystem.config.js" "$APP_DIR/"
        
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
    
    # 启动新服务
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
    
    print_success "服务启动完成"
}

# 清理临时文件
cleanup() {
    print_status "清理临时文件..."
    rm -rf "$TEMP_DIR"
    print_success "清理完成"
}

# 显示服务状态
show_status() {
    print_status "服务状态:"
    pm2 status
    
    echo
    print_success "Git部署完成！"
    echo
    echo "服务信息:"
    echo "  - 应用名称: $APP_NAME"
    echo "  - 运行端口: 3001"
    echo "  - 应用目录: $APP_DIR"
    echo "  - 日志目录: $LOG_DIR"
    echo "  - Git仓库: $REPO_URL"
    echo
    echo "常用命令:"
    echo "  - 查看状态: pm2 status"
    echo "  - 查看日志: pm2 logs $APP_NAME"
    echo "  - 重启服务: pm2 restart $APP_NAME"
    echo "  - 停止服务: pm2 stop $APP_NAME"
    echo "  - 更新部署: ./git-deploy.sh"
    echo
    print_warning "请确保防火墙已开放3001端口"
}

# 主函数
main() {
    echo "========================================"
    echo "    Nano Banana Git自动化部署脚本"
    echo "========================================"
    echo
    
    check_root
    check_git
    check_nodejs
    check_pm2
    stop_existing_service
    backup_data
    clone_or_update_code
    create_directories
    copy_backend_files
    install_dependencies
    setup_environment
    setup_pm2
    start_service
    cleanup
    show_status
}

# 执行主函数
main "$@"
