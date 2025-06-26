import { json, redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  
  if (error) {
    return json({ error: error });
  }
  
  if (!code || !state) {
    return json({ error: "Missing code or state parameter" });
  }
  
  return json({ code, state });
}

export default function AuthCallback() {
  const { code, state, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  useEffect(() => {
    if (error) {
      setAuthError(error);
      setProcessing(false);
      return;
    }
    
    // APIサーバーにコードを送信してトークンを交換
    async function exchangeToken() {
      try {
        // セッションストレージからstateを取得
        const savedState = sessionStorage.getItem('oauth_state');
        
        const response = await fetch('http://localhost:8787/auth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            code, 
            state: state || savedState || 'no-state' 
          }),
        });
        
        const data = await response.json();
        
        if (data.success && data.token) {
          // トークンをlocalStorageに保存
          localStorage.setItem('oura_token', data.token);
          
          // セッションストレージをクリア
          sessionStorage.removeItem('oauth_state');
          
          // ゲーム画面へリダイレクト
          setTimeout(() => {
            navigate('/game');
          }, 1000);
        } else {
          setAuthError(data.error || data.details || 'Authentication failed');
          console.error('Auth error:', data);
        }
      } catch (err) {
        console.error('Token exchange error:', err);
        setAuthError('Failed to complete authentication');
      } finally {
        setProcessing(false);
      }
    }
    
    exchangeToken();
  }, [code, state, error, navigate]);
  
  return (
    <div style={{ 
      fontFamily: "system-ui, sans-serif", 
      maxWidth: "600px", 
      margin: "0 auto", 
      padding: "2rem",
      textAlign: "center" 
    }}>
      <h1>認証処理中...</h1>
      
      {processing && (
        <div>
          <p>Oura Ringとの連携を確認しています...</p>
          <div style={{ fontSize: "2rem", marginTop: "1rem" }}>⏳</div>
        </div>
      )}
      
      {!processing && authError && (
        <div style={{ color: "red", marginTop: "2rem" }}>
          <p>エラー: {authError}</p>
          <button 
            onClick={() => navigate('/')}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ホームに戻る
          </button>
        </div>
      )}
      
      {!processing && !authError && (
        <div style={{ color: "green", marginTop: "2rem" }}>
          <p>✅ 認証成功！</p>
          <p>ゲーム画面へ移動します...</p>
        </div>
      )}
    </div>
  );
}