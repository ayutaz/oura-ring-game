# Oura Quest - 認証方式の選択肢

## 現在の課題
- Oura APIのOAuth2認証にはCLIENT_SECRETが必要
- CLIENT_SECRETはブラウザに露出できない（セキュリティリスク）
- そのため、バックエンドサーバーが必要

## 選択肢

### 1. 🌐 Netlify/Vercel Functions（推奨）
**メリット:**
- 無料枠で十分
- デプロイが簡単
- CLIENT_SECRETを環境変数で安全に管理

**実装方法:**
```javascript
// netlify/functions/auth-callback.js
exports.handler = async (event) => {
  const { code } = event.queryStringParameters;
  
  // ここでOura APIにトークンリクエスト
  // CLIENT_SECRETは環境変数から取得
  
  return {
    statusCode: 200,
    body: JSON.stringify({ token })
  };
};
```

### 2. 🔑 Personal Access Token方式
**メリット:**
- サーバー不要
- 実装が最もシンプル

**デメリット:**
- 各ユーザーが自分でトークンを生成する必要がある
- UXが悪い

**実装方法:**
1. ユーザーがOura Developerポータルで個人トークンを生成
2. アプリにトークンを入力
3. localStorageに保存

### 3. 🖥️ デスクトップアプリ化（Electron/Tauri）
**メリット:**
- CLIENT_SECRETをアプリ内に安全に保存可能
- 完全にローカルで動作

**デメリット:**
- Webブラウザでは動作しない
- 配布が必要

### 4. 🎮 デモモード + 手動設定
**メリット:**
- 即座に体験可能
- 認証不要でゲームプレイ

**実装方法:**
```javascript
// デモモード
const demoData = {
  sleep: { score: 85 },
  activity: { steps: 10000 },
  readiness: { score: 78 }
};

// または手動入力
<input placeholder="睡眠スコアを入力" />
<input placeholder="歩数を入力" />
```

## 推奨される実装

### 🚀 段階的アプローチ

1. **Phase 1: デモモード**（今すぐ実装可能）
   - モックデータでゲーム体験
   - 認証なしで動作確認

2. **Phase 2: 手動入力モード**（簡単）
   - ユーザーがOuraアプリから数値を手動入力
   - 認証不要

3. **Phase 3: Personal Token**（中間）
   - 上級ユーザー向け
   - 自動データ同期

4. **Phase 4: フル認証**（将来）
   - Netlify/Vercelにデプロイ時に実装

## 実装例：ハイブリッドアプローチ

```javascript
// 認証方式を選択
function AuthSelection() {
  return (
    <div>
      <h2>データ連携方法を選択</h2>
      
      <button onClick={startOAuth}>
        🔗 Oura Ringと自動連携（要サーバー）
      </button>
      
      <button onClick={usePersonalToken}>
        🔑 Personal Tokenを使用
      </button>
      
      <button onClick={manualInput}>
        ✏️ 手動でデータ入力
      </button>
      
      <button onClick={demoMode}>
        🎮 デモモードで体験
      </button>
    </div>
  );
}
```

## まとめ

完全にブラウザだけでOAuth認証を行うことは、Oura APIの仕様上不可能です。しかし、以下の方法で対応できます：

1. **今すぐ遊べるようにする** → デモモード/手動入力
2. **簡単な自動連携** → Personal Token方式
3. **本格的な連携** → サーバーレス関数（Netlify/Vercel）

どの方式を採用されますか？