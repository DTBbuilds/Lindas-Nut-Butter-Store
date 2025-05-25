@echo off
echo ===================================================
echo Starting ngrok for M-PESA integration
echo ===================================================
echo.
echo This script will:
echo 1. Start ngrok to expose your local server to the internet
echo 2. Update configuration files with the new ngrok URL
echo.
echo Press Ctrl+C to stop ngrok at any time
echo.
pause

cd server
node scripts/start-ngrok.js
