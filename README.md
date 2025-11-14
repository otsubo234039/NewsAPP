```markdown
# NewsAPP

軽量な開発用スタック（Next.js フロントエンド、Rails API バックエンド、PostgreSQL）を Docker Compose で立ち上げるサンプルリポジトリです。

**目的**: ローカル Docker 上でフロント→バックエンドの挙動を確認できる開発環境を提供します。

**重要**: 本リポジトリにはコンテナ内で生成された `vendor/bundle` が一時的に存在していましたが、`.gitignore` に追加してインデックスから除外しています。

## 必要なもの
- Docker / Docker Compose
- （開発時）Node.js / npm（ローカルで直接実行する場合のみ）

## 起動（推奨: Docker）
1. Compose でビルドして起動します:

```powershell
docker compose up -d --build
```

2. サービス一覧とログ確認:

```powershell
docker compose ps
docker compose logs -f
```

3. 停止:

```powershell
docker compose down
```

ポート:
- フロントエンド: `http://localhost:3000/`
- バックエンド (コンテナ内): `http://backend:3000/`（コンテナ間通信）
- バックエンド (ホスト経由): `http://localhost:3001/`（Compose のポートマッピング）

フロントはサーバーサイドレンダリングで初回にバックエンドからデータを取得するよう設定しています。

## 開発メモ / 設定
- フロントのビルド時に埋められるクライアント用 API URL: `NEXT_PUBLIC_API_URL`（デフォルト `http://localhost:3001`）
- サーバーサイドからバックエンドへ到達させるために `SERVER_API_URL` を環境変数で設定しています（`docker-compose.yml` 内）
- Rails の開発環境はホスト制限を緩和しています（`config/environments/development.rb` に `config.hosts.clear` を追加）。これはローカル Docker 開発向けの簡易設定です。

## 動作確認
1. ブラウザで `http://localhost:3000/` を開き、ページ内に以下のような JSON が表示されれば成功です:

```json
{"status":"ok","message":"Rails API running"}
```

2. 直接バックエンドを確認する場合:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3001/ | Select-Object -ExpandProperty Content
```

## Git / リモートについて
- 変更はローカルでコミット済みです。GitHub へ push する際は認証（SSH または PAT）が必要です。
- ご希望の通り、SSH による push は明日行う予定とのことなので、本日は README の更新までで完了します。

明日の作業（予定）:
- SSH 鍵を GitHub に登録し、`git push origin main` を実行してリモートへ反映します。

必要であれば、明日の SSH 設定手順（鍵生成・GitHub への追加・リモートの確認）を私が手順で案内します。

---

要点のみ記載しました。さらに README に追記してほしい内容（例: 環境変数の一覧、DB マイグレーション手順、テスト実行コマンドなど）があれば教えてください。
```
