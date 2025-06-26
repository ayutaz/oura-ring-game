# デプロイガイド

## 環境構成

1. **開発環境**: Docker Compose（ローカル）
2. **本番環境**: Cloudflare Workers + D1
3. **デモ版**: GitHub Pages（静的版）

## Cloudflareへのデプロイ

### 1. 事前準備

```bash
# Wrangler CLIをインストール
npm install -g wrangler

# Cloudflareにログイン
wrangler login
```

### 2. プロジェクトセットアップ

```bash
# D1データベースを作成
wrangler d1 create oura-game-db

# KVネームスペースを作成
wrangler kv:namespace create CACHE

# 作成されたIDをwrangler.tomlに設定
```

### 3. 環境変数の設定

```bash
# シークレットを設定
wrangler secret put OURA_CLIENT_ID
wrangler secret put OURA_CLIENT_SECRET
wrangler secret put JWT_SECRET
```

### 4. デプロイ実行

```bash
# APIをデプロイ
cd apps/api
npm run build
wrangler deploy --env production

# Webアプリをデプロイ（Cloudflare Pages）
cd ../web
npm run build
wrangler pages deploy ./build
```

## GitHub Actions CI/CD

mainブランチへのプッシュで自動的に：
- テストが実行されます
- GitHub Pagesへデモ版がデプロイされます

```bash
git push origin main
```

## ローカル開発

```bash
# クイックスタート
docker-compose up

# アクセス
# Web: http://localhost:3000
# API: http://localhost:8787
# pgAdmin: http://localhost:5050
```