#!/usr/bin/env pwsh
# NewsAPP Quick Startup Script (PowerShell)

Write-Host @"
╔════════════════════════════════════════════╗
║    NewsAPP 開発環境 起動スクリプト        ║
╚════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# 1. Docker Desktop 確認
Write-Host "`n📦 Docker Desktop 確認中..." -ForegroundColor Yellow
$dockerReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        docker ps | Out-Null
        Write-Host "✅ Docker が正常に起動しています" -ForegroundColor Green
        $dockerReady = $true
        break
    } catch {
        if ($i -eq 1) {
            Write-Host "Docker Desktop を起動しています..." -ForegroundColor Yellow
            &"C:\Program Files\Docker\Docker\Docker Desktop.exe" | Out-Null
        }
        Write-Host "⏳ Docker 起動待機中... ($i/30秒)" -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
}

if (-not $dockerReady) {
    Write-Host "❌ Docker が起動できませんでした" -ForegroundColor Red
    Write-Host "Docker Desktop を手動で起動してください" -ForegroundColor Red
    exit 1
}

# 2. ポート 3000 クリア
Write-Host "`n🔓 ポート 3000 をクリアしています..." -ForegroundColor Yellow
try {
    Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
        Select-Object -ExpandProperty OwningProcess | 
        ForEach-Object { 
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        }
    Write-Host "✅ ポート 3000 クリア完了" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  ポート 3000 は使用されていません" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# 3. コンテナ起動
Write-Host "`n🚀 バックエンド・DB コンテナを起動しています..." -ForegroundColor Yellow
$appDir = "c:\Users\harut\OneDrive\デスクトップ\NewsAPP"
cd $appDir
docker compose up -d

# コンテナが起動するまで待機
Start-Sleep -Seconds 5

# コンテナ状態確認
$containers = docker compose ps --format "{{.Names}} {{.Status}}"
Write-Host "`n📊 コンテナ状態:" -ForegroundColor Cyan
$containers | ForEach-Object { Write-Host "   $_" -ForegroundColor Green }

# 4. バックエンド接続テスト
Write-Host "`n🔗 バックエンド接続テスト..." -ForegroundColor Yellow
$apiReady = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/articles?category=it" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ バックエンド接続成功" -ForegroundColor Green
            $apiReady = $true
            break
        }
    } catch {
        Write-Host "⏳ バックエンド起動待機中... ($i/10秒)" -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
}

if (-not $apiReady) {
    Write-Host "⚠️  バックエンドがまだ起動していません（自動起動を続行します）" -ForegroundColor Yellow
}

# 5. フロントエンド起動
Write-Host "`n🎨 フロントエンド開発サーバーを起動しています..." -ForegroundColor Yellow
Write-Host @"
╔════════════════════════════════════════════╗
║  📍 http://localhost:3000                  ║
║  🛑 停止するには Ctrl+C を押してください   ║
╚════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

npm run dev
