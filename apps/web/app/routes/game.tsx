import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  // 初回ロードではクライアントサイドで認証チェック
  return json({});
}

export default function Game() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 認証チェック
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/');
      return;
    }
    
    // ユーザー情報取得
    async function fetchUser() {
      try {
        const response = await fetch('http://localhost:8787/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUser();
  }, [navigate]);
  
  if (loading) {
    return (
      <div style={{ 
        fontFamily: "system-ui, sans-serif", 
        textAlign: "center", 
        padding: "2rem" 
      }}>
        <p>読み込み中...</p>
      </div>
    );
  }
  
  if (!user) {
    return null;
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
          <h2 style={{ margin: 0 }}>👤 {user.name}</h2>
          <p style={{ margin: 0, color: "#666" }}>
            Lv.{user.level} ⚡ {user.experience} EXP
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_id');
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
          <div>HP: ████████░░ 150/180</div>
          <div>MP: ███████░░░ 80/120</div>
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
        <p>健康データを同期して冒険を開始しましょう！</p>
        <button
          style={{
            padding: "0.5rem 1rem",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🔄 データ同期
        </button>
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
          <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>--</div>
        </div>
        <div style={{ 
          background: "#fef3c7", 
          padding: "1rem",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <div>🚶 歩数</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>--</div>
        </div>
        <div style={{ 
          background: "#d1fae5", 
          padding: "1rem",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <div>✨ 準備度</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>--</div>
        </div>
      </div>
    </div>
  );
}