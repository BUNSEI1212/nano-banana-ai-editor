@echo off
chcp 65001 >nul
echo ========================================
echo    Nano Banana Gemini 代理服务器
echo ========================================
echo.

:: 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到Node.js
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js 已安装: 
node --version

:: 检查依赖是否安装
if not exist "node_modules" (
    echo.
    echo 📦 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

:: 检查配置文件
if not exist ".env" (
    echo.
    echo ⚠️  未找到配置文件 .env
    echo 正在从示例文件创建...
    copy ".env.example" ".env"
    echo.
    echo 📝 请编辑 .env 文件，配置你的Gemini API密钥
    echo 当前配置:
    echo   - 端口: 3002
    echo   - Gemini API Key: 已配置
    echo.
)

:: 显示当前配置
echo.
echo 📋 当前配置:
echo   - 服务端口: 3002
echo   - 环境: development
echo   - 数据库: ./data/proxy.db
echo.

:: 检查端口是否被占用
netstat -an | find "3002" >nul
if %errorlevel% equ 0 (
    echo ⚠️  警告: 端口3002可能已被占用
    echo.
    set /p choice="是否继续启动? (y/n): "
    if /i not "%choice%"=="y" (
        echo 启动已取消
        pause
        exit /b
    )
)

echo.
echo 🚀 正在启动Gemini代理服务器...
echo 访问地址: http://localhost:3002
echo 按 Ctrl+C 停止服务器
echo.
echo ========================================
echo.

:: 启动服务器
npm run dev

echo.
echo 服务器已停止
pause
