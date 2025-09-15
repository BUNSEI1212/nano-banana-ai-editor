@echo off
chcp 65001 >nul
echo ========================================
echo    测试激活状态持久化功能
echo ========================================
echo.

set "APP_DATA_DIR=%APPDATA%\Nano Banana AI Editor"

echo 📋 检查用户数据目录状态
echo 目录位置: %APP_DATA_DIR%
echo.

if exist "%APP_DATA_DIR%" (
    echo ✅ 用户数据目录存在
    echo.
    echo 📁 目录内容:
    dir "%APP_DATA_DIR%" /b 2>nul
    if %errorlevel% neq 0 (
        echo   (目录为空)
    )
    echo.
    
    if exist "%APP_DATA_DIR%\activation.json" (
        echo ✅ 激活文件存在: activation.json
        echo 📄 激活文件内容:
        type "%APP_DATA_DIR%\activation.json" 2>nul
        echo.
    ) else (
        echo ❌ 激活文件不存在: activation.json
    )
    
    if exist "%APP_DATA_DIR%\.first-run-completed" (
        echo ✅ 首次运行标记文件存在: .first-run-completed
        echo 📅 创建时间:
        type "%APP_DATA_DIR%\.first-run-completed" 2>nul
        echo.
    ) else (
        echo ❌ 首次运行标记文件不存在: .first-run-completed
    )
    
) else (
    echo ❌ 用户数据目录不存在
)

echo.
echo ========================================
echo 🧪 测试步骤说明:
echo.
echo 1️⃣ 第一次测试 - 全新安装:
echo    - 卸载现有版本
echo    - 安装新版本
echo    - 启动应用（应该是激活页面）
echo    - 输入激活码激活
echo    - 关闭应用
echo.
echo 2️⃣ 第二次测试 - 验证持久化:
echo    - 重新启动应用
echo    - 应该直接进入主界面（不是激活页面）
echo    - 验证激活状态和额度显示正确
echo.
echo 3️⃣ 多次测试:
echo    - 多次关闭和重新启动应用
echo    - 每次都应该保持激活状态
echo    - 额度应该正确累计和扣减
echo ========================================
echo.

echo 🚀 启动应用进行测试...
echo 按任意键启动应用，或按 Ctrl+C 取消
pause >nul

echo.
echo 正在启动应用...
start "" "dist\win-unpacked\Nano Banana AI Editor.exe"

echo.
echo 应用已启动，请按照上述步骤进行测试
echo 测试完成后，重新运行此脚本查看数据变化
echo.
pause
