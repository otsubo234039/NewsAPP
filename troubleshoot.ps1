#!/usr/bin/env pwsh
# NewsAPP Troubleshooting & Cleanup Script

Write-Host @"
╔════════════════════════════════════════════╗
║    NewsAPP トラブル対応スクリプト          ║
╚════════════════════════════════════════════╝
"@ -ForegroundColor Yellow

Write-Host "`nどの対応を実行しますか？" -ForegroundColor Cyan
Write-Host "1) ポート 3000 をクリア" -ForegroundColor White
Write-Host "2) .next キャッシュを削除して再起動" -ForegroundColor White
Write-Host "3) Docker コンテナを再起動" -ForegroundColor White
Write-Host "4) 全てのトラブルをリセット" -ForegroundColor White
Write-Host "5) バックエンド接続テスト" -ForegroundColor White
Write-Host "0) キャンセル" -ForegroundColor White

$choice = Read-Host "`n選択 (0-5)"

$appDir = "c:\Users\harut\OneDrive\デスクトップ\NewsAPP"

switch ($choice) {
    "1" {
        Write-Host "`n🔓 ポート 3000 をクリアしています..." -ForegroundColor Yellow
        Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
            Select-Object -ExpandProperty OwningProcess | 
            ForEach-Object { 
                Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
            }
        Write-Host "✅ ポート 3000 クリア完了" -ForegroundColor Green
        Write-Host "npm run dev を実行してください" -ForegroundColor Cyan
    }
    
    "2" {
        Write-Host "`n🗑️  .next キャッシュを削除しています..." -ForegroundColor Yellow
        cd "$appDir\frontend"
        Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ キャッシュ削除完了" -ForegroundColor Green
        
        Write-Host "`n⏳ 再起動しています..." -ForegroundColor Yellow
        cd $appDir
        npm run dev
    }
    
    "3" {
        Write-Host "`n🔄 Docker コンテナを再起動しています..." -ForegroundColor Yellow
        cd $appDir
        docker compose down
        Write-Host "⏳ 10秒待機中..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
        docker compose up -d
        Write-Host "✅ コンテナ再起動完了" -ForegroundColor Green
        Write-Host "`ndocker compose ps で状態確認してください" -ForegroundColor Cyan
    }
    
    "4" {
        Write-Host "`n🔄 全トラブル対応を実行しています..." -ForegroundColor Yellow
        
        # Docker コンテナを停止
        Write-Host "`n  1) Docker コンテナを停止中..." -ForegroundColor Gray
        cd $appDir
        docker compose down -ErrorAction SilentlyContinue
        
        # ポート 3000 クリア
        Write-Host "`n  2) ポート 3000 をクリア中..." -ForegroundColor Gray
        Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
            Select-Object -ExpandProperty OwningProcess | 
            ForEach-Object { 
                Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
            }
        
        # .next キャッシュ削除
        Write-Host "`n  3) .next キャッシュを削除中..." -ForegroundColor Gray
        Remove-Item -Path "$appDir\frontend\.next" -Recurse -Force -ErrorAction SilentlyContinue
        
        # node_modules キャッシュ削除（オプション）
        Write-Host "`n  4) npm キャッシュをクリア中..." -ForegroundColor Gray
        npm cache clean --force -ErrorAction SilentlyContinue
        
        Write-Host "`n✅ 全トラブル対応完了" -ForegroundColor Green
        Write-Host "`n次のコマンドを実行してください：" -ForegroundColor Cyan
        Write-Host "  docker compose up -d" -ForegroundColor White
        Write-Host "  npm run dev" -ForegroundColor White
    }
    
    "5" {
        Write-Host "`n🔗 バックエンド API テスト実行中..." -ForegroundColor Yellow
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/api/articles?category=it" -UseBasicParsing -TimeoutSec 5
            $json = $response.Content | ConvertFrom-Json
            $articleCount = $json.articles | Measure-Object | Select-Object -ExpandProperty Count
            
            Write-Host "✅ バックエンド接続成功" -ForegroundColor Green
            Write-Host "📊 取得記事数: $articleCount" -ForegroundColor Cyan
            
            if ($articleCount -gt 0) {
                Write-Host "`n最初の記事:" -ForegroundColor Gray
                $json.articles[0] | Select-Object title, source | Format-List
            }
        } catch {
            Write-Host "❌ バックエンド接続失敗" -ForegroundColor Red
            Write-Host "エラー: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "`n確認事項:" -ForegroundColor Yellow
            Write-Host "  1) Docker Desktop が起動しているか確認" -ForegroundColor White
            Write-Host "  2) docker compose ps でコンテナが Running か確認" -ForegroundColor White
            Write-Host "  3) docker compose logs backend でログ確認" -ForegroundColor White
        }
    }
    
    "0" {
        Write-Host "キャンセルしました" -ForegroundColor Gray
    }
    
    default {
        Write-Host "無効な選択です" -ForegroundColor Red
    }
}

Write-Host "`n" -ForegroundColor White
