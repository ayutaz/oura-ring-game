import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { testConnection } from './db/client.js'
import { runMigrations } from './db/migrations.js'
import authRoutes from './routes/auth-simple.js'

const app = new Hono()

// ミドルウェア
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}))

// ヘルスチェック
app.get('/health', async (c) => {
  const dbConnected = await testConnection()
  return c.json({ 
    status: dbConnected ? 'ok' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString() 
  })
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

// ルート登録
app.route('/auth', authRoutes)

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

// サーバー起動時の初期化
async function startServer() {
  try {
    // データベース接続確認
    const connected = await testConnection()
    if (!connected) {
      console.error('Failed to connect to database. Retrying in 5 seconds...')
      setTimeout(startServer, 5000)
      return
    }
    
    // マイグレーション実行
    await runMigrations()
    
    // サーバー起動
    const port = 8787
    console.log(`🚀 Server is running on port ${port}`)
    
    serve({
      fetch: app.fetch,
      port
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// サーバー起動
startServer()