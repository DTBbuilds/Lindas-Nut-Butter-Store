# Enhanced PowerShell script to start all Linda's Nut Butter Store services
# This script starts MongoDB, backend, frontend, and ngrok with a single command

Write-Host "=======================================================" -ForegroundColor Green
Write-Host "LINDA'S NUT BUTTER STORE - STARTING ALL SERVICES" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green

# Define colors for better readability
function Write-ColoredOutput {
    param (
        [string]$Message,
        [string]$Type = "Info"
    )
    
    switch ($Type) {
        "Info"    { Write-Host $Message -ForegroundColor Cyan }
        "Success" { Write-Host $Message -ForegroundColor Green }
        "Warning" { Write-Host $Message -ForegroundColor Yellow }
        "Error"   { Write-Host $Message -ForegroundColor Red }
        default   { Write-Host $Message }
    }
}

# Check if MongoDB is running
function Test-MongoDBRunning {
    try {
        $mongodProcess = Get-Process mongod -ErrorAction SilentlyContinue
        if ($mongodProcess) {
            return $true
        }
        
        # Check ports
        $mongoPort = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue
        if ($mongoPort) {
            return $true
        }
        
        return $false
    }
    catch {
        return $false
    }
}

# Start MongoDB if not already running
function Start-MongoDB {
    if (Test-MongoDBRunning) {
        Write-ColoredOutput "MongoDB is already running" "Success"
        return
    }
    
    Write-ColoredOutput "Starting MongoDB..." "Info"
    
    # Create data directory if it doesn't exist
    $dataPath = Join-Path -Path (Get-Location) -ChildPath "mongodb-data"
    if (-not (Test-Path $dataPath)) {
        New-Item -Path $dataPath -ItemType Directory -Force | Out-Null
    }
    
    # Start MongoDB
    try {
        Start-Process "mongod" -ArgumentList "--dbpath", $dataPath -NoNewWindow
        Start-Sleep -Seconds 5
        
        if (Test-MongoDBRunning) {
            Write-ColoredOutput "MongoDB started successfully" "Success"
        } else {
            Write-ColoredOutput "Failed to start MongoDB. Please make sure MongoDB is installed." "Error"
        }
    }
    catch {
        Write-ColoredOutput "Error starting MongoDB: $_" "Error"
    }
}

# Start the application with enhanced startup script
function Start-EnhancedApp {
    $projectRoot = (Get-Item -Path $PSScriptRoot).Parent.FullName
    Set-Location -Path $projectRoot
    
    Write-ColoredOutput "Starting Linda's Nut Butter Store application..." "Info"
    
    try {
        # Use the node.js enhanced startup script
        node server/enhancedStartup.js
    }
    catch {
        Write-ColoredOutput "Error starting the application: $_" "Error"
    }
}

# Main execution
try {
    # Start MongoDB
    Start-MongoDB
    
    # Start the application
    Start-EnhancedApp
}
catch {
    Write-ColoredOutput "An error occurred: $_" "Error"
}
