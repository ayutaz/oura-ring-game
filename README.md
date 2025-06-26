# 🎮 Oura Quest - 健康データ連動型RPG

Oura Ringの健康データを活用した自動冒険型RPGゲームのプロトタイプです。
睡眠・活動・心拍データがゲーム内のキャラクター成長に直結し、健康的な生活習慣を楽しいゲーム体験に変換します。

## 🌟 特徴

- 💤 **睡眠スコア** → MP回復・魔力強化
- 🚶 **歩数** → 攻撃力・経験値獲得
- 💓 **心拍数** → 防御力・クリティカル率
- 🎯 **自動冒険** → 毎日の健康データで冒険結果が変化

## 🚀 クイックスタート

### 前提条件
- Docker Desktop
- Oura Ring & Developer Account

### セットアップ
```bash
# 1. リポジトリをクローン
git clone [repository-url]
cd oura-game

# 2. 環境変数を設定
cp .env.example .env
# .envファイルを編集してOuraの認証情報を設定

# 3. Docker環境をセットアップ
make setup

# 4. 開発環境を起動
make start
```

### アクセス
- 🌐 Web: http://localhost:3000
- 🔧 API: http://localhost:8787
- 💾 pgAdmin: http://localhost:5050

## 📚 ドキュメント

- [ローカル開発ガイド](./LOCAL_DEV_GUIDE.md) - Docker環境での開発方法
- [ゲーム設計書](./GAME_DESIGN.md) - ゲームコンセプトとシステム
- [技術アーキテクチャ](./TECHNICAL_ARCHITECTURE.md) - システム構成
- [プロトタイプ企画書](./PROTOTYPE_PROPOSAL.md) - MVP仕様

## 🛠️ 技術スタック

- **Frontend**: Remix (React)
- **Backend**: Hono
- **Database**: PostgreSQL (開発) / Cloudflare D1 (本番)
- **Infrastructure**: Docker (開発) / Cloudflare Workers (本番)
- **API**: Oura Ring API v2

## 📋 開発コマンド

```bash
make help     # 利用可能なコマンド一覧
make start    # 環境起動
make stop     # 環境停止
make logs     # ログ確認
make test     # テスト実行
```

## 🧪 テスト

TDD (Test-Driven Development) で開発されています：

```bash
npm test              # 全テスト実行
npm run test:coverage # カバレッジレポート
```

## 🤝 コントリビューション

プルリクエストを歓迎します！

## 📄 ライセンス

MIT

---

**健康的な生活を、楽しい冒険に変えよう！** 🏃‍♂️✨