#!/bin/bash

echo "🚀 Cloudflare デプロイスクリプト"
echo "================================"

# 1. D1データベースの作成
echo "📊 D1データベースを作成中..."
wrangler d1 create oura-game-db

echo ""
echo "⚠️  上記のdatabase_idをwrangler.tomlに設定してください"
echo ""
read -p "設定が完了したらEnterキーを押してください..."

# 2. KVネームスペースの作成
echo "🗄️  KVネームスペースを作成中..."
wrangler kv:namespace create CACHE

echo ""
echo "⚠️  上記のidをwrangler.tomlに設定してください"
echo ""
read -p "設定が完了したらEnterキーを押してください..."

# 3. D1スキーマの適用
echo "🔨 D1スキーマを適用中..."
wrangler d1 execute oura-game-db --file=./apps/api/src/db/schema.d1.sql --env=production

# 4. シークレットの設定
echo "🔐 シークレットを設定中..."
echo "Oura Client IDを入力してください:"
wrangler secret put OURA_CLIENT_ID --env=production

echo "Oura Client Secretを入力してください:"
wrangler secret put OURA_CLIENT_SECRET --env=production

echo "JWT Secretを入力してください:"
wrangler secret put JWT_SECRET --env=production

# 5. APIのデプロイ
echo "🚀 APIをデプロイ中..."
cd apps/api
npm run build
wrangler deploy --env=production
cd ../..

# 6. Remixアプリのデプロイ
echo "🎨 Remixアプリをデプロイ中..."
cd apps/web
npm run build
wrangler pages deploy ./build/client --project-name=oura-game-web
cd ../..

echo ""
echo "✅ デプロイ完了！"
echo ""
echo "📌 次のステップ:"
echo "1. https://dash.cloudflare.com でデプロイを確認"
echo "2. カスタムドメインを設定（オプション）"
echo "3. 環境変数を確認"