import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

// ミドルウェア
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}))

// ヘルスチェック
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// テスト用エンドポイント
app.get('/', (c) => {
  return c.json({ 
    message: 'Oura Quest API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      auth: '/auth/*',
      user: '/user/*',
      game: '/game/*',
      oura: '/oura/*'
    }
  })
})

// モックデータエンドポイント（開発用）
app.get('/mock/health-data', (c) => {
  return c.json({
    sleep: {
      date: new Date().toISOString().split('T')[0],
      score: 85,
      total_sleep_duration: 28800, // 8時間（秒）
    },
    activity: {
      date: new Date().toISOString().split('T')[0],
      score: 75,
      steps: 8543,
      active_calories: 350,
    },
    readiness: {
      date: new Date().toISOString().split('T')[0],
      score: 82,
    }
  })
})

const port = 8787
console.log(`🚀 Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})