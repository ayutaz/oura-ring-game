import { getPool } from '../db/client.js'
import { Adventure } from '../../../../src/game/adventure.js'
import { Character } from '../../../../src/game/character.js'

interface UserWithToken {
  user_id: number
  oura_access_token: string
  name: string
  level: number
}

export class AutoAdventureWorker {
  private pool = getPool()
  
  async run() {
    console.log('Starting auto adventure worker...')
    
    try {
      // アクティブなユーザーを取得
      const usersResult = await this.pool.query(`
        SELECT u.id as user_id, u.oura_access_token, c.name, c.level
        FROM users u
        JOIN characters c ON u.id = c.user_id
        WHERE u.oura_access_token IS NOT NULL
        AND u.created_at > NOW() - INTERVAL '30 days'
      `)
      
      const users = usersResult.rows as UserWithToken[]
      console.log(`Found ${users.length} active users`)
      
      // 各ユーザーに対して処理
      for (const user of users) {
        try {
          await this.processUserAdventure(user)
        } catch (error) {
          console.error(`Failed to process user ${user.user_id}:`, error)
        }
      }
      
      console.log('Auto adventure worker completed')
    } catch (error) {
      console.error('Auto adventure worker failed:', error)
    }
  }
  
  private async processUserAdventure(user: UserWithToken) {
    console.log(`Processing adventure for user ${user.user_id}`)
    
    // 今日の日付
    const today = new Date().toISOString().split('T')[0]
    
    // すでに今日冒険を実行したかチェック
    const existingAdventureResult = await this.pool.query(`
      SELECT COUNT(*) as count
      FROM adventure_logs
      WHERE user_id = $1
      AND DATE(created_at) = $2
      AND adventure_type = 'auto'
    `, [user.user_id, today])
    
    if (existingAdventureResult.rows[0].count > 0) {
      console.log(`User ${user.user_id} already had auto adventure today`)
      return
    }
    
    // Ouraデータを取得
    const healthData = await this.fetchOuraData(user.oura_access_token, today)
    
    if (!healthData.sleep && !healthData.activity && !healthData.readiness) {
      console.log(`No health data available for user ${user.user_id}`)
      return
    }
    
    // 健康データをキャッシュに保存
    await this.pool.query(`
      INSERT INTO daily_health_cache (user_id, date, sleep_data, activity_data, readiness_data)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, date) 
      DO UPDATE SET 
        sleep_data = $3,
        activity_data = $4,
        readiness_data = $5,
        updated_at = CURRENT_TIMESTAMP
    `, [
      user.user_id,
      today,
      JSON.stringify(healthData.sleep),
      JSON.stringify(healthData.activity),
      JSON.stringify(healthData.readiness),
    ])
    
    // 時間帯を決定（現在時刻に基づく）
    const hour = new Date().getHours()
    let timeOfDay: 'morning' | 'afternoon' | 'night'
    if (hour < 12) {
      timeOfDay = 'morning'
    } else if (hour < 18) {
      timeOfDay = 'afternoon'
    } else {
      timeOfDay = 'night'
    }
    
    // 冒険を実行
    const adventure = new Adventure()
    const character = new Character(user.name, user.level)
    const result = adventure.runAdventure(timeOfDay, healthData)
    
    // 冒険結果を保存
    await this.pool.query(`
      INSERT INTO adventure_logs (user_id, adventure_type, time_of_day, health_snapshot, result, rewards, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `, [
      user.user_id,
      'auto', // 自動冒険タイプ
      timeOfDay,
      JSON.stringify(healthData),
      JSON.stringify(result),
      JSON.stringify(result.rewards),
    ])
    
    // キャラクターステータスを更新
    const characterResult = await this.pool.query(
      'SELECT * FROM characters WHERE user_id = $1',
      [user.user_id]
    )
    
    if (characterResult.rows.length > 0) {
      const char = characterResult.rows[0]
      const newExperience = char.experience + result.rewards.experience
      const newGold = char.gold + result.rewards.gold
      let newLevel = char.level
      
      // レベルアップチェック
      if (newExperience >= char.level * 100) {
        newLevel++
        console.log(`User ${user.user_id} leveled up to ${newLevel}!`)
      }
      
      // ステータス更新
      const newStats = character.calculateStatsFromHealthData(
        healthData.sleep,
        healthData.activity,
        healthData.readiness
      )
      
      await this.pool.query(`
        UPDATE characters 
        SET experience = $2, gold = $3, level = $4,
            mp = $5, max_mp = $6, attack = $7, defense = $8,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `, [
        user.user_id,
        newExperience,
        newGold,
        newLevel,
        newStats.mp,
        newStats.maxMp,
        newStats.attack,
        newStats.defense,
      ])
    }
    
    console.log(`Auto adventure completed for user ${user.user_id}`)
  }
  
  private async fetchOuraData(accessToken: string, date: string) {
    const healthData: any = {
      sleep: null,
      activity: null,
      readiness: null,
    }
    
    try {
      // 睡眠データ取得
      const sleepResponse = await fetch(
        `https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${date}&end_date=${date}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (sleepResponse.ok) {
        const sleepData = await sleepResponse.json()
        healthData.sleep = sleepData.data?.[0] || null
      }
      
      // 活動データ取得
      const activityResponse = await fetch(
        `https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${date}&end_date=${date}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        healthData.activity = activityData.data?.[0] || null
      }
      
      // 準備度データ取得
      const readinessResponse = await fetch(
        `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${date}&end_date=${date}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (readinessResponse.ok) {
        const readinessData = await readinessResponse.json()
        healthData.readiness = readinessData.data?.[0] || null
      }
    } catch (error) {
      console.error('Failed to fetch Oura data:', error)
    }
    
    return healthData
  }
}

// 定期実行用のエントリーポイント
export async function runAutoAdventure() {
  const worker = new AutoAdventureWorker()
  await worker.run()
}