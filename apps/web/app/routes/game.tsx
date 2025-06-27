import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function Game() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<any>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [character, setCharacter] = useState({
    name: "冒険者",
    level: 1,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    attack: 10,
    defense: 10,
  });
  
  useEffect(() => {
    // 認証チェック
    const token = localStorage.getItem('oura_token');
    if (!token) {
      navigate('/');
      return;
    }
    
    // デモモードチェック
    const demoMode = localStorage.getItem('demo_mode') === 'true';
    setIsDemoMode(demoMode);
    
    // 健康データを取得
    async function fetchHealthData() {
      try {
        if (demoMode) {
          // デモデータ
          const demoData = {
            sleep: { score: 85, contributors: { rem_sleep: 80 } },
            activity: { steps: 12000, score: 78 },
            readiness: { score: 82 }
          };
          
          setHealthData(demoData);
          setCharacter(prev => ({
            ...prev,
            mp: Math.min(50 + Math.floor(demoData.sleep.score * 0.5), 100),
            maxMp: 50 + Math.floor(demoData.sleep.score * 0.5),
            attack: 10 + Math.floor(demoData.activity.steps / 1000),
          }));
        } else {
          // 実際のOuraデータ
          const today = new Date().toISOString().split('T')[0];
          
          const sleepResponse = await fetch(
            `http://localhost:8787/auth/oura-data/daily_sleep?start_date=${today}&end_date=${today}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          
          if (!sleepResponse.ok) {
            throw new Error('Failed to fetch data');
          }
          
          const sleepData = await sleepResponse.json();
          console.log('Sleep data:', sleepData);
          
          if (sleepData.data && sleepData.data.length > 0) {
            const sleep = sleepData.data[0];
            setCharacter(prev => ({
              ...prev,
              mp: Math.min(50 + Math.floor(sleep.score * 0.5), 100),
              maxMp: 50 + Math.floor(sleep.score * 0.5),
            }));
          }
          
          setHealthData({ sleep: sleepData.data?.[0] });
        }
        
      } catch (error) {
        console.error('Failed to fetch health data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchHealthData();
  }, [navigate]);
  
  if (loading) {
    return (
      <div style={{ 
        fontFamily: "system-ui, sans-serif", 
        textAlign: "center", 
        padding: "2rem" 
      }}>
        <p>健康データを読み込み中...</p>
        <div style={{ fontSize: "2rem", marginTop: "1rem" }}>⏳</div>
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
          onClick={() => {
            localStorage.removeItem('oura_token');
            localStorage.removeItem('demo_mode');
            navigate('/');
          }}
          style={{
            padding: "0.5rem 1rem",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ログアウト
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
            HP: {'█'.repeat(Math.floor(character.hp / character.maxHp * 10))}
            {'░'.repeat(10 - Math.floor(character.hp / character.maxHp * 10))} 
            {character.hp}/{character.maxHp}
          </div>
          <div>
            MP: {'█'.repeat(Math.floor(character.mp / character.maxMp * 10))}
            {'░'.repeat(10 - Math.floor(character.mp / character.maxMp * 10))} 
            {character.mp}/{character.maxMp}
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
        {isDemoMode && (
          <div style={{ 
            background: "#fef3c7", 
            padding: "0.5rem", 
            borderRadius: "4px", 
            marginBottom: "0.5rem",
            fontSize: "0.9rem"
          }}>
            🎮 デモモードでプレイ中
          </div>
        )}
        {healthData?.sleep ? (
          <div>
            <p>昨夜の睡眠スコア: {healthData.sleep.score}点</p>
            <p>「{healthData.sleep.score >= 80 ? '良質な睡眠でMP全回復！' : '睡眠不足で冒険は控えめに...'
            }」</p>
          </div>
        ) : (
          <p>健康データがまだありません。Oura Ringを装着して睡眠を記録してください。</p>
        )}
      </div>
      
      {/* 健康データ表示 */}
      <div style={{ 
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1rem",
        marginBottom: "1rem"
      }}>
        <div style={{ 
          background: "#dbeafe", 
          padding: "1rem",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <div>💤 睡眠</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            {healthData?.sleep?.score || '--'}
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
            {healthData?.activity?.steps?.toLocaleString() || '--'}
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
            {healthData?.readiness?.score || '--'}
          </div>
        </div>
      </div>
      
      {/* 冒険ボタン */}
      <div style={{ 
        textAlign: "center",
        marginTop: "2rem"
      }}>
        <button
          onClick={() => navigate('/game/adventure')}
          style={{
            padding: "1rem 3rem",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1.2rem",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          ⚔️ 冒険に出発する
        </button>
      </div>
    </div>
  );
}