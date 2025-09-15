@echo off
echo ========================================
echo    Nano Banana Desktop 启动脚本
echo ========================================
echo.

:: 检查是否有node进程在运行
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [警告] 检测到已有Node.js进程在运行
    echo 这可能是后端服务已经在运行，或者其他Node.js应用
    echo.
    echo 选择操作:
    echo 1. 继续启动 (推荐 - 应用会自动检测端口冲突)
    echo 2. 停止所有Node.js进程后启动
    echo 3. 取消启动
    echo.
    set /p choice="请输入选择 (1/2/3): "
    
    if "%choice%"=="2" (
        echo 正在停止所有Node.js进程...
        taskkill /F /IM node.exe >NUL 2>&1
        timeout /t 2 >NUL
        echo Node.js进程已停止
        echo.
    ) else if "%choice%"=="3" (
        echo 启动已取消
        pause
        exit /b
    )
)

echo 正在启动 Nano Banana Desktop...
echo.

:: 启动应用
npm start

echo.
echo 应用已退出
pause
