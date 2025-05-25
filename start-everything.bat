@echo off
color 0A
cls
echo ===============================================================
echo   LINDA'S NUT BUTTER STORE - STARTING ALL SERVICES
echo   (MongoDB, Backend, Frontend, and Ngrok in one command)
echo ===============================================================
echo.

:: Change to the project directory
cd /d "%~dp0"

:: Check for Node.js installation
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ERROR: Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check for MongoDB installation
where mongod >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: MongoDB executable not found in PATH.
    echo This script will attempt to start MongoDB, but it might fail.
    echo If MongoDB fails to start, please install MongoDB from https://www.mongodb.com/try/download/community
    echo.
    timeout /t 3 >nul
)

:: Check for ngrok installation
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: ngrok executable not found in PATH.
    echo This script will attempt to start ngrok, but it might fail.
    echo If ngrok fails to start, please install ngrok from https://ngrok.com/download
    echo.
    timeout /t 3 >nul
)

:: Create mongodb-data directory if it doesn't exist
if not exist "mongodb-data" (
    echo Creating MongoDB data directory...
    mkdir "mongodb-data"
)

echo Starting all services...
echo.

:: Run the enhanced startup script
call npm run start:enhanced

:: If there's an error, pause so the user can see the message
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo Error starting services. See above for details.
    pause
    exit /b 1
)
