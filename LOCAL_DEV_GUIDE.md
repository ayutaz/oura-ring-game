# ローカル開発ガイド

## Docker環境での開発

### 前提条件
- Docker Desktop
- Git
- Oura Developer Account（Oura Ring連携時）

### クイックスタート

```bash
# 1. リポジトリをクローン
git clone https://github.com/ayutaz/oura-ring-game.git
cd oura-ring-game

# 2. Docker環境を起動
docker-compose up

# 3. ブラウザでアクセス
# http://localhost:3000
```

### アクセスURL

| サービス | URL | 説明 |
|---------|-----|------|
| Web | http://localhost:3000 | Remixアプリ |
| API | http://localhost:8787 | Hono API |
| pgAdmin | http://localhost:5050 | DB管理 |

### Oura Ring連携設定（オプション）

1. **.envファイル作成**
```bash
cp .env.example .env
```

2. **Oura認証情報を設定**
```env
OURA_CLIENT_ID=your_client_id
OURA_CLIENT_SECRET=your_client_secret
OURA_REDIRECT_URI=http://localhost:8787/auth/callback
JWT_SECRET=your_jwt_secret_key
```

3. **Docker環境を再起動**
```bash
docker-compose restart
```

### 日常的なコマンド

```bash
# 環境起動
docker-compose up

# バックグラウンドで起動
docker-compose up -d

# ログ確認
docker-compose logs -f

# 環境停止
docker-compose down

# 完全クリーンアップ
docker-compose down -v
```

### データベース管理

#### pgAdminでの接続
1. http://localhost:5050 へアクセス
2. ログイン: admin@example.com / admin
3. サーバー追加:
   - Host: `db`
   - Port: `5432`
   - Database: `oura_game`
   - Username: `oura_user`
   - Password: `oura_pass`

### トラブルシューティング

#### ポートが使用中の場合
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

#### コンテナの再構築
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### 開発のTips

- **ホットリロード**: ソースコードの変更は自動反映
- **デバッグ**: Chrome DevToolsを使用
- **APIテスト**: Thunder ClientやPostmanを使用