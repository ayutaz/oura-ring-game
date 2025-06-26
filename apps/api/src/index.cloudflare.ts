import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth-simple.js'

type Bindings = {
  DB: D1Database
  CACHE: KVNamespace
  OURA_CLIENT_ID: string
  OURA_CLIENT_SECRET: string
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定
app.use('/*', cors({
  origin: ['https://oura-game.pages.dev', 'http://localhost:3000'],
  credentials: true,
}))

// ヘルスチェック
app.get('/health', (c) => c.json({ 
  status: 'ok',
  environment: 'cloudflare',
  timestamp: new Date().toISOString()
}))

// 認証ルート
app.route('/auth', authRoutes)

// Cloudflare Workers用エクスポート
export default app