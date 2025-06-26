# Oura Quest プロトタイプ機能仕様書

## 🎯 プロトタイプで実装する最小機能セット

### 1. 認証・データ連携

#### 1.1 Oura OAuth認証
```typescript
// 認証フロー
1. /auth/login → Oura認証ページへリダイレクト
2. Oura側で許可 → /auth/callback
3. アクセストークン取得・保存
4. ユーザー作成・ログイン完了
```

#### 1.2 データ同期
```typescript
// 同期するデータ（最小限）
interface SyncData {
  sleep: {
    date: string
    score: number
    total_sleep_duration: number
  }
  activity: {
    date: string
    score: number
    steps: number
    active_calories: number
  }
  readiness: {
    date: string
    score: number
  }
}

// 同期タイミング
- 初回ログイン: 過去7日分
- 日次: 朝6時に前日分
- 手動: プルダウンでリフレッシュ
```

### 2. キャラクターシステム（シンプル版）

#### 2.1 基本ステータス
```typescript
interface CharacterState {
  // 基本情報
  name: string
  level: number
  experience: number
  
  // ステータス（表示のみ）
  hp: number      // 100 + (activity.score * 2)
  mp: number      // 50 + (sleep.score * 1.5)
  attack: number  // 10 + (steps / 1000)
  defense: number // 10 + (readiness.score * 0.3)
}
```

#### 2.2 ビジュアル
```
16x16 ピクセルアートキャラクター
- 立ち絵1種類
- 歩行アニメーション2フレーム
- レベルアップエフェクト
```

### 3. 自動冒険システム（テキストベース）

#### 3.1 冒険生成ロジック
```typescript
// 1日1回、朝6時に生成
function generateDailyAdventure(data: SyncData): Adventure {
  const quality = (data.sleep.score + data.activity.score + data.readiness.score) / 3
  
  return {
    story: selectStory(quality), // 品質に応じたストーリー選択
    experience: Math.floor(100 * (quality / 100)),
    gold: Math.floor(50 * (quality / 100)),
    summary: `睡眠${data.sleep.score}点の力で冒険を完了！`
  }
}

// ストーリーパターン（5種類）
const storyPatterns = [
  "深い眠りの森で魔力の泉を発見した",
  "元気な歩みで山賊を撃退した", 
  "準備万端で隠しダンジョンを攻略した",
  "疲労により冒険は平凡な結果に終わった",
  "絶好調！伝説のドラゴンに遭遇した"
]
```

#### 3.2 結果表示
```
┌─────────────────────────────┐
│ 📅 12月5日の冒険結果        │
├─────────────────────────────┤
│ 深い眠りの森で魔力の泉を    │
│ 発見した！                  │
│                             │
│ 獲得:                       │
│ ⭐ 経験値 +85              │
│ 💰 ゴールド +42            │
│                             │
│ 💤 睡眠: 85点              │
│ 🚶 歩数: 8,543歩           │
│ ✨ 準備度: 78点            │
└─────────────────────────────┘
```

### 4. UIコンポーネント

#### 4.1 ヘルスバー表示
```tsx
// シンプルなプログレスバー
<HealthBar 
  label="睡眠"
  value={85}
  max={100}
  color="blue"
  icon="💤"
/>
```

#### 4.2 キャラクター表示
```tsx
// Canvas使用のシンプルな描画
<CharacterCanvas
  sprite="/sprites/hero.png"
  animation="idle" // idle | walk
  level={character.level}
/>
```

#### 4.3 通知
```tsx
// ブラウザ通知API使用
function showNotification(title: string, body: string) {
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/icon.png" })
  }
}
```

### 5. データ永続化

#### 5.1 Cloudflare D1スキーマ（最小限）
```sql
-- ユーザー
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  oura_user_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- キャラクター
CREATE TABLE characters (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  total_gold INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 日次データキャッシュ
CREATE TABLE daily_data (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  sleep_score INTEGER,
  activity_score INTEGER,
  readiness_score INTEGER,
  steps INTEGER,
  adventure_log TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, date)
);
```

### 6. 画面遷移

```
1. / (未ログイン)
   → ランディングページ
   → 「Ouraと連携」ボタン

2. /auth/login
   → Oura OAuth画面へリダイレクト

3. /auth/callback
   → トークン保存
   → /game へリダイレクト

4. /game (要ログイン)
   → メインゲーム画面
   → データ自動同期
   → キャラクター表示

5. /game/history
   → 過去の冒険履歴
   → 簡易的なカレンダー表示
```

## 🚫 プロトタイプで実装しないもの

1. **複雑なゲームメカニクス**
   - バトルシステム
   - アイテム・装備
   - スキルツリー
   - クエストシステム

2. **ソーシャル機能**
   - フレンド機能
   - ランキング
   - ギルド
   - チャット

3. **高度なビジュアル**
   - 複雑なアニメーション
   - パーティクルエフェクト
   - 音楽・効果音
   - カットシーン

4. **収益化機能**
   - 課金システム
   - 広告
   - プレミアムプラン

## 📊 パフォーマンス目標

- 初回ロード: 3秒以内
- データ同期: 5秒以内
- ページ遷移: 1秒以内
- Lighthouse Score: 80以上

## 🧪 テスト計画

### 機能テスト
- [ ] Oura認証フロー完走
- [ ] データ同期成功
- [ ] キャラクターレベルアップ
- [ ] 冒険ログ生成
- [ ] 7日間連続利用

### ユーザビリティテスト
- [ ] 5分以内に初回セットアップ完了
- [ ] 毎日の利用が2分以内
- [ ] 直感的なUI操作

## 🎨 デザインシステム

### カラーパレット
```css
:root {
  --primary: #6366f1;    /* Indigo - Oura風 */
  --success: #10b981;    /* Green - 良好な健康状態 */
  --warning: #f59e0b;    /* Amber - 注意 */
  --danger: #ef4444;     /* Red - 不調 */
  --bg-dark: #1f2937;    /* Gray 800 */
  --bg-light: #f3f4f6;   /* Gray 100 */
}
```

### フォント
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", 
             "Hiragino Sans", "Noto Sans CJK JP", sans-serif;
```

### コンポーネントスタイル
- 角丸: 8px
- 影: 軽めのドロップシャドウ
- アニメーション: ease-out 200ms

## まとめ

このプロトタイプは、**最小限の機能で最大限の体験価値を検証**することを目的としています。
複雑な機能は後回しにし、「健康データがゲームに反映される楽しさ」という核心的な価値に集中します。

2週間で動くものを作り、実際のユーザーフィードバックを得ることを最優先とします。