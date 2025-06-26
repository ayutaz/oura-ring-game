# Oura Quest ローカル開発環境ガイド

## 🐳 Docker環境での開発

本プロトタイプは、Docker環境で完結するローカル開発を前提としています。
Cloudflare WorkersやD1の代わりに、Node.js + PostgreSQLで代替実装します。

## 📋 前提条件

- Docker Desktop (Docker & Docker Compose)
- Git
- お好みのエディタ (VS Code推奨)
- Oura Developer Account（後述の手順で作成）

## 🚀 クイックスタート

### 1. リポジトリのクローン
```bash
git clone [repository-url]
cd oura-game
```

### 2. 環境変数の設定
```bash
cp .env.example .env
```

`.env`ファイルを編集し、以下を設定：
- `OURA_CLIENT_ID`: Oura開発者ポータルで取得
- `OURA_CLIENT_SECRET`: Oura開発者ポータルで取得
- その他のシークレットキーは適当な文字列でOK

### 3. 初期セットアップ
```bash
make setup
```

### 4. 開発環境の起動
```bash
make start
```

### 5. アクセス確認
- Web: http://localhost:3000
- API: http://localhost:8787
- pgAdmin: http://localhost:5050
  - Email: admin@example.com
  - Password: admin

## 🏗️ アーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Remix App     │────▶│   Hono API      │────▶│  PostgreSQL     │
│   (Port 3000)   │     │   (Port 8787)   │     │   (Port 5432)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                                │
         │                                                │
         └────────────────────────────────────────────────┘
                        Oura API (External)
```

### コンテナ構成
- **web**: Remix アプリケーション
- **api**: Hono APIサーバー
- **db**: PostgreSQL (Cloudflare D1の代替)
- **pgadmin**: データベース管理UI

## 📁 ディレクトリ構造

```
oura-game/
├── apps/
│   ├── web/              # Remix フロントエンド
│   │   ├── app/
│   │   ├── public/
│   │   └── package.json
│   └── api/              # Hono バックエンド
│       ├── src/
│       └── package.json
├── database/
│   └── init.sql          # 初期スキーマ
├── docker-compose.yml
├── Dockerfile.web
├── Dockerfile.api
├── Makefile
└── .env
```

## 🔧 開発コマンド

### 基本操作
```bash
# 環境起動
make start

# 環境停止
make stop

# ログ確認
make logs
make logs-web  # Webのみ
make logs-api   # APIのみ

# テスト実行
make test
```

### データベース操作
```bash
# DBコンソール接続
make db-console

# テストデータ投入
make db-seed

# マイグレーション再実行
make db-migrate
```

### トラブルシューティング
```bash
# 環境のクリーンアップ
make clean

# コンテナに入って調査
make web-shell
make api-shell
```

## 🔐 Oura API設定

### 1. Oura Developer Account作成
1. https://cloud.ouraring.com にアクセス
2. 開発者アカウントを作成
3. 新しいアプリケーションを登録

### 2. アプリケーション設定
- **Application Name**: Oura Quest Dev
- **Redirect URI**: `http://localhost:3000/auth/callback`
- **Scopes**: 
  - personal
  - daily
  - heartrate
  - workout
  - tag
  - session

### 3. 認証情報の取得
- Client ID と Client Secret を`.env`にコピー

## 🧪 ローカルでのテスト方法

### 1. Oura連携なしでテスト
```bash
# テストデータを投入
make db-seed

# ブラウザでアクセス
# http://localhost:3000
```

### 2. モックデータでテスト
APIに`/mock`エンドポイントを用意し、実際のOuraデータ形式でテスト可能

### 3. 実際のOuraデータでテスト
1. Oura Ringを装着
2. アプリで認証
3. 実データで動作確認

## 📝 開発フロー

### 機能追加の流れ
1. **ブランチ作成**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **コード編集**
   - ホットリロードが有効なので、保存すると自動反映

3. **テスト**
   ```bash
   make test
   ```

4. **コミット & プッシュ**
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

## 🐛 よくある問題と解決方法

### ポートが使用中
```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :8787
lsof -i :5432

# プロセスを終了してから再起動
make restart
```

### データベース接続エラー
```bash
# DBコンテナのログを確認
docker-compose logs db

# DBを再起動
docker-compose restart db
```

### node_modulesの問題
```bash
# コンテナ内で再インストール
docker-compose exec web npm install
docker-compose exec api npm install
```

## 🚀 プロダクション移行時の注意

このローカル環境は開発用です。本番環境では：

1. **PostgreSQL → Cloudflare D1**
   - SQL構文の違いに注意
   - トランザクション処理の調整

2. **Node.js → Cloudflare Workers**
   - Workers制限事項の確認
   - KV/Durable Objectsの活用

3. **環境変数管理**
   - Cloudflare Secretsへの移行
   - APIキーの安全な管理

## 📚 参考リンク

- [Remix Documentation](https://remix.run/docs)
- [Hono Documentation](https://hono.dev)
- [Oura API Documentation](https://cloud.ouraring.com/docs)
- [Docker Documentation](https://docs.docker.com)

---

Happy Coding! 🎮✨