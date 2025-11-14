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
docker compose down
```

重要なエンドポイント
- フロントエンド: `http://localhost:3000/` (ホスト)
- バックエンド (コンテナ間): `http://backend:3000/` (Compose ネットワーク)
- バックエンド (ホスト経由): `http://localhost:3001/` (ポートマッピング)

環境変数（主要）
- `NEXT_PUBLIC_API_URL`: クライアント側に埋める API ベース URL（例: `http://localhost:3001`）
- `SERVER_API_URL`: サーバーサイド（Next.js の SSR）からバックエンドへアクセスする URL（Compose 内では `http://backend:3000` を推奨）

ローカル開発（ローカルで Next dev を使う場合）
1. Docker で frontend コンテナが起動している場合は先に停止してポートを空ける:

```powershell
docker compose stop frontend
```

2. ルートで次のコマンドを実行すると `frontend` 側の dev を起動します（リポジトリルートに proxy 用の `package.json` を用意しています）:

```powershell
npm run dev
```

開発メモ
- `backend/Dockerfile` は DB の TCP ポートが利用可能になるまで待機してから `bin/rails db:create db:migrate` と `bin/rails server` を順に実行するようになっています。
- VS Code のワークスペース設定（`.vscode/settings.json`）に補完関連の設定を追加しています。補完の挙動は必要に応じてこのファイルを編集してください。

動作確認
1. フロント表示（SSR）: `http://localhost:3000/` を開き、ページ内にバックエンド応答（例: `{"status":"ok","message":"Rails API running"}`）が表示されれば連携成功です。
2. 直接バックエンドを確認する場合:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3001/ | Select-Object -ExpandProperty Content
```

Git / リモート
- リモートへ push するには GitHub 側の認証が必要です（SSH 鍵または Personal Access Token）。このリポジトリは SSH リモートを利用する設定になっています。

今後の作業案
- CI / lint の追加、Compose のヘルスチェック導入、DB マイグレーションの運用改善などを追加できます。要望があれば対応します。

---

不明点や追記希望（環境変数の詳細、マイグレーション手順、SSH 登録手順など）があれば教えてください。

- `NEXT_PUBLIC_API_URL` — クライアント側に埋める API ベース URL（デフォルト: `http://localhost:3001`）
- `SERVER_API_URL` — サーバーサイド（Next.js の SSR など）からバックエンドへアクセスするための URL（Compose 内では `http://backend:3000` を推奨）

開発メモ
- フロントは SSR を用いて初回レンダリング時にバックエンドへアクセスする想定です。
- `backend/Dockerfile` は DB の TCP ポートが開くまで待機してからマイグレーション・サーバ起動を行うようにしています。

動作確認
1. ブラウザで `http://localhost:3000/` を開き、フロントのページが表示されることを確認します。
2. 直接バックエンドを確認する場合:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3001/ | Select-Object -ExpandProperty Content
```

Git / リモート
- リモートへの push は認証（SSH または Personal Access Token）が必要です。
- 本リポジトリは現在 SSH リモートへ切り替え済み。公開鍵を GitHub に登録すれば `git push origin main` で反映されます。

追加で欲しい内容があれば教えてください（環境変数一覧、マイグレーション手順、CI 設定など）。
