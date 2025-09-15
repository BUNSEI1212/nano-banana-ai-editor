@echo off
chcp 65001 >nul
echo ========================================
echo    测试用户数据清理功能
echo ========================================
echo.

set "APP_DATA_DIR=%APPDATA%\Nano Banana AI Editor"

echo 📋 检查用户数据目录状态
echo 目录位置: %APP_DATA_DIR%
echo.

if exist "%APP_DATA_DIR%" (
    echo ✅ 用户数据目录存在
    echo 📁 目录内容:
    dir "%APP_DATA_DIR%" /b 2>nul
    if %errorlevel% neq 0 (
        echo   (目录为空)
    )
) else (
    echo ❌ 用户数据目录不存在
)

echo.
echo ========================================
echo 🧪 测试步骤:
echo 1. 运行应用并进行一些操作（激活、设置等）
echo 2. 关闭应用
echo 3. 重新运行此脚本查看数据是否被保留
echo 4. 卸载并重新安装应用
echo 5. 再次运行此脚本验证数据是否被清理
echo ========================================
echo.

echo 🚀 启动应用进行测试...
echo 按任意键启动应用，或按 Ctrl+C 取消
pause >nul

echo.
echo 正在启动应用...
start "" "dist\win-unpacked\Nano Banana AI Editor.exe"

echo.
echo 应用已启动，请进行以下测试:
echo 1. 输入激活码激活应用
echo 2. 进行一些设置或操作
echo 3. 关闭应用
echo 4. 重新运行此脚本查看数据变化
echo.
pause
