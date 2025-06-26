# Oura Quest セットアップガイド

## 前提条件
- Node.js 18以上
- Cloudflare アカウント
- Oura Ring & Oura Developer アカウント
- pnpm (推奨) または npm

## Oura API セットアップ

### 1. Oura Developer アカウント作成
1. [Oura Cloud](https://cloud.ouraring.com) にアクセス
2. Developer アカウントを作成
3. 新しいアプリケーションを登録
   - Redirect URI: `https://your-domain.pages.dev/auth/callback`
   - Scopes: 
     - daily_readiness
     - daily_sleep
     - daily_activity
     - heartrate
     - workout
     - personal_info

### 2. 環境変数設定
```env
# .env.local
OURA_CLIENT_ID=your_client_id
OURA_CLIENT_SECRET=your_client_secret
OURA_REDIRECT_URI=https://your-domain.pages.dev/auth/callback
```

## プロジェクトセットアップ

### 1. モノレポ初期化
```bash
# プロジェクトルートで
pnpm init

# workspace設定
echo "packages:" > pnpm-workspace.yaml
echo "  - 'apps/*'" >> pnpm-workspace.yaml
echo "  - 'packages/*'" >> pnpm-workspace.yaml
```

### 2. Remix アプリケーション作成
```bash
# Remixアプリ作成
mkdir -p apps/web
cd apps/web
npx create-remix@latest . --template remix-run/remix/templates/cloudflare-pages
cd ../..
```

### 3. Hono API作成
```bash
# Hono API作成
mkdir -p apps/api
cd apps/api
npm init -y
pnpm add hono @cloudflare/workers-types
cd ../..
```

### 4. 共通パッケージ作成
```bash
# ゲームエンジン
mkdir -p packages/game-engine
cd packages/game-engine
npm init -y
cd ../..

# Ouraクライアント
mkdir -p packages/oura-client
cd packages/oura-client
npm init -y
cd ../..

# UIコンポーネント
mkdir -p packages/ui-components
cd packages/ui-components
npm init -y
cd ../..
```

## Cloudflare 設定

### 1. Wrangler 設定 (apps/api/wrangler.toml)
```toml
name = "oura-quest-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
vars = { ENVIRONMENT = "production" }

[[d1_databases]]
binding = "DB"
database_name = "oura-quest"
database_id = "your-database-id"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "oura-quest-assets"

[triggers]
crons = ["0 6 * * *", "0 12 * * *", "0 18 * * *"]
```

### 2. D1 データベース作成
```bash
# D1データベース作成
wrangler d1 create oura-quest

# スキーマ適用
wrangler d1 execute oura-quest --file=./database/schema.sql
```

## 開発開始

### 1. 依存関係インストール
```bash
pnpm install
```

### 2. 開発サーバー起動
```bash
# ターミナル1: Remix
cd apps/web && pnpm dev

# ターミナル2: Hono API
cd apps/api && pnpm dev
```

## 実装の優先順位

### Phase 1: 基本機能 (1-2週間)
1. ✅ Oura OAuth認証フロー実装
2. ⬜ 基本的なデータ取得・表示
3. ⬜ ユーザー登録・ログイン機能
4. ⬜ 基本的なキャラクター表示

### Phase 2: ゲームコア (2-3週間)
1. ⬜ キャラクター成長ロジック実装
2. ⬜ 自動冒険システム
3. ⬜ 基本的な戦闘システム
4. ⬜ アイテム・報酬システム

### Phase 3: UI/UX改善 (1-2週間)
1. ⬜ かわいいピクセルアート追加
2. ⬜ アニメーション実装
3. ⬜ レスポンシブデザイン
4. ⬜ ゲーム内通知システム

### Phase 4: 高度な機能 (2-3週間)
1. ⬜ ソーシャル機能（ランキング等）
2. ⬜ 詳細な統計・分析画面
3. ⬜ カスタマイズ機能
4. ⬜ 実績システム

## トラブルシューティング

### Oura API接続エラー
- アクセストークンの有効期限を確認
- API レート制限に達していないか確認
- 必要なスコープが付与されているか確認

### Cloudflare デプロイエラー
- wrangler.tomlの設定を確認
- 環境変数が正しく設定されているか確認
- ビルドサイズが制限内か確認

## 参考リンク
- [Oura API Documentation](https://cloud.ouraring.com/v2/docs)
- [Remix Documentation](https://remix.run/docs)
- [Hono Documentation](https://hono.dev)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)