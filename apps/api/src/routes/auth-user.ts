import { Hono } from 'hono'
import type { Context } from 'hono'
import jwt from 'jsonwebtoken'

const auth = new Hono()

// ユーザー入力の認証情報でOAuth開始
auth.post('/login', async (c: Context) => {
  const { clientId, clientSecret } = await c.req.json()
  
  if (!clientId || !clientSecret) {
    return c.json({ error: 'Client ID and Client Secret are required' }, 400)
  }
  
  // stateを生成
  const state = Math.random().toString(36).substring(7)
  
  // リダイレクトURIはクライアントが指定可能に
  const redirectUri = 'http://localhost:8787/auth/callback'
  
  // Oura OAuth URLを構築
  const authUrl = `https://cloud.ouraring.com/oauth/authorize?` +
    `response_type=code&` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent('daily_readiness daily_sleep daily_activity personal_info email')}&` +
    `state=${state}`
  
  return c.json({ authUrl, state, redirectUri })
})

// コールバック処理（ユーザー認証情報を使用）
auth.get('/callback', async (c: Context) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  
  if (!code) {
    return c.html(`
      <html>
        <body>
          <script>
            window.location.href = '/?error=no_code';
          </script>
        </body>
      </html>
    `)
  }
  
  return c.html(`
    <html>
      <head>
        <style>
          body {
            font-family: system-ui, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .container {
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔐 認証処理中...</h2>
          <p>Oura Ringと接続しています。</p>
        </div>
        <script>
          async function completeAuth() {
            const code = '${code}';
            const state = '${state}';
            
            // セッションストレージから認証情報を取得
            const clientId = sessionStorage.getItem('user_client_id');
            const clientSecret = sessionStorage.getItem('user_client_secret');
            
            if (!clientId || !clientSecret) {
              alert('認証情報が見つかりません。もう一度お試しください。');
              window.location.href = '/';
              return;
            }
            
            try {
              // トークン交換
              const response = await fetch('/auth/token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  code,
                  state,
                  clientId,
                  clientSecret,
                  redirectUri: 'http://localhost:8787/auth/callback'
                })
              });
              
              const data = await response.json();
              
              if (data.token) {
                // JWTトークンを保存
                localStorage.setItem('oura_token', data.token);
                localStorage.removeItem('demo_mode');
                
                // 認証情報をクリーンアップ
                sessionStorage.removeItem('user_client_id');
                sessionStorage.removeItem('user_client_secret');
                sessionStorage.removeItem('oauth_state');
                
                // ゲーム画面へ
                window.location.href = '/game';
              } else {
                alert('認証に失敗しました: ' + (data.error || '不明なエラー'));
                window.location.href = '/';
              }
            } catch (error) {
              alert('認証エラー: ' + error.message);
              window.location.href = '/';
            }
          }
          
          completeAuth();
        </script>
      </body>
    </html>
  `)
})

// トークン交換エンドポイント
auth.post('/token', async (c: Context) => {
  const { code, state, clientId, clientSecret, redirectUri } = await c.req.json()
  
  try {
    // Ouraトークンエンドポイントへリクエスト
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    })
    
    const tokenResponse = await fetch('https://api.ouraring.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return c.json({ error: 'Token exchange failed' }, 400)
    }
    
    const tokenData = await tokenResponse.json()
    
    // ユーザー情報を取得
    const userResponse = await fetch('https://api.ouraring.com/v2/usercollection/personal_info', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })
    
    const userData = await userResponse.json()
    
    // JWTトークンを生成（ユーザー認証情報も含める）
    const token = jwt.sign(
      {
        userId: userData.id || 'user_' + Date.now(),
        ouraAccessToken: tokenData.access_token,
        clientId, // ユーザーのclientIdも保存
        email: userData.email || 'user@example.com',
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    )
    
    return c.json({ token })
  } catch (error) {
    console.error('Auth error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

// Ouraデータプロキシ（ユーザートークンを使用）
auth.get('/oura-data/:endpoint', async (c: Context) => {
  const endpoint = c.req.param('endpoint')
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  try {
    // JWTをデコード
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    
    // クエリパラメータを転送
    const queryString = new URL(c.req.url).search
    
    // Oura APIへリクエスト
    const response = await fetch(
      `https://api.ouraring.com/v2/usercollection/${endpoint}${queryString}`,
      {
        headers: {
          'Authorization': `Bearer ${decoded.ouraAccessToken}`,
        },
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Oura API error:', errorText)
      return c.json({ error: 'Failed to fetch Oura data' }, response.status)
    }
    
    const data = await response.json()
    return c.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default auth