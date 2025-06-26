# Oura OAuth認証セットアップガイド

## 1. Oura Developer Accountの作成

1. https://cloud.ouraring.com にアクセス
2. 「Sign Up」からDeveloper Accountを作成
3. ログイン後、「Applications」セクションへ

## 2. 新しいアプリケーションの作成

1. 「Create New App」をクリック
2. 以下の情報を入力：
   - **Application Name**: Oura Quest Dev
   - **Description**: 健康データ連動型RPGゲーム
   - **Redirect URIs**: `http://localhost:3000/auth/callback`
   - **Application Type**: Web Application

3. 必要なスコープを選択：
   - ✅ personal
   - ✅ daily
   - ✅ heartrate
   - ✅ workout
   - ✅ tag
   - ✅ session

## 3. Client IDとClient Secretの取得

作成後、以下の情報が表示されます：
- **Client ID**: `ABC123...` (例)
- **Client Secret**: `XYZ789...` (例)

## 4. .envファイルの設定

```bash
# .envファイルに以下を設定
OURA_CLIENT_ID=取得したClient ID
OURA_CLIENT_SECRET=取得したClient Secret
```

## 5. 動作確認

1. Dockerを再起動
   ```bash
   make restart
   ```

2. http://localhost:3000 にアクセス

3. 「Oura Ringと連携して始める」をクリック

4. Ouraの認証画面が表示されることを確認

## よくある問題

### "Invalid redirect_uri" エラー
- Oura Developerポータルで設定したRedirect URIが`http://localhost:3000/auth/callback`と完全に一致していることを確認

### "Invalid client" エラー
- Client IDとClient Secretが正しくコピーされているか確認
- .envファイルが正しく読み込まれているか確認

### 認証後のエラー
- ブラウザのコンソールでエラーメッセージを確認
- APIサーバーのログを確認: `make logs-api`