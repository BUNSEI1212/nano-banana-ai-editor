@echo off
echo ========================================
echo    Nano Banana Cloud Server Upload
echo ========================================
echo.

:: Set variables
set SERVER_IP=43.142.153.33
set SERVER_USER=root
set LOCAL_PROJECT_DIR=..\
set REMOTE_DIR=/root/

echo Upload Configuration:
echo   - Server IP: %SERVER_IP%
echo   - Username: %SERVER_USER%
echo   - Local Directory: %LOCAL_PROJECT_DIR%
echo   - Remote Directory: %REMOTE_DIR%
echo.

:: Check if server IP is configured
if "%SERVER_IP%"=="your-server-ip" (
    echo ERROR: Please configure server IP address first
    echo Edit this file and replace your-server-ip with actual server IP
    pause
    exit /b 1
)

:: Check if scp command is available
scp >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: scp command not found
    echo Please install OpenSSH client or use other file transfer tools
    pause
    exit /b 1
)

echo Starting file upload...
echo.

:: Upload deployment files
echo Uploading deployment configuration files...
scp -r . %SERVER_USER%@%SERVER_IP%:%REMOTE_DIR%cloud-deploy/
if %errorlevel% neq 0 (
    echo ERROR: Deployment files upload failed
    pause
    exit /b 1
)

:: Upload backend code
echo Uploading backend code...
scp -r %LOCAL_PROJECT_DIR%nano-banana-desktop/backend/ %SERVER_USER%@%SERVER_IP%:%REMOTE_DIR%nano-banana-desktop/
if %errorlevel% neq 0 (
    echo ERROR: Backend code upload failed
    pause
    exit /b 1
)

echo.
echo SUCCESS: Files uploaded successfully!
echo.
echo Next steps:
echo 1. Login to server: ssh %SERVER_USER%@%SERVER_IP%
echo 2. Enter deployment directory: cd /root/cloud-deploy
echo 3. Execute deployment script: chmod +x deploy.sh && ./deploy.sh
echo.
echo Or execute one-click deployment:
echo ssh %SERVER_USER%@%SERVER_IP% "cd /root/cloud-deploy && chmod +x deploy.sh && ./deploy.sh"
echo.

pause
