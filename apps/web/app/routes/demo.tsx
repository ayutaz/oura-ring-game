import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";

export default function Demo() {
  const navigate = useNavigate();

  useEffect(() => {
    // デモモードを開始
    const demoToken = "demo-mode-token";
    localStorage.setItem('oura_token', demoToken);
    localStorage.setItem('demo_mode', 'true');
    
    // ゲーム画面へ自動遷移
    navigate('/game');
  }, [navigate]);

  return (
    <div style={{ 
      fontFamily: "system-ui, sans-serif", 
      textAlign: "center", 
      padding: "2rem" 
    }}>
      <p>デモモードを開始中...</p>
      <div style={{ fontSize: "2rem", marginTop: "1rem" }}>⏳</div>
    </div>
  );
}