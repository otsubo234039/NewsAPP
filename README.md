# NewsAPP

Next.js フロントエンド + Ruby on Rails API + PostgreSQL を組み合わせた全スタックアプリケーションです。  
**ローカル開発・Docker 環境での実行・AWS EC2 への本番デプロイ に対応しています。**

## 🏗️ 主な構成

| コンポーネント | 技術 | ポート | 説明 |
|---|---|---|---|
| フロントエンド | Next.js + TypeScript | 3000 | React UI、news feed 表示 |
| バックエンド | Ruby on Rails 8 (API mode) | 3001 | ニュース取得・API エンドポイント |
| データベース | PostgreSQL 15 | 5432 | ユーザ・記事データ保存 |
| リバースプロキシ | Nginx | 80/443 | 本番環境で http リクエストをルーティング |

---

## 📋 前提条件

### ローカル開発環境の場合
- Docker & Docker Compose がインストールされていること
- (オプション) Node.js 18+ と npm

### AWS EC2 デプロイの場合
- AWS アカウント（学生用 Learner Lab 可）
- t3.medium EC2 インスタンス以上
- SSH キーペアの設定

---

## 🚀 クイックスタート（ローカル - Docker）

### 1. リポジトリのクローン＆起動

```bash
git clone https://github.com/otsubo234039/NewsAPP.git
cd NewsAPP
docker compose up -d --build
```

### 2. 確認

```bash
# サービス状態確認
docker compose ps

# ログ確認（終了は Ctrl+C）
docker compose logs -f backend
docker compose logs -f frontend
```

### 3. アクセス

- **フロントエンド**: http://localhost:3000
- **バックエンド API**: http://localhost:3001
- **データベース**: localhost:5432

### 4. 停止

```bash
docker compose down
```

---

## 🌐 AWS EC2 デプロイ（本番環境）

### 前提
- AWS Learner Lab アカウントで t3.medium EC2 インスタンスが起動していること
- SSH キーペア（`newsapp-key.pem`）を `~/.ssh/` に配置

### デプロイ手順

#### 1. EC2 インスタンスへ接続・環境準備

```bash
ssh -i ~/.ssh/newsapp-key.pem ubuntu@<EC2_PUBLIC_IP>

# Docker インストール
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git curl

# Docker ユーザ権限設定
sudo usermod -aG docker $USER
newgrp docker
```

#### 2. リポジトリ取得＆環境変数設定

```bash
cd /home/ubuntu
git clone git@github.com:otsubo234039/NewsAPP.git
cd NewsAPP

# 環境変数ファイルの作成
cp .env.production .env
# 必要に応じて IP アドレスを更新
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://<EC2_PUBLIC_IP>/api|" .env
```

#### 3. Docker コンテナ起動

```bash
docker compose up -d --build
sleep 30
docker compose ps
```

#### 4. アクセス確認

- **フロントエンド**: http://\<EC2_PUBLIC_IP\>:3000
- **バックエンド**: http://\<EC2_PUBLIC_IP\>:3001
- **Nginx (プロダクション)**: http://\<EC2_PUBLIC_IP\>

---

## 📝 環境変数（`/.env.production`）

| 変数 | 用途 | 例 |
|---|---|---|
| `DB_USER` | PostgreSQL ユーザ | postgres |
| `DB_PASSWORD` | PostgreSQL パスワード | NewsApp2025Secure! |
| `DB_NAME` | データベース名 | newsapp_production |
| `DATABASE_HOST` | DB ホスト | db |
| `SECRET_KEY_BASE` | Rails 暗号化キー | (自動生成) |
| `NEXT_PUBLIC_API_URL` | フロント→バック API URL | http://localhost:3001 |

---

## 🔧 運用コマンド

### サービス確認・ログ

```bash
# コンテナ状態確認
docker compose ps

# バックエンド（Rails）ログ
docker compose logs -f backend

# フロント（Next.js）ログ
docker compose logs -f frontend

# DB ログ
docker compose logs -f db
```

### コード更新・再デプロイ

```bash
cd /home/ubuntu/NewsAPP

# 最新コード取得
git pull origin main

# コンテナ再起動
docker compose down
docker compose build --no-cache
docker compose up -d
```

### データベース操作

```bash
# DB マイグレーション実行
docker compose exec backend bundle exec rails db:migrate

# DB リセット＆シード
docker compose exec backend bundle exec rails db:reset db:seed

# ユーザ作成テスト
docker compose exec backend bundle exec rails runner /usr/src/app/backend/tmp_create_user.rb
```

### リソース・ディスク確認

```bash
# Docker ボリューム使用量
docker system df

# ディスク空き容量確認
df -h

# 不要な Image/Volume クリーンアップ
docker system prune -a
```

---

## 🛠️ ローカル開発（Docker 不使用）

### セットアップ

```bash
# Node.js 環境（フロント）
cd frontend
npm install
npm run dev

# Ruby 環境（バック）
cd ../backend
bundle install
rails db:create db:migrate
rails server -p 3001
```

### フロント・バック連携

フロント側 `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 📚 API エンドポイント（開発用）

### ユーザ管理

```bash
# ユーザ登録
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"user":{"name":"太郎","email":"taro@example.com","password":"password123","password_confirmation":"password123"}}'

# ログイン
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"email":"taro@example.com","password":"password123"}'

# ログアウト
curl -X DELETE http://localhost:3001/api/sessions \
  -H "Content-Type: application/json"
```

---

## ⚠️ トラブルシューティング

### バックエンド起動エラー

```bash
# ログ確認
docker compose logs backend

# DB 接続テスト
docker compose exec backend nc -zv db 5432

# DB リセット
docker compose exec backend bundle exec rails db:drop db:create db:migrate
```

### フロント接続できない

```bash
# Nginx 設定確認
docker compose exec nginx nginx -t

# Nginx ログ確認
docker compose logs nginx
```

### ディスク満杯

```bash
docker system prune -af
```

---

## 📄 ファイル構成

```
.
├── frontend/              # Next.js フロントエンド
│   ├── package.json
│   ├── next.config.js
│   ├── pages/
│   └── components/
├── backend/               # Rails バックエンド
│   ├── Gemfile
│   ├── config/
│   ├── app/
│   └── db/
├── nginx/                 # Nginx リバースプロキシ
│   └── nginx.conf
├── docker-compose.yml     # ローカル開発用
├── docker-compose.production.yml  # 本番用
└── README.md
```

---

## 📝 ライセンス

このプロジェクトは学習目的のサンプルアプリケーションです。

---

## 📧 サポート

問題が発生した場合は、以下をご確認ください：
1. `.env` ファイルが正しく設定されているか
2. Docker と docker-compose がインストールされているか
3. ポート 3000, 3001, 5432 が使用可能か
4. AWS EC2 デプロイの場合、セキュリティグループでポート開放がされているか

---

**更新日**: 2025-12-20
