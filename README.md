# NewsAPP

このリポジトリは NewsAPP の最小構成（Node.js + Docker）を含みます。

## 使い方（ローカル）
- Node.js がインストールされている環境で:

```powershell
npm install
npm start
```

アクセス: `http://localhost:3000/`

## Docker を使って起動（推奨）
Docker が起動している環境で次を実行してください:

```powershell
docker compose up -d --build
```

コンテナの確認:

```powershell
docker ps
docker compose ps
docker compose logs -f
```

停止:

```powershell
docker compose down
```

## スタック
- フロントエンド: Next.js + TypeScript (React)
- バックエンド: Ruby on Rails (API mode)
- DB: PostgreSQL

## GitHub へプッシュ
リポジトリに変更をコミットしてリモートへプッシュします:

```powershell
git add -A
git commit -m "Add scaffold and Docker setup"
git push origin main
```

（Push に認証が必要です。失敗した場合は、SSH キーまたは PAT の設定を確認してください）
