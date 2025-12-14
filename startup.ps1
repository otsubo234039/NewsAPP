docker compose up -d
#!/usr/bin/env pwsh
# NewsAPP Quick Startup Script (PowerShell)

# Simple ASCII banner to avoid encoding issues
Write-Host "======================================"
Write-Host "   NewsAPP Startup Script (PowerShell)"
Write-Host "======================================"

# 1. Docker Desktop check
Write-Host "[1/5] Checking Docker Desktop..."
$dockerReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        docker ps | Out-Null
        Write-Host "  -> Docker is up" -ForegroundColor Green
        $dockerReady = $true
        break
    } catch {
        if ($i -eq 1) {
            Write-Host "  -> Starting Docker Desktop..."
            &"C:\Program Files\Docker\Docker\Docker Desktop.exe" | Out-Null
        }
        Write-Host "  -> Waiting for Docker ($i/30 sec)"
        Start-Sleep -Seconds 1
    }
}

if (-not $dockerReady) {
    Write-Host "Docker did not start. Please start Docker Desktop manually." -ForegroundColor Red
    exit 1
}

# 2. Clear port 3000
Write-Host "[2/5] Clearing port 3000..."
try {
    Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess |
        ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Write-Host "  -> Port 3000 cleared" -ForegroundColor Green
} catch {
    Write-Host "  -> Port 3000 was not in use" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# 3. Start backend and DB containers only (not frontend)
Write-Host "[3/5] Starting backend and DB containers..."
docker compose up -d backend db
docker compose stop frontend
Start-Sleep -Seconds 5
$containers = docker compose ps --format "{{.Names}} {{.Status}}"
Write-Host "  -> Containers:" -ForegroundColor Cyan
$containers | ForEach-Object { Write-Host "     $_" }

# 4. Backend connectivity test
Write-Host "[4/5] Testing backend (http://localhost:3001)..."
$apiReady = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/articles?category=it" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "  -> Backend OK" -ForegroundColor Green
            $apiReady = $true
            break
        }
    } catch {
        Write-Host "  -> Waiting for backend ($i/10 sec)"
        Start-Sleep -Seconds 1
    }
}
if (-not $apiReady) { Write-Host "  -> Backend not ready, continuing..." -ForegroundColor Yellow }

# 5. Start frontend
Write-Host "[5/5] Starting frontend dev server (http://localhost:3000)..."
npm run dev
