@echo off
chcp 65001 >nul
echo.
echo 🍌 Nano Banana 激活码生成器
echo ================================
echo.
echo 请选择操作：
echo 1. 生成演示激活码（每种套餐1个）
echo 2. 生成尝鲜套餐激活码
echo 3. 生成基础套餐激活码  
echo 4. 生成高阶套餐激活码
echo 5. 批量生成激活码（导出CSV）
echo 6. 验证激活码
echo 0. 退出
echo.
set /p choice=请输入选择 (0-6): 

if "%choice%"=="0" goto :end
if "%choice%"=="1" goto :demo
if "%choice%"=="2" goto :trial
if "%choice%"=="3" goto :basic
if "%choice%"=="4" goto :premium
if "%choice%"=="5" goto :batch
if "%choice%"=="6" goto :validate

echo 无效选择，请重试
pause
goto :start

:demo
echo.
echo 正在生成演示激活码...
node codeGenerator.js demo
pause
goto :start

:trial
echo.
set /p count=请输入要生成的数量 (默认1): 
if "%count%"=="" set count=1
node codeGenerator.js generate 1 %count%
pause
goto :start

:basic
echo.
set /p count=请输入要生成的数量 (默认1): 
if "%count%"=="" set count=1
node codeGenerator.js generate 2 %count%
pause
goto :start

:premium
echo.
set /p count=请输入要生成的数量 (默认1): 
if "%count%"=="" set count=1
node codeGenerator.js generate 3 %count%
pause
goto :start

:batch
echo.
echo 批量生成激活码（将导出为CSV文件）
echo.
echo 套餐类型：
echo 1 - 🍌 尝鲜套餐 (10次, ¥13.9)
echo 2 - 💎 基础套餐 (100次, ¥69.9)
echo 3 - 🚀 高阶套餐 (300次, ¥199.9)
echo.
set /p planType=请选择套餐类型 (1-3): 
set /p quantity=请输入生成数量: 

if "%planType%"=="" goto :batch
if "%quantity%"=="" goto :batch

node codeGenerator.js batch %planType% %quantity%
pause
goto :start

:validate
echo.
set /p code=请输入要验证的激活码: 
if "%code%"=="" goto :validate
node codeGenerator.js validate %code%
pause
goto :start

:start
cls
goto :menu

:menu
@echo off
chcp 65001 >nul
echo.
echo 🍌 Nano Banana 激活码生成器
echo ================================
echo.
echo 请选择操作：
echo 1. 生成演示激活码（每种套餐1个）
echo 2. 生成尝鲜套餐激活码
echo 3. 生成基础套餐激活码  
echo 4. 生成高阶套餐激活码
echo 5. 批量生成激活码（导出CSV）
echo 6. 验证激活码
echo 0. 退出
echo.
set /p choice=请输入选择 (0-6): 

if "%choice%"=="0" goto :end
if "%choice%"=="1" goto :demo
if "%choice%"=="2" goto :trial
if "%choice%"=="3" goto :basic
if "%choice%"=="4" goto :premium
if "%choice%"=="5" goto :batch
if "%choice%"=="6" goto :validate

echo 无效选择，请重试
pause
goto :menu

:end
echo.
echo 感谢使用 Nano Banana 激活码生成器！
echo.
pause
