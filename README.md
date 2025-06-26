# 🏃‍♂️ Oura Quest ⚔️

Oura Ringの健康データを使って冒険するRPGゲーム

## 概要

睡眠、活動量、準備度などの健康データがキャラクターの成長に直結。毎日の健康習慣が冒険の成果につながります。

## 機能

- 💤 睡眠スコア → MP回復
- 🚶 歩数 → 攻撃力アップ  
- ✨ 準備度 → クリティカル率
- 🎮 デモモード（Oura Ring不要）

## セットアップ

### ローカル開発（Docker）

```bash
# リポジトリをクローン
git clone https://github.com/ayutaz/oura-ring-game.git
cd oura-ring-game

# Docker環境を起動
docker-compose up
```

アクセス:
- Web: http://localhost:3000
- API: http://localhost:8787
- pgAdmin: http://localhost:5050

### 本番環境（Cloudflare）

[デプロイガイド](./DEPLOY.md)を参照

## プレイ方法

### 1. デモモード
Oura Ringがなくても体験可能。サンプルデータで冒険を楽しめます。

### 2. Oura Ring連携モード
1. Oura開発者アカウントを作成
2. アプリケーションを登録してClient ID/Secretを取得
3. `.env`ファイルに設定
4. Oura Ringと連携してプレイ

## 技術スタック

- Frontend: Remix (React)
- Backend: Hono
- Database: PostgreSQL (開発) / D1 (本番)
- Platform: Docker (開発) / Cloudflare Workers (本番)
- Testing: Vitest (TDD)

## ドキュメント

- [デプロイガイド](./DEPLOY.md) - 本番環境へのデプロイ方法
- [ゲーム設計書](./GAME_DESIGN.md) - ゲームシステムの詳細
- [開発ガイド](./LOCAL_DEV_GUIDE.md) - ローカル開発環境の構築

## 開発

```bash
# テスト実行
npm test

# ビルド
npm run build

# 型チェック
npm run typecheck
```

## ライセンス

MIT