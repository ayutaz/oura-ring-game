import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { ShareButtons } from "../components/ShareButtons";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export default function GameAdventure() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [adventureResult, setAdventureResult] = useState<any>(null);
  const [adventureLogs, setAdventureLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // 認証チェック
    const token = localStorage.getItem('oura_token');
    if (!token) {
      navigate('/');
      return;
    }
    
    // 冒険ログを取得
    fetchAdventureLogs();
  }, [navigate]);
  
  const fetchAdventureLogs = async () => {
    const token = localStorage.getItem('oura_token');
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:8787/game/adventure-logs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const logs = await response.json();
        setAdventureLogs(logs);
      }
    } catch (error) {
      console.error('Failed to fetch adventure logs:', error);
    }
  };
  
  const runAdventure = async (timeOfDay: string) => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('oura_token');
    
    try {
      const response = await fetch('http://localhost:8787/game/adventure', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeOfDay }),
      });
      
      if (!response.ok) {
        throw new Error('冒険の実行に失敗しました');
      }
      
      const result = await response.json();
      setAdventureResult(result);
      
      // ログを再取得
      await fetchAdventureLogs();
    } catch (error: any) {
      setError(error.message || '冒険中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
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
        <h2 style={{ margin: 0 }}>⚔️ 冒険</h2>
        <button
          onClick={() => navigate('/game')}
          style={{
            padding: "0.5rem 1rem",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          戻る
        </button>
      </div>
      
      {/* 冒険実行ボタン */}
      <div style={{ 
        background: "#fff", 
        border: "2px solid #e0e0e0",
        borderRadius: "8px",
        padding: "2rem",
        marginBottom: "1rem",
        textAlign: "center"
      }}>
        <h3>今すぐ冒険に出発！</h3>
        <div style={{ 
          display: "flex", 
          gap: "1rem", 
          justifyContent: "center",
          marginTop: "1rem"
        }}>
          <button
            onClick={() => runAdventure('morning')}
            disabled={loading}
            style={{
              padding: "1rem 2rem",
              background: loading ? "#ccc" : "#fbbf24",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1.1rem",
            }}
          >
            🌅 朝の冒険
          </button>
          <button
            onClick={() => runAdventure('afternoon')}
            disabled={loading}
            style={{
              padding: "1rem 2rem",
              background: loading ? "#ccc" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1.1rem",
            }}
          >
            ☀️ 昼の冒険
          </button>
          <button
            onClick={() => runAdventure('night')}
            disabled={loading}
            style={{
              padding: "1rem 2rem",
              background: loading ? "#ccc" : "#8b5cf6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1.1rem",
            }}
          >
            🌙 夜の冒険
          </button>
        </div>
      </div>
      
      {/* エラー表示 */}
      {error && (
        <div style={{ 
          background: "#fee", 
          border: "1px solid #fcc",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1rem",
          color: "#c00"
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {/* 冒険結果 */}
      {adventureResult && (
        <div style={{ 
          background: "#e0f2fe", 
          border: "2px solid #0284c7",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "1rem"
        }}>
          <h3>🎉 冒険結果</h3>
          <div style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
            <strong>{adventureResult.result.location}</strong>で
            <strong>{adventureResult.result.event}</strong>
          </div>
          <p>{adventureResult.result.description}</p>
          <p>{adventureResult.result.outcome}</p>
          <div style={{ 
            background: "#fff", 
            padding: "1rem", 
            borderRadius: "4px",
            marginTop: "1rem"
          }}>
            <h4>獲得報酬</h4>
            <p>💰 ゴールド: {adventureResult.result.rewards.gold}</p>
            <p>⭐ 経験値: {adventureResult.result.rewards.experience}</p>
            {adventureResult.result.rewards.items?.length > 0 && (
              <p>🎁 アイテム: {adventureResult.result.rewards.items.join(', ')}</p>
            )}
          </div>
          {adventureResult.levelUp && (
            <div style={{ 
              background: "#fef3c7", 
              padding: "1rem", 
              borderRadius: "4px",
              marginTop: "1rem",
              textAlign: "center",
              fontSize: "1.2rem",
              fontWeight: "bold"
            }}>
              🎊 {adventureResult.levelUp}
            </div>
          )}
        </div>
      )}
      
      {/* 冒険ログ */}
      <div style={{ 
        background: "#f9fafb", 
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "1rem"
      }}>
        <h3>📜 冒険の記録</h3>
        {adventureLogs.length === 0 ? (
          <p>まだ冒険の記録がありません。</p>
        ) : (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {adventureLogs.map((log, index) => {
              const result = JSON.parse(log.result);
              const rewards = JSON.parse(log.rewards);
              const date = new Date(log.created_at);
              
              return (
                <div key={index} style={{ 
                  background: "#fff", 
                  padding: "1rem", 
                  marginBottom: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #e0e0e0"
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginBottom: "0.5rem"
                  }}>
                    <strong>{result.location}</strong>
                    <span style={{ color: "#666", fontSize: "0.9rem" }}>
                      {date.toLocaleDateString()} {date.toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ margin: "0.25rem 0" }}>{result.event}</p>
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>
                    💰 {rewards.gold} | ⭐ {rewards.experience}
                    {rewards.items?.length > 0 && ` | 🎁 ${rewards.items.length}個`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}