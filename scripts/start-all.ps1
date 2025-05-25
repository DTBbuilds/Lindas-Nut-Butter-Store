# Linda's Nut Butter Store - All-in-One Startup Script
# This script starts all necessary services in separate terminals:
# 1. MongoDB (if local instance is needed)
# 2. Backend Server
# 3. Frontend Development Server
# 4. Ngrok Tunnel (for M-Pesa callbacks)

# Configuration
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot
$SERVER_PORT = 5000
$FRONTEND_PORT = 3000
$MONGODB_PORT = 27017

# Color output for better visibility
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Display banner
Write-ColorOutput Green "========================================================"
Write-ColorOutput Green "  Linda's Nut Butter Store - All-in-One Startup Script  "
Write-ColorOutput Green "========================================================"
Write-Output ""

# Check if ngrok is installed
try {
    $ngrokVersion = Invoke-Expression "ngrok --version"
    Write-ColorOutput Green "✓ Ngrok is installed"
} catch {
    Write-ColorOutput Red "✗ Ngrok is not installed or not in PATH"
    Write-ColorOutput Yellow "Please install ngrok from https://ngrok.com/download"
    Write-ColorOutput Yellow "Then add it to your PATH and try again"
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = Invoke-Expression "node --version"
    Write-ColorOutput Green "✓ Node.js is installed: $nodeVersion"
} catch {
    Write-ColorOutput Red "✗ Node.js is not installed or not in PATH"
    exit 1
}

# Start MongoDB if needed (uncomment if using local MongoDB)
# Start-Process powershell -ArgumentList "-NoExit -Command & {
#    Write-Host 'Starting MongoDB...' -ForegroundColor Cyan
#    mongod --port $MONGODB_PORT
# }"
# Write-ColorOutput Green "✓ Started MongoDB on port $MONGODB_PORT"

# Start Backend Server
Start-Process powershell -ArgumentList "-NoExit -Command & {
    Set-Location '$PROJECT_ROOT'
    Write-Host 'Starting Backend Server...' -ForegroundColor Cyan
    npm run server
}"
Write-ColorOutput Green "✓ Started Backend Server on port $SERVER_PORT"

# Wait for backend to initialize
Write-Output "Waiting for backend server to initialize..."
Start-Sleep -Seconds 5

# Start Frontend Development Server
Start-Process powershell -ArgumentList "-NoExit -Command & {
    Set-Location '$PROJECT_ROOT'
    Write-Host 'Starting Frontend Development Server...' -ForegroundColor Cyan
    npm start
}"
Write-ColorOutput Green "✓ Started Frontend Development Server on port $FRONTEND_PORT"

# Start Ngrok with M-Pesa callback updates
Start-Process powershell -ArgumentList "-NoExit -Command & {
    Set-Location '$PROJECT_ROOT'
    Write-Host 'Starting Ngrok Tunnel with M-Pesa callback updates...' -ForegroundColor Cyan
    node server/ngrokTunnel.js
}"
Write-ColorOutput Green "✓ Started Ngrok Tunnel"

Write-Output ""
Write-ColorOutput Yellow "All services have been started in separate windows."
Write-ColorOutput Yellow "To stop all services, close each terminal window."
Write-ColorOutput Yellow "Your app should be accessible at http://localhost:$FRONTEND_PORT"
Write-ColorOutput Yellow "Backend API is at http://localhost:$SERVER_PORT"
Write-ColorOutput Yellow "Ngrok will provide a public URL in its terminal window."
