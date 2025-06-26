import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Oura Quest" },
    { name: "description", content: "健康データで冒険するRPG" },
  ];
};

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>
          🏃‍♂️ Oura Quest ⚔️
        </h1>
        <p style={{ fontSize: "1.5rem", marginBottom: "2rem", color: "#666" }}>
          あなたの健康が冒険になる
        </p>
        
        <div style={{ 
          background: "#f0f0f0", 
          padding: "2rem", 
          borderRadius: "8px",
          marginBottom: "2rem" 
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚔️ 🛡️</div>
          <div style={{ fontSize: "1.2rem" }}>
            💤 睡眠 → 冒険 → 成長 💪
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", marginBottom: "2rem" }}>
          <button 
            onClick={() => window.location.href = '/demo'}
            style={{
              background: "#10b981",
              color: "white",
              padding: "1rem 3rem",
              fontSize: "1.2rem",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              width: "280px",
            }}>
            🎮 デモプレイで体験
          </button>
          
          <div style={{ color: "#666", fontSize: "0.9rem" }}>または</div>
          
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/auth/login', { method: 'POST' });
                const data = await response.json();
                
                if (data.authUrl) {
                  sessionStorage.setItem('oauth_state', data.state);
                  window.location.href = data.authUrl;
                }
              } catch (error) {
                console.error('Failed to start OAuth flow:', error);
              }
            }}
            style={{
              background: "#6366f1",
              color: "white",
              padding: "1rem 3rem",
              fontSize: "1.2rem",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              width: "280px",
            }}>
            🔗 Oura Ringと連携
          </button>
        </div>

        <div style={{ textAlign: "left", maxWidth: "400px", margin: "0 auto" }}>
          <h3>✨ 特徴</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li>💤 睡眠スコア → MP回復</li>
            <li>🚶 歩数 → 攻撃力アップ</li>
            <li>💓 心拍数 → 防御力強化</li>
          </ul>
        </div>

        <p style={{ marginTop: "2rem", color: "#999" }}>
          📱 必要なもの: Oura Ring
        </p>
      </div>
    </div>
  );
}