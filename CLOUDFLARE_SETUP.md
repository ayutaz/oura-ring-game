# 🚀 Cloudflare デプロイ完全ガイド

## 自動化できる部分 ✅

以下は**すべて自動化済み**です：

1. **インフラ作成**
   - D1データベースの作成
   - KVストレージの作成
   - wrangler.tomlの自動更新

2. **スキーマ適用**
   - D1用SQLスキーマの適用

3. **CI/CDパイプライン**
   - GitHub Actionsによる自動デプロイ

## あなたが手動で行う必要がある作業 📝

### 1. Cloudflareアカウントの準備（5分）

```bash
# 1. Cloudflareアカウントを作成
# https://dash.cloudflare.com/sign-up

# 2. Wrangler CLIでログイン
npm install -g wrangler
wrangler login
```

### 2. 自動セットアップの実行（2分）

```bash
# プロジェクトルートで実行
npm run setup:cloudflare
```

このコマンドが自動で行うこと：
- ✅ D1データベース作成
- ✅ KVストレージ作成
- ✅ wrangler.toml更新
- ✅ スキーマ適用

### 3. Cloudflareダッシュボードでの設定（10分）

1. **Workers & Pages > 設定 > 変数とシークレット**
   
   以下の3つのシークレットを追加：
   ```
   OURA_CLIENT_ID = [Ouraから取得したClient ID]
   OURA_CLIENT_SECRET = [Ouraから取得したClient Secret]
   JWT_SECRET = [ランダムな文字列（例：openssl rand -base64 32）]
   ```

2. **API Tokens**を作成
   - https://dash.cloudflare.com/profile/api-tokens
   - 「Create Token」をクリック
   - 「Edit Cloudflare Workers」テンプレートを選択
   - 権限を確認して作成

### 4. GitHubリポジトリの設定（5分）

1. **Settings > Secrets and variables > Actions**
2. 「New repository secret」をクリック
3. 以下を追加：
   ```
   Name: CLOUDFLARE_API_TOKEN
   Secret: [上記で作成したトークン]
   ```

### 5. デプロイ実行（自動）

```bash
git add -A
git commit -m "Setup Cloudflare deployment"
git push origin main
```

プッシュ後、GitHub Actionsが自動的に：
- ✅ ビルド
- ✅ Workersへデプロイ
- ✅ Pagesへデプロイ

## 🎯 完了チェックリスト

- [ ] Cloudflareアカウント作成
- [ ] wrangler login実行
- [ ] npm run setup:cloudflare実行
- [ ] Cloudflareダッシュボードで3つのシークレット設定
- [ ] GitHubにCLOUDFLARE_API_TOKEN追加
- [ ] git pushでデプロイ

## 🌐 デプロイ後のURL

- **API**: `https://oura-game-api.{your-subdomain}.workers.dev`
- **Web**: `https://oura-game-web.pages.dev`

## ⏱️ 合計所要時間

約20分で完了します！

## 🆘 トラブルシューティング

### wrangler loginが失敗する場合
```bash
# 代替方法
wrangler login --browser
```

### D1作成エラーの場合
```bash
# 手動で作成
wrangler d1 create oura-game-db
# 出力されたIDをwrangler.tomlに手動で設定
```

### デプロイエラーの場合
GitHub Actionsのログを確認してください。