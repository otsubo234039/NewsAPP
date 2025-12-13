# NewsAPP 開発環境セットアップ・起動ガイド

## 📋 必要な環境

- **Docker Desktop** （Windows 版）
- **Node.js** v18 以上
- **npm** v8 以上

---

## 🚀 初回セットアップ（初めてだけ）

### 1. リポジトリをクローン
```powershell
git clone <リポジトリURL>
cd NewsAPP
```

### 2. フロントエンド依存パッケージをインストール
```powershell
cd frontend
npm install
cd ..
```

### 3. バックエンド用 `.env` ファイルを確認
`backend/.env` が存在することを確認してください

---

## 🔄 毎回の起動手順（推奨）

### **ステップ1: Docker Desktop を起動**
1. Windows タスクバーから **Docker Desktop** を検索して起動
2. トレイアイコンに Docker アイコンが表示されるまで待機（約1-2分）
3. 確認方法：以下のコマンドで `docker ps` が成功すれば OK
   ```powershell
   docker ps
   ```

### **ステップ2: バックエンド＋DB コンテナを起動**
```powershell
cd "c:\Users\harut\OneDrive\デスクトップ\NewsAPP"
docker compose up -d
```

**確認方法：**
```powershell
docker compose ps
```
以下のように **Running** が表示されれば OK：
```
NAME                COMMAND             STATUS
newsapp-db-1        postgres            Up
newsapp-backend-1   rails server        Up
```

### **ステップ3: フロントエンド開発サーバーを起動**
```powershell
cd "c:\Users\harut\OneDrive\デスクトップ\NewsAPP"
npm run dev
```

出力に以下が表示されれば OK：
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully in XXX ms
```

### **ステップ4: ブラウザで確認**
- URL: `http://localhost:3000`
- 実データが表示されれば成功
- ダミー記事が表示される場合 → バックエンド接続エラー（以下のトラブルシューティングを参照）

---

## ⚡ 高速起動スクリプト

以下の PowerShell スクリプトを `startup.ps1` として保存すれば、ワンコマンドで起動可能：

```powershell
# startup.ps1
Write-Host "=== NewsAPP 起動スクリプト ===" -ForegroundColor Cyan

# Docker Desktop が起動しているか確認
Write-Host "Docker Desktop の起動確認中..." -ForegroundColor Yellow
$maxRetries = 30
$retryCount = 0
while ($retryCount -lt $maxRetries) {
    try {
        docker ps | Out-Null
        Write-Host "✅ Docker が正常に起動しています" -ForegroundColor Green
        break
    } catch {
        $retryCount++
        if ($retryCount -eq 1) {
            Write-Host "Docker Desktop を起動しています..." -ForegroundColor Yellow
            &"C:\Program Files\Docker\Docker\Docker Desktop.exe" | Out-Null
        }
        Write-Host "待機中... ($retryCount/$maxRetries秒)" -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
}

if ($retryCount -eq $maxRetries) {
    Write-Host "❌ Docker が起動できませんでした" -ForegroundColor Red
    Write-Host "Docker Desktop を手動で起動してください"
    exit 1
}

# ポート 3000 が占有されている場合は強制終了
Write-Host "ポート 3000 をクリアしています..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
    Select-Object -ExpandProperty OwningProcess | 
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2

# コンテナを起動
Write-Host "バックエンド・DB コンテナを起動中..." -ForegroundColor Yellow
cd "c:\Users\harut\OneDrive\デスクトップ\NewsAPP"
docker compose up -d
Start-Sleep -Seconds 5

# フロントエンド開発サーバーを起動
Write-Host "フロントエンド開発サーバーを起動中..." -ForegroundColor Yellow
npm run dev
```

**使用方法：**
```powershell
# PowerShell を管理者として実行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\startup.ps1
```

---

## 🛑 停止手順

### フロントエンド開発サーバーを停止
- ターミナルで **Ctrl+C** を押す

### バックエンド・DB コンテナを停止
```powershell
docker compose down
```

### Docker Desktop を終了
- トレイアイコンを右クリック → Quit Docker Desktop

---

## 🔧 よくあるトラブル＆解決方法

