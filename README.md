# NewsAPP

軽量な開発用スタックのサンプルリポジトリです。

- Frontend: Next.js + TypeScript
- Backend: Ruby on Rails (API mode)
- Database: PostgreSQL (Compose)

目的
-- ローカルでフロント ⇄ バックエンドの連携を確認できる開発環境を提供します。

前提
- Docker / Docker Compose がインストールされていること。ローカルで直接開発する場合は Node.js と npm が必要です。

推奨の起動手順（Docker）
1. ビルドしてバックグラウンドで起動:

```powershell
docker compose up -d --build
```

2. サービス確認 / ログ確認:

```powershell
docker compose ps
docker compose logs -f
```

3. 停止:

```powershell
# NewsAPP

このリポジトリは、Next.js フロントエンドと Ruby on Rails API（PostgreSQL）を組み合わせたローカル開発用サンプルです。

主な構成
- フロントエンド: Next.js + TypeScript (`frontend/`)
- バックエンド: Ruby on Rails API (`backend/`)
- DB: PostgreSQL (Docker Compose)

前提
- Docker と Docker Compose がインストールされていること

クイックスタート（Docker）
1. リポジトリのルートでサービスをビルド＆起動:

```powershell
docker compose up -d --build
```

2. ログを確認する:

```powershell
docker compose logs -f
```

3. 停止:

```powershell
docker compose down
```

重要な URL
- フロントエンド: `http://localhost:3000/`
- バックエンド (ホスト経由): `http://localhost:3001/`

主な API（開発用）
- ユーザ登録: `POST /api/users`
	- Content-Type: `application/json`
	- Body 例:
		```json
		{ "user": { "name":"テスト", "email":"test@example.com", "password":"secret", "password_confirmation":"secret" } }
		```
- ログイン: `POST /api/sessions`
	- Body 例:
		```json
		{ "email": "test@example.com", "password": "secret" }
		```
- ログアウト: `DELETE /api/sessions`

バックエンドの簡易テスト（ユーザ作成／確認）
- コンテナ内で rails runner を使ってテストユーザを作成・確認できます:

```powershell
docker compose exec backend sh -c "bundle exec rails runner /usr/src/app/backend/tmp_create_user.rb"
docker compose exec backend sh -c "bundle exec rails runner /usr/src/app/backend/tmp_list_users.rb"
```

フロントエンド開発
- フロントの開発サーバをローカルで起動する場合は、`frontend` コンテナを停止してからローカルで `npm run dev` を実行してください。

補足・運用メモ
- CORS は開発環境向けに `rack-cors` を有効にしています（`backend/config/initializers/cors.rb`）。
- フロントは API 呼び出しで `credentials: 'include'` を使い、セッション Cookie を利用してログイン状態を保持します。

問い合わせ / 次の作業候補
- API の認証強化（トークンベース）、追加フィードの登録、UI/UX 改善、CI 導入など。希望があれば対応します。

---

必要なら README に追加してほしい項目（環境変数の詳細、CI 手順、データシード方法など）を教えてください。
