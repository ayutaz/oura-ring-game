# デプロイガイド

## 環境構成

1. **開発環境**: Docker Compose（ローカル）
2. **本番環境**: Cloudflare Workers + D1
3. **デモ版**: GitHub Pages（静的版）

## Cloudflareへのデプロイ

### 1. Cloudflareアカウントの準備

```bash
# Wrangler CLIをインストール
npm install -g wrangler

# Cloudflareにログイン
wrangler login
```

### 2. D1データベースの作成

```bash
# データベースを作成
wrangler d1 create oura-game-db

# 作成されたdatabase_idをwrangler.tomlに設定
```

### 3. KVネームスペースの作成

```bash
# KVネームスペースを作成（キャッシュ用）
wrangler kv:namespace create CACHE

# 作成されたidをwrangler.tomlに設定
```

### 4. 環境変数の設定

```bash
# Oura認証情報を設定
wrangler secret put OURA_CLIENT_ID
wrangler secret put OURA_CLIENT_SECRET
wrangler secret put JWT_SECRET
```

### 5. デプロイ

```bash
# APIをデプロイ
cd apps/api
wrangler deploy --env production

# Webアプリをデプロイ（Cloudflare Pages）
cd apps/web
npm run build
wrangler pages deploy ./build
```

## GitHub Pagesへのデモ版デプロイ

1. GitHubリポジトリの設定でPagesを有効化
2. ソース: GitHub Actions
3. プッシュ時に自動デプロイ

```bash
# mainブランチにプッシュすると自動デプロイ
git push origin main
```

## ローカル開発

```bash
# Docker環境を起動
docker-compose up

# アクセス
# Web: http://localhost:3000
# API: http://localhost:8787
```