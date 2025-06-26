# Oura Quest - 技術アーキテクチャ

## システム構成

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Remix App     │────▶│   Hono API       │────▶│  Oura Ring API  │
│  (Cloudflare    │     │ (Workers/D1)     │     │     (v2)        │
│    Pages)       │     │                  │     └─────────────────┘
└─────────────────┘     └──────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│   Cloudflare    │     │   Cloudflare D1  │
│      R2         │     │   (Database)     │
│   (Assets)      │     │                  │
└─────────────────┘     └──────────────────┘
```

## ディレクトリ構造

```
oura-game/
├── apps/
│   ├── web/                    # Remix フロントエンド
│   │   ├── app/
│   │   │   ├── routes/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   └── public/
│   └── api/                    # Hono バックエンド
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── middleware/
│       │   └── utils/
│       └── wrangler.toml
├── packages/
│   ├── game-engine/           # ゲームロジック
│   ├── oura-client/           # Oura API クライアント
│   └── ui-components/         # 共通UIコンポーネント
├── database/
│   └── schema.sql
└── package.json
```

## Oura API統合

### 認証フロー
```typescript
// Oura OAuth2 フロー
1. ユーザーをOura認証ページへリダイレクト
2. 認証コールバックでアクセストークン取得
3. Cloudflare D1にトークンを暗号化して保存
4. 定期的にトークンをリフレッシュ
```

### データ同期戦略
```typescript
// Cloudflare Cron Triggersで定期実行
export default {
  async scheduled(event, env, ctx) {
    // 毎朝6時: 睡眠データ取得
    // 正午: 活動データ更新
    // 夕方6時: 総合データ集計
  }
}
```

## ゲームエンジン設計

### ステート管理
```typescript
interface GameState {
  character: {
    id: string;
    name: string;
    level: number;
    stats: CharacterStats;
    equipment: Equipment[];
  };
  adventure: {
    currentArea: Area;
    progress: number;
    encounters: Encounter[];
  };
  healthData: {
    lastSync: Date;
    dailyMetrics: DailyMetrics;
  };
}
```

### キャラクター成長アルゴリズム
```typescript
// services/character-growth.ts
export function calculateStats(healthData: OuraData): CharacterStats {
  return {
    hp: BASE_HP + (healthData.activity.score * 10),
    mp: BASE_MP + (healthData.sleep.score * 8),
    attack: BASE_ATK + Math.floor(healthData.activity.steps / 100),
    defense: BASE_DEF + (healthData.readiness.hrv_balance * 5),
    speed: BASE_SPD + (healthData.readiness.score * 0.5),
    luck: calculateLuck(healthData.readiness.temperature_deviation)
  };
}
```

## データベース設計 (Cloudflare D1)

```sql
-- ユーザー
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  oura_user_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Oura認証情報
CREATE TABLE oura_tokens (
  user_id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- キャラクター
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 健康データキャッシュ
CREATE TABLE health_data_cache (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  data_type TEXT NOT NULL,
  date DATE NOT NULL,
  data JSON NOT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, data_type, date)
);

-- 冒険ログ
CREATE TABLE adventure_logs (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  event_type TEXT NOT NULL,
  details JSON NOT NULL,
  rewards JSON,
  FOREIGN KEY (character_id) REFERENCES characters(id)
);
```

## セキュリティ考慮事項

1. **トークン管理**
   - Cloudflare Workers KVで暗号化保存
   - 自動リフレッシュ機能
   - スコープは必要最小限に

2. **データプライバシー**
   - 健康データは最小限のキャッシュ
   - ユーザー削除時の完全消去
   - GDPR/個人情報保護法準拠

3. **API レート制限**
   - Cloudflare Rate Limitingを使用
   - Oura APIのレート制限に準拠
   - キャッシュ戦略で最適化

## パフォーマンス最適化

1. **エッジコンピューティング**
   - Cloudflare Workersで低レイテンシ
   - 地域別キャッシュ戦略

2. **アセット配信**
   - Cloudflare R2でゲームアセット管理
   - WebP/AVIF形式での画像配信

3. **リアルタイム更新**
   - Server-Sent Eventsで冒険進行配信
   - Durable Objectsでゲーム状態管理