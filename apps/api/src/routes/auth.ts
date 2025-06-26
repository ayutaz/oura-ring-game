import { Hono } from 'hono'
import { setCookie, getCookie } from 'hono/cookie'
import jwt from 'jsonwebtoken'
import { query } from '../db/client.js'
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
const OURA_API_BASE = 'https://api.ouraring.com/v2'

// OAuth開始 - Oura認証ページへリダイレクト
auth.get('/login', (c) => {
  const state = Math.random().toString(36).substring(7)
  
  // stateをクッキーに保存（CSRF対策）
  setCookie(c, 'oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 60 * 10, // 10分
  })
  
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
    message: 'Redirect user to this URL for Oura authentication' 
  })
})

// OAuthコールバック処理
const CallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
})

auth.post('/callback', async (c) => {
  try {
    const body = await c.req.json()
    const { code, state } = CallbackSchema.parse(body)
    
    console.log('OAuth callback received:', { code: code.substring(0, 10) + '...', state })
    
    // state検証（CSRF対策）
    const savedState = getCookie(c, 'oauth_state')
    console.log('State validation:', { saved: savedState, received: state })
    
    // 開発環境ではstate検証をスキップ（Cookieの問題を回避）
    if (process.env.NODE_ENV !== 'development') {
      if (!savedState || savedState !== state) {
        return c.json({ error: 'Invalid state parameter' }, 400)
      }
    }
    
    // アクセストークン取得
    console.log('Exchanging code for token...')
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: OURA_REDIRECT_URI,
      client_id: OURA_CLIENT_ID,
      client_secret: OURA_CLIENT_SECRET,
    })
    
    console.log('Token request URL:', OURA_TOKEN_URL)
    console.log('Redirect URI:', OURA_REDIRECT_URI)
    
    const tokenResponse = await fetch(OURA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    })
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: error
      })
      return c.json({ 
        error: 'Failed to exchange token', 
        details: error,
        status: tokenResponse.status 
      }, 400)
    }
    
    const tokenData = await tokenResponse.json()
    
    // Ouraユーザー情報を取得
    const userResponse = await fetch(`${OURA_API_BASE}/usercollection/personal_info`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })
    
    if (!userResponse.ok) {
      console.error('Failed to fetch user info:', await userResponse.text())
      return c.json({ error: 'Failed to fetch user info' }, 400)
    }
    
    const userDataWrapper = await userResponse.json()
    const ouraUserData = userDataWrapper.data?.[0] || userDataWrapper
    const ouraUserId = ouraUserData.id || ouraUserData.user_id || `oura_${Date.now()}`
    
    // ユーザーをDBに保存または更新
    const existingUser = await query(
      'SELECT id FROM users WHERE oura_user_id = $1',
      [ouraUserId]
    )
    
    let userId: string
    
    if (existingUser.length > 0) {
      userId = existingUser[0].id
      // トークンを更新
      await query(
        `UPDATE oura_tokens 
         SET access_token = $1, refresh_token = $2, expires_at = $3, updated_at = NOW()
         WHERE user_id = $4`,
        [
          tokenData.access_token,
          tokenData.refresh_token || '',
          new Date(Date.now() + tokenData.expires_in * 1000),
          userId,
        ]
      )
    } else {
      // 新規ユーザー作成
      const newUser = await query(
        'INSERT INTO users (email, oura_user_id) VALUES ($1, $2) RETURNING id',
        [ouraUserData.email || `${ouraUserId}@oura.local`, ouraUserId]
      )
      userId = newUser[0].id
      
      // トークン保存
      await query(
        `INSERT INTO oura_tokens (user_id, access_token, refresh_token, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [
          userId,
          tokenData.access_token,
          tokenData.refresh_token || '',
          new Date(Date.now() + tokenData.expires_in * 1000),
        ]
      )
      
      // 初期キャラクター作成
      await query(
        'INSERT INTO characters (user_id, name) VALUES ($1, $2)',
        [userId, 'プレイヤー']
      )
    }
    
    // JWTトークン生成
    const jwtToken = jwt.sign(
      { userId, ouraUserId },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    return c.json({ 
      success: true,
      token: jwtToken,
      userId,
    })
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

// ログアウト
auth.post('/logout', (c) => {
  // クライアント側でトークンを削除してもらう
  return c.json({ success: true, message: 'Please remove token from client storage' })
})

// 現在のユーザー情報取得
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    const user = await query(
      `SELECT u.id, u.email, u.created_at, c.name, c.level, c.experience
       FROM users u
       LEFT JOIN characters c ON u.id = c.user_id
       WHERE u.id = $1`,
      [decoded.userId]
    )
    
    if (user.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json({ user: user[0] })
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

export default auth