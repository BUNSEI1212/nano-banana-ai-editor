#!/bin/bash

# 🍌 Nano Banana Desktop - 多平台构建脚本
# 需要在对应的操作系统上运行

echo "🍌 Nano Banana Desktop - 多平台构建"
echo "=================================="

# 检测当前操作系统
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Cygwin;;
    MINGW*)     MACHINE=MinGw;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "🖥️  当前操作系统: ${MACHINE}"
echo ""

# 进入项目目录
cd nano-banana-desktop

echo "📦 安装依赖..."
npm ci
cd frontend && npm ci && cd ..
cd backend && npm ci && cd ..

echo "🏗️  构建前端..."
npm run build:frontend

echo "📱 开始构建应用..."

case "${MACHINE}" in
    Mac)
        echo "🍎 构建 macOS 版本..."
        npx electron-builder --mac
        echo "✅ macOS 构建完成: dist/*.dmg"
        ;;
    Linux)
        echo "🐧 构建 Linux 版本..."
        npx electron-builder --linux
        echo "✅ Linux 构建完成: dist/*.AppImage"
        ;;
    *)
        echo "🪟 构建 Windows 版本..."
        npm run build
        echo "✅ Windows 构建完成: dist/*.exe"
        ;;
esac

echo ""
echo "🎉 构建完成！"
echo "📁 构建文件位于: dist/ 目录"

# 显示构建结果
echo ""
echo "📋 构建文件列表:"
ls -la dist/

echo ""
echo "💡 提示:"
echo "- Windows: 使用 .exe 安装包"
echo "- macOS: 使用 .dmg 安装包"  
echo "- Linux: 使用 .AppImage 可执行文件"