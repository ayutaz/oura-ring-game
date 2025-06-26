import { useState } from "react";
import { useNavigate } from "@remix-run/react";

export default function Demo() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"select" | "manual" | "demo">("select");
  const [manualData, setManualData] = useState({
    sleep: 85,
    steps: 8000,
    readiness: 75,
  });

  const startDemoMode = () => {
    // デモデータをlocalStorageに保存
    const demoToken = "demo-mode-token";
    localStorage.setItem('oura_token', demoToken);
    localStorage.setItem('demo_mode', 'true');
    navigate('/game');
  };

  const saveManualData = () => {
    // 手動データをlocalStorageに保存
    localStorage.setItem('oura_token', 'manual-mode-token');
    localStorage.setItem('manual_mode', 'true');
    localStorage.setItem('manual_data', JSON.stringify(manualData));
    navigate('/game');
  };

  if (mode === "manual") {
    return (
      <div style={{ 
        fontFamily: "system-ui, sans-serif", 
        maxWidth: "600px", 
        margin: "0 auto", 
        padding: "2rem" 
      }}>
        <h1>手動データ入力</h1>
        <p>Ouraアプリから今日のデータを入力してください</p>
        
        <div style={{ marginTop: "2rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              💤 睡眠スコア (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={manualData.sleep}
              onChange={(e) => setManualData({ ...manualData, sleep: Number(e.target.value) })}
              style={{
                width: "100%",
                padding: "0.5rem",
                fontSize: "1rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              🚶 歩数
            </label>
            <input
              type="number"
              min="0"
              value={manualData.steps}
              onChange={(e) => setManualData({ ...manualData, steps: Number(e.target.value) })}
              style={{
                width: "100%",
                padding: "0.5rem",
                fontSize: "1rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>
          
          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              ✨ 準備度スコア (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={manualData.readiness}
              onChange={(e) => setManualData({ ...manualData, readiness: Number(e.target.value) })}
              style={{
                width: "100%",
                padding: "0.5rem",
                fontSize: "1rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>
          
          <button
            onClick={saveManualData}
            style={{
              width: "100%",
              padding: "1rem",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1.1rem",
              cursor: "pointer",
            }}
          >
            ゲームを開始
          </button>
          
          <button
            onClick={() => setMode("select")}
            style={{
              width: "100%",
              padding: "0.5rem",
              background: "transparent",
              color: "#666",
              border: "1px solid #ccc",
              borderRadius: "4px",
              marginTop: "1rem",
              cursor: "pointer",
            }}
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: "system-ui, sans-serif", 
      maxWidth: "600px", 
      margin: "0 auto", 
      padding: "2rem",
      textAlign: "center" 
    }}>
      <h1>🎮 プレイ方法を選択</h1>
      <p>Oura Ringをお持ちでない方も遊べます！</p>
      
      <div style={{ marginTop: "3rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: "1.5rem",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.1rem",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "2rem" }}>🔗</span>
          <div>
            <div style={{ fontWeight: "bold" }}>Oura Ring連携</div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              自動でデータを取得（要認証設定）
            </div>
          </div>
        </button>
        
        <button
          onClick={() => setMode("manual")}
          style={{
            padding: "1.5rem",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.1rem",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "2rem" }}>✏️</span>
          <div>
            <div style={{ fontWeight: "bold" }}>手動入力</div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              Ouraアプリの数値を入力
            </div>
          </div>
        </button>
        
        <button
          onClick={startDemoMode}
          style={{
            padding: "1.5rem",
            background: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.1rem",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "2rem" }}>🎮</span>
          <div>
            <div style={{ fontWeight: "bold" }}>デモモード</div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              サンプルデータですぐに体験
            </div>
          </div>
        </button>
      </div>
      
      <div style={{ marginTop: "3rem", color: "#666", fontSize: "0.9rem" }}>
        <p>💡 ヒント: デモモードで遊んでから、実際のデータで楽しむのがおすすめ！</p>
      </div>
    </div>
  );
}