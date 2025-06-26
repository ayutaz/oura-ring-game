import { Hono } from 'hono'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const auth = new Hono()

// 環境変数
const OURA_CLIENT_ID = process.env.OURA_CLIENT_ID || ''
const OURA_CLIENT_SECRET = process.env.OURA_CLIENT_SECRET || ''
const OURA_REDIRECT_URI = process.env.OURA_REDIRECT_URI || 'http://localhost:3000/auth/callback'
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret'

// Oura OAuth URL
const OURA_AUTH_URL = 'https://cloud.ouraring.com/oauth/authorize'
const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token'

// OAuth開始 - Oura認証ページへリダイレクト
auth.get('/login', (c) => {
  const state = Math.random().toString(36).substring(7)
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OURA_CLIENT_ID,
    redirect_uri: OURA_REDIRECT_URI,
    scope: 'personal daily heartrate workout tag session',
    state: state,
  })
  
  const authUrl = `${OURA_AUTH_URL}?${params.toString()}`
  
  return c.json({ 
    authUrl,
    state, // クライアントで保持してもらう
    message: 'Redirect user to this URL for Oura authentication' 
  })
})

// OAuthコールバック処理（シンプル版）
const CallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
})

auth.post('/callback', async (c) => {
  try {
    const body = await c.req.json()
    const { code } = CallbackSchema.parse(body)
    
    console.log('OAuth callback received, exchanging code for token...')
    
    // アクセストークン取得
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: OURA_REDIRECT_URI,
      client_id: OURA_CLIENT_ID,
      client_secret: OURA_CLIENT_SECRET,
    })
    
    const tokenResponse = await fetch(OURA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    })
    
    const responseText = await tokenResponse.text()
    console.log('Token response status:', tokenResponse.status)
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', responseText)
      return c.json({ 
        error: 'Failed to exchange token', 
        details: responseText,
        status: tokenResponse.status 
      }, 400)
    }
    
    let tokenData
    try {
      tokenData = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse token response:', responseText)
      return c.json({ error: 'Invalid token response' }, 500)
    }
    
    // シンプルなJWTトークン生成（Ouraのアクセストークンを含む）
    const jwtToken = jwt.sign(
      { 
        ouraAccessToken: tokenData.access_token,
        ouraRefreshToken: tokenData.refresh_token || '',
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
      },
      JWT_SECRET,
      { expiresIn: '30d' } // 長期間有効
    )
    
    return c.json({ 
      success: true,
      token: jwtToken,
      expiresIn: tokenData.expires_in,
    })
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

// Ouraデータ取得用ヘルパー
auth.get('/oura-data/:endpoint', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { 
      ouraAccessToken: string 
      expiresAt: number
    }
    
    // トークンの有効期限チェック
    if (Date.now() > decoded.expiresAt) {
      return c.json({ error: 'Token expired' }, 401)
    }
    
    const endpoint = c.req.param('endpoint')
    const url = new URL(c.req.url)
    const queryParams = url.searchParams.toString()
    
    // Oura APIへのプロキシリクエスト
    const ouraResponse = await fetch(
      `https://api.ouraring.com/v2/usercollection/${endpoint}${queryParams ? '?' + queryParams : ''}`,
      {
        headers: {
          'Authorization': `Bearer ${decoded.ouraAccessToken}`,
        },
      }
    )
    
    if (!ouraResponse.ok) {
      const error = await ouraResponse.text()
      return c.json({ error: 'Oura API error', details: error }, ouraResponse.status)
    }
    
    const data = await ouraResponse.json()
    return c.json(data)
    
  } catch (error) {
    console.error('Oura data fetch error:', error)
    return c.json({ error: 'Failed to fetch Oura data' }, 500)
  }
})

export default auth