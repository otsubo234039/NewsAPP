# AWS 準備手順（S3 + CloudFront デプロイ向け）

このドキュメントは、本リポジトリのフロントエンドを S3 にホストし、CloudFront で配信するための最小限の準備手順を示します。
手順は学習・開発向けです。実運用ではセキュリティとコスト設計を必ず見直してください。

前提
- `aws` CLI がインストールされ、`aws configure` で認証が設定されていること（あなたのローカル環境で実行してください）。
- GitHub リポジトリの管理権限（Secrets を追加できること）。

推奨ワークフロー概要
1. S3 バケットを作成
2. IAM ユーザを作成し、最小権限のデプロイ用ポリシーを割り当てる
3. GitHub リポジトリに Secrets を登録（`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`）
4. 既に追加済みの GitHub Actions (`.github/workflows/deploy-frontend-s3.yml`) により `push` で自動デプロイされる

---

1) S3 バケット作成（PowerShell）

```powershell
# 例: バケット名を一意に変更してください
$bucket = 'newsapp-frontend-yourname'
$region = 'ap-northeast-1'
aws s3api create-bucket --bucket $bucket --region $region --create-bucket-configuration LocationConstraint=$region
# 開発用途なら公開読み取りを許可（本番では CloudFront OAI を使いバケットをプライベートにする）
aws s3 website s3://$bucket --index-document index.html
```

2) IAM ポリシーとユーザ作成（CLI の例）

- このリポジトリにはサンプルポリシー `docs/iam/newsapp-deploy-policy.json` を用意しました。まずそれを参考に、IAM ポリシーを作成します。

```powershell
# ポリシー作成
aws iam create-policy --policy-name NewsAppDeployPolicy --policy-document file://docs/iam/newsapp-deploy-policy.json

# IAM ユーザ作成（--permissions-boundary などは省略）
aws iam create-user --user-name newsapp-deployer

# ポリシーをアタッチ
aws iam attach-user-policy --user-name newsapp-deployer --policy-arn arn:aws:iam::<ACCOUNT_ID>:policy/NewsAppDeployPolicy

# アクセスキー作成（表示されるシークレットを控えてください）
aws iam create-access-key --user-name newsapp-deployer
```

注意: `<ACCOUNT_ID>` はご自身の AWS アカウント ID に置き換えてください。`create-access-key` の出力をコピーして安全な場所に保管してください（GitHub Secrets に貼るため）。

3) GitHub リポジトリに Secrets を登録

リポジトリの Settings → Secrets → Actions に以下を追加してください:
- `AWS_ACCESS_KEY_ID` — 上で作成したアクセスキーの `AccessKeyId`
- `AWS_SECRET_ACCESS_KEY` — 上で作成したアクセスキーの `SecretAccessKey`
- `AWS_REGION` — 例: `ap-northeast-1`
- `S3_BUCKET` — 例: `newsapp-frontend-yourname`
- `CLOUDFRONT_DISTRIBUTION_ID` — CloudFront を作る場合に指定（まだ無ければ空のままでも OK。ワークフローは invalidation をスキップします）
- `NEXT_PUBLIC_API_URL` — フロントが SSR で参照する API ベース URL（例: `http://localhost:3001` または公開 URL）

4) CloudFront の注意点

- 学習向けには、S3 を直接ウェブホスティング（静的サイトホスティング）にして公開しても構いません。より本番に近い構成は CloudFront + S3 (private origin + OAI) です。
- CloudFront を CLI で作ることもできますが、初回はコンソールで Origin に S3 を指定して作る方が分かりやすいです。作成後に `CLOUDFRONT_DISTRIBUTION_ID` を GitHub Secrets に設定してください。

5) デプロイのトリガー

- GitHub Actions のワークフローは `main` ブランチへの push で起動します。Secrets を設定後に `git commit --allow-empty -m "trigger deploy" && git push origin main` を実行すると動作確認できます。

6) 後片付け（重要：コスト管理）

- 学習が終わったら S3 バケット、IAM ユーザ、CloudFront 配信を削除してください。RDS/EC2 を使っていればそれらも忘れずに。

---

付録: トラブルシューティング
- Actions が失敗する場合は、Actions の実行ログで `aws` コマンドのエラーを確認してください。典型的には権限不足（IAM ポリシー）か、バケット名の権限/存在が原因です。
- CloudFront invalidation が失敗する場合は `CLOUDFRONT_DISTRIBUTION_ID` を確認してください。

---

この手順ファイルの編集や、Terraform / CloudFormation のテンプレート化を希望する場合は教えてください。より安全な CloudFront+OAI の手順や IAM 権限の最小化も対応できます。
