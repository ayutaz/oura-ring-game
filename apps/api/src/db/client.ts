import { Pool } from 'pg'

// データベース接続設定
const connectionString = process.env.DATABASE_URL || 'postgresql://oura:oura123@db:5432/oura_quest'

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// 接続テスト
export async function testConnection() {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    console.log('✅ Database connected:', result.rows[0].now)
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// ヘルパー関数
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res.rows
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export async function getClient() {
  const client = await pool.connect()
  const query = client.query.bind(client)
  const release = () => {
    client.release()
  }
  
  // エラー時の自動リリース
  client.on('error', () => {
    console.error('Unexpected client error')
    client.release()
  })
  
  return { query, release }
}