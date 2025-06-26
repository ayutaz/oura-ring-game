import { query } from './client.js'

export async function runMigrations() {
  console.log('🔄 Running database migrations...')
  
  try {
    // マイグレーション履歴テーブルの作成
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 実行済みマイグレーションを取得
    const executed = await query<{ name: string }>('SELECT name FROM migrations')
    const executedNames = new Set(executed.map(m => m.name))
    
    // マイグレーション定義
    const migrations = [
      {
        name: '001_initial_schema',
        up: async () => {
          // init.sqlの内容は既にDockerで実行されているので、
          // ここでは追加のマイグレーションのみ定義
          console.log('Initial schema already applied by Docker')
        }
      },
      // 今後のマイグレーションはここに追加
    ]
    
    // 未実行のマイグレーションを実行
    for (const migration of migrations) {
      if (!executedNames.has(migration.name)) {
        console.log(`📦 Applying migration: ${migration.name}`)
        await migration.up()
        await query('INSERT INTO migrations (name) VALUES ($1)', [migration.name])
        console.log(`✅ Migration ${migration.name} completed`)
      }
    }
    
    console.log('✅ All migrations completed')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}