### ❌ エラー: `ERR_CONNECTION_REFUSED` （ポート 3000 に接続できない）

**原因：** フロントエンド開発サーバーが起動していない

**解決：**
```powershell
# ポート 3000 占有プロセスを強制終了
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
    Select-Object -ExpandProperty OwningProcess | 
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

# .next キャッシュ削除
cd "c:\Users\harut\OneDrive\デスクトップ\NewsAPP\frontend"
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# 再起動
cd ..
npm run dev
```

---

### ❌ エラー: `開発用フォールバック記事を表示しています` （ダミー記事表示）

**原因：** バックエンド（`http://localhost:3001`）に接続できていない

**解決：**
```powershell
# 1. バックエンド接続テスト
curl -s http://localhost:3001/api/articles?category=it

# 2. コンテナが起動しているか確認
docker compose ps

# 3. コンテナが起動していない場合
docker compose up -d

# 4. ブラウザをリロード（Ctrl+Shift+R で強制リロード）
```

---

### ❌ エラー: `address already in use :::3000`

**原因：** ポート 3000 が既に占有されている

**解決：**
```powershell
# 占有プロセスを強制終了
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
    Select-Object -ExpandProperty OwningProcess | 
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

# 再起動
npm run dev
```

---

### ❌ エラー: `docker: error during connect: unable to connect to dockerDesktopLinuxEngine`

**原因：** Docker Desktop が起動していない、または WSL 2 で問題が発生

**解決：**
```powershell
# 1. Docker Desktop を起動
&"C:\Program Files\Docker\Docker\Docker Desktop.exe"

# 2. 30秒待機

# 3. 再度コマンド実行
docker ps

# 4. それでも失敗する場合
wsl --list --verbose
wsl --terminate docker-desktop
docker ps  # 再試行
```

---

### ❌ エラー: `EINVAL: invalid argument, readlink '.next/server/middleware-manifest.json'`

**原因：** `.next` キャッシュが破損している

**解決：**
```powershell
cd "c:\Users\harut\OneDrive\デスクトップ\NewsAPP\frontend"
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
cd ..
npm run dev
```

---

## 📊 アーキテクチャ概要

```
┌─────────────────────────────────────────────────────┐
│ Windows ホストマシン                                 │
├─────────────────────────────────────────────────────┤
│ [npm run dev]  ← フロントエンド開発サーバー          │
│ ブラウザ: http://localhost:3000                      │
│                                                     │
│ Docker Desktop (WSL 2 バックエンド)                 │
│  ├─ newsapp-db-1         (PostgreSQL, localhost:5432)│
│  └─ newsapp-backend-1    (Rails, localhost:3001)    │
└─────────────────────────────────────────────────────┘
```

### 通信経路

1. **ブラウザ** → **フロントエンド** (http://localhost:3000)
2. **フロントエンド** → **バックエンド** (http://localhost:3001)
3. **バックエンド** → **DB** (PostgreSQL)

---

## 🔍 ログ確認方法

### バックエンドログ
```powershell
docker compose logs backend --tail 50
```

### フロントエンド開発ログ
開発サーバーのターミナルをそのまま監視（リアルタイム表示）

### すべてのコンテナログ
```powershell
docker compose logs --tail 50
```

---

## ✅ チェックリスト（毎回確認）

- [ ] Docker Desktop トレイアイコンが表示されている
- [ ] `docker ps` で `newsapp-db-1` と `newsapp-backend-1` が Running と表示される
- [ ] `npm run dev` の出力に `ready started server on 0.0.0.0:3000` がある
- [ ] ブラウザで `http://localhost:3000` にアクセス可能
- [ ] 実データが表示されている（ダミー記事ではない）

---

## 🎯 まとめ

### 最小起動コマンド（3行）
```powershell
docker compose up -d
npm run dev
# ブラウザで http://localhost:3000 を開く
```

### 問題が発生したら
1. **ブラウザを Ctrl+Shift+R で強制リロード**
2. **docker compose ps** で コンテナ状態確認
3. **docker compose logs backend** でバックエンドログ確認
4. **ポート 3000 を強制解放**（前述の方法）

以上です！ご質問があれば、いつでもお聞きください。
