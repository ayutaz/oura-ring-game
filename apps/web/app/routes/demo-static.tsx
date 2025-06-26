import { useState, useEffect } from "react";

// GitHub Pages用の完全静的版
export default function DemoStatic() {
  const [gameStarted, setGameStarted] = useState(false);
  const [character, setCharacter] = useState({
    name: "冒険者",
    level: 1,
    hp: 100,
    maxHp: 100,
    mp: 92,
    maxMp: 92,
    attack: 22,
    defense: 10,
  });
  const [healthData] = useState({
    sleep: { score: 85 },
    activity: { steps: 12000 },
    readiness: { score: 82 }
  });

  if (!gameStarted) {
    return (
      <div style={{ 
        fontFamily: "system-ui, sans-serif", 
        maxWidth: "600px", 
        margin: "0 auto", 
        padding: "2rem",
        textAlign: "center" 
      }}>
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

        <button 
          onClick={() => setGameStarted(true)}
          style={{
            background: "#10b981",
            color: "white",
            padding: "1rem 3rem",
            fontSize: "1.2rem",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}>
          🎮 デモプレイ開始
        </button>

        <p style={{ marginTop: "2rem", color: "#999", fontSize: "0.9rem" }}>
          ※ これはGitHub Pages用のデモ版です。<br/>
          実際のOura Ring連携にはサーバーが必要です。
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: "system-ui, sans-serif", 
      maxWidth: "800px", 
      margin: "0 auto", 
      padding: "1rem" 
    }}>
      {/* ヘッダー */}
      <div style={{ 
        background: "#f0f0f0", 
        padding: "1rem", 
        borderRadius: "8px",
        marginBottom: "1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h2 style={{ margin: 0 }}>👤 {character.name}</h2>
          <p style={{ margin: 0, color: "#666" }}>
            Lv.{character.level}
          </p>
        </div>
        <button
          onClick={() => setGameStarted(false)}
          style={{
            padding: "0.5rem 1rem",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          タイトルに戻る
        </button>
      </div>
      
      {/* キャラクター表示エリア */}
      <div style={{ 
        background: "#fff", 
        border: "2px solid #e0e0e0",
        borderRadius: "8px",
        padding: "2rem",
        marginBottom: "1rem",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
          ⚔️ 👤 🛡️
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <div>
            HP: {'█'.repeat(10)} {character.hp}/{character.maxHp}
          </div>
          <div>
            MP: {'█'.repeat(9)}{'░'.repeat(1)} {character.mp}/{character.maxMp}
          </div>
        </div>
        <div style={{ fontSize: "0.9rem", color: "#666" }}>
          攻撃力: {character.attack} | 防御力: {character.defense}
        </div>
      </div>
      
      {/* 今日の冒険 */}
      <div style={{ 
        background: "#f9fafb", 
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "1rem"
      }}>
        <h3>📅 今日の冒険</h3>
        <div style={{ 
          background: "#fef3c7", 
          padding: "0.5rem", 
          borderRadius: "4px", 
          marginBottom: "0.5rem",
          fontSize: "0.9rem"
        }}>
          🎮 デモモードでプレイ中
        </div>
        <p>昨夜の睡眠スコア: {healthData.sleep.score}点</p>
        <p>「良質な睡眠でMP全回復！」</p>
      </div>
      
      {/* 健康データ表示 */}
      <div style={{ 
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1rem"
      }}>
        <div style={{ 
          background: "#dbeafe", 
          padding: "1rem",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <div>💤 睡眠</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            {healthData.sleep.score}
          </div>
        </div>
        <div style={{ 
          background: "#fef3c7", 
          padding: "1rem",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <div>🚶 歩数</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            {healthData.activity.steps.toLocaleString()}
          </div>
        </div>
        <div style={{ 
          background: "#d1fae5", 
          padding: "1rem",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <div>✨ 準備度</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            {healthData.readiness.score}
          </div>
        </div>
      </div>
    </div>
  );
}