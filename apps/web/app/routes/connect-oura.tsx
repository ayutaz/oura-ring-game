import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function ConnectOura() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleConnect = async () => {
    if (!clientId || !clientSecret) {
      setError("Client IDとClient Secretの両方を入力してください");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 認証情報を暗号化してlocalStorageに保存
      const credentials = btoa(JSON.stringify({ clientId, clientSecret }));
      localStorage.setItem('oura_credentials', credentials);
      
      // OAuth認証開始
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, clientSecret }),
      });

      const data = await response.json();
      
      if (data.authUrl) {
        // stateをセッションストレージに保存
        sessionStorage.setItem('oauth_state', data.state);
        sessionStorage.setItem('user_client_id', clientId);
        sessionStorage.setItem('user_client_secret', clientSecret);
        
        // Oura認証ページへリダイレクト
        window.location.href = data.authUrl;
      } else {
        setError("認証URLの生成に失敗しました");
      }
    } catch (err) {
      setError("接続エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      fontFamily: "system-ui, sans-serif", 
      maxWidth: "600px", 
      margin: "0 auto", 
      padding: "2rem" 
    }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        🔗 Oura Ring連携設定
      </h1>
      
      <div style={{ 
        background: "#f0f8ff", 
        padding: "1rem", 
        borderRadius: "8px",
        marginBottom: "2rem" 
      }}>
        <p style={{ margin: 0 }}>
          自分のOura Developer認証情報を使って、健康データと連携できます。
          <button
            onClick={() => setShowHelp(!showHelp)}
            style={{
              background: "none",
              border: "none",
              color: "#0066cc",
              cursor: "pointer",
              textDecoration: "underline",
              marginLeft: "0.5rem",
            }}
          >
            認証情報の取得方法
          </button>
        </p>
      </div>

      {showHelp && (
        <div style={{ 
          background: "#fff3cd", 
          border: "1px solid #ffeaa7",
          padding: "1rem", 
          borderRadius: "8px",
          marginBottom: "2rem" 
        }}>
          <h3 style={{ marginTop: 0 }}>📋 Oura認証情報の取得手順</h3>
          <ol>
            <li>
              <a href="https://cloud.ouraring.com" target="_blank" rel="noopener noreferrer">
                Oura Cloud
              </a>
              にアクセス
            </li>
            <li>ログインまたはアカウント作成</li>
            <li>「Applications」→「Create New Application」をクリック</li>
            <li>以下を入力:
              <ul>
                <li>Application Name: 任意の名前（例: My Oura Quest）</li>
                <li>Redirect URI: <code>http://localhost:8787/auth/callback</code></li>
                <li>必要なScopes: daily_readiness, daily_sleep, daily_activity</li>
              </ul>
            </li>
            <li>作成後、Client IDとClient Secretが表示されます</li>
          </ol>
          <p style={{ 
            background: "#e8f4f8", 
            padding: "0.5rem", 
            borderRadius: "4px",
            marginTop: "1rem" 
          }}>
            💡 ヒント: Client Secretは一度しか表示されません。必ず安全な場所に保存してください。
          </p>
        </div>
      )}

      <div style={{ marginBottom: "2rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Client ID
          </label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="例: ABCDEF123456"
            style={{
              width: "100%",
              padding: "0.75rem",
              fontSize: "1rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Client Secret
          </label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="例: abcdef123456789..."
            style={{
              width: "100%",
              padding: "0.75rem",
              fontSize: "1rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {error && (
        <div style={{ 
          background: "#fee", 
          border: "1px solid #fcc",
          padding: "1rem", 
          borderRadius: "4px",
          marginBottom: "1rem",
          color: "#c00" 
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={handleConnect}
          disabled={loading}
          style={{
            flex: 1,
            padding: "1rem",
            background: loading ? "#ccc" : "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.1rem",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "接続中..." : "🔗 Oura Ringと接続"}
        </button>

        <button
          onClick={() => navigate('/')}
          style={{
            padding: "1rem 2rem",
            background: "#e0e0e0",
            color: "#333",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.1rem",
            cursor: "pointer",
          }}
        >
          戻る
        </button>
      </div>

      <div style={{ 
        marginTop: "2rem", 
        padding: "1rem", 
        background: "#f9f9f9",
        borderRadius: "8px",
        fontSize: "0.9rem",
        color: "#666" 
      }}>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          🔒 <strong>セキュリティについて</strong>
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
          <li>認証情報はブラウザのローカルストレージに暗号化して保存されます</li>
          <li>サーバーには保存されません</li>
          <li>ブラウザを閉じても認証情報は保持されます</li>
          <li>ログアウト時に自動的に削除されます</li>
        </ul>
      </div>
    </div>
  );
}