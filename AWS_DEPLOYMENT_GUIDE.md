# AWS デプロイメントガイド

## 📋 事前準備

### 1. AWSアカウントとEC2インスタンス

**推奨スペック:**
- インスタンスタイプ: `t3.medium` (2 vCPU, 4GB RAM)
- OS: Ubuntu 22.04 LTS
- ストレージ: 30GB以上
- リージョン: ap-northeast-1 (東京)

### 2. セキュリティグループ設定

以下のポートを開放してください：

| ポート | プロトコル | 用途 |
|--------|------------|------|
| 22 | TCP | SSH接続 |
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS (SSL設定時) |

## 🚀 デプロイ手順

### Step 1: EC2インスタンスに接続

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 2: 必要なソフトウェアのインストール

```bash
# システムアップデート
sudo apt update && sudo apt upgrade -y

# Docker & Docker Composeのインストール
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Dockerをsudoなしで実行可能にする
sudo usermod -aG docker $USER
newgrp docker

# Gitのインストール
sudo apt install -y git
```

### Step 3: リポジトリのクローン

```bash
cd ~
git clone https://github.com/your-username/NewsAPP.git
cd NewsAPP
```

### Step 4: 環境変数の設定

```bash
# .env.production.exampleをコピー
cp .env.production.example .env.production

# .env.productionを編集
nano .env.production
```

**必須設定項目:**
```bash
# 安全なパスワードを設定
DB_PASSWORD=your_secure_db_password

# SECRET_KEY_BASEを生成
SECRET_KEY_BASE=$(openssl rand -hex 64)

# EC2のパブリックIPまたはドメインを設定
NEXT_PUBLIC_API_URL=http://YOUR_EC2_PUBLIC_IP/api
```

EC2のパブリックIPを確認：
```bash
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

### Step 5: デプロイスクリプトの実行

```bash
# スクリプトに実行権限を付与
chmod +x deploy-aws.sh

# デプロイ実行
./deploy-aws.sh
```

### Step 6: 動作確認

```bash
# コンテナの状態確認
docker-compose -f docker-compose.production.yml ps

# ログ確認
docker-compose -f docker-compose.production.yml logs -f

# ヘルスチェック
curl http://localhost/health
```

ブラウザで `http://YOUR_EC2_PUBLIC_IP` にアクセスして動作確認してください。

## 🔧 トラブルシューティング

### コンテナが起動しない場合

```bash
# ログを確認
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs frontend

# コンテナを再起動
docker-compose -f docker-compose.production.yml restart

# 完全にやり直す
docker-compose -f docker-compose.production.yml down -v
./deploy-aws.sh
```

### データベース接続エラー

```bash
# DBコンテナに直接接続
docker-compose -f docker-compose.production.yml exec db psql -U postgres -d newsapp_production

# マイグレーションを手動実行
docker-compose -f docker-compose.production.yml run --rm backend rails db:migrate
```

### メモリ不足エラー

```bash
# スワップメモリを追加
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 🔄 更新デプロイ

コードを更新した後：

```bash
cd ~/NewsAPP
./deploy-aws.sh
```

## 🔒 セキュリティ強化（オプション）

### 1. Fail2banのインストール（SSH攻撃対策）

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. UFWファイアウォールの設定

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. SSL証明書の設定（Let's Encrypt）

```bash
# Certbotのインストール
sudo apt install -y certbot

# ドメインがある場合、証明書を取得
sudo certbot certonly --standalone -d your-domain.com

# 証明書を nginx/ssl/ にコピー
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ~/NewsAPP/nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ~/NewsAPP/nginx/ssl/

# nginx.confのHTTPS設定を有効化（コメント解除）
nano ~/NewsAPP/nginx/nginx.conf

# Nginxを再起動
docker-compose -f docker-compose.production.yml restart nginx
```

### 4. 自動証明書更新

```bash
# Cronジョブを追加
sudo crontab -e

# 以下を追加（毎月1日の午前2時に更新チェック）
0 2 1 * * certbot renew --quiet && docker-compose -f ~/NewsAPP/docker-compose.production.yml restart nginx
```

## 📊 監視とログ

### コンテナログの確認

```bash
# すべてのログ
docker-compose -f docker-compose.production.yml logs -f

# 特定のサービスのログ
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend
```

### リソース使用状況

```bash
# コンテナのリソース使用状況
docker stats

# ディスク使用状況
df -h

# メモリ使用状況
free -h
```

## 🎯 次のステップ

1. ✅ 独自ドメインの取得と設定
2. ✅ SSL証明書の設定（HTTPS化）
3. ✅ 自動バックアップの設定
4. ✅ CloudWatch等での監視設定
5. ✅ CDN（CloudFront）の設定

## 📞 サポート

問題が発生した場合は、GitHubのIssuesに報告してください。
