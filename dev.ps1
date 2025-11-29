# dev.ps1 - Local Development Helper Script

Write-Host "Starting AidRigs Local Development Environment..." -ForegroundColor Green

# 1. Start Database in Docker
Write-Host "`n[1/5] Checking Docker Status..." -ForegroundColor Cyan
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker is not running or not accessible. Please start Docker Desktop and try again."
    exit 1
}

Write-Host "Starting Database Container..." -ForegroundColor Cyan
try {
    docker compose up -d db
    if ($LASTEXITCODE -ne 0) { throw "Docker command failed" }
} catch {
    Write-Error "Failed to start database container. Make sure Docker is running and 'docker compose' is available."
    Write-Error $_
    exit 1
}
Write-Host "Database container started." -ForegroundColor Green

# 2. Setup Backend
Write-Host "`n[2/5] Setting up Backend..." -ForegroundColor Cyan
Set-Location "backend"

# Check for venv
if (-not (Test-Path ".venv")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv .venv
}

# Activate venv
Write-Host "Activating virtual environment..."
.\.venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing Python dependencies..."
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install Python dependencies."
    exit 1
}

# 3. Start Backend
Write-Host "`n[3/5] Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
Write-Host "Backend server started in a new window." -ForegroundColor Green

Set-Location ".."

# 4. Setup Frontend
Write-Host "`n[4/5] Setting up Frontend..." -ForegroundColor Cyan
Set-Location "frontend"

# Install dependencies if node_modules missing
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing Node dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install Node dependencies."
        exit 1
    }
}

# 5. Start Frontend
Write-Host "`n[5/5] Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
Write-Host "Frontend server started in a new window." -ForegroundColor Green

Set-Location ".."

Write-Host "`nDevelopment environment is ready!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000/docs"
Write-Host "Frontend: http://localhost:5173"
