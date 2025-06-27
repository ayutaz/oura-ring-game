import { Hono } from 'hono'
import type { Context } from 'hono'
import { getPool } from '../db/client.js'
import jwt from 'jsonwebtoken'
import { Character } from '../../../../src/game/character.js'
import { Adventure } from '../../../../src/game/adventure.js'
import { Feedback } from '../../../../src/game/feedback.js'

const game = new Hono()

// JWTトークンからユーザー情報を取得
const getUserFromToken = (token: string) => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    return payload as { userId: number; ouraAccessToken: string }
  } catch {
    return null
  }
}

// キャラクター情報を取得
game.get('/character', async (c: Context) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const user = getUserFromToken(token)
  if (!user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const pool = getPool()
  try {
    // キャラクター情報を取得
    const characterResult = await pool.query(
      'SELECT * FROM characters WHERE user_id = $1',
      [user.userId]
    )

    if (characterResult.rows.length === 0) {
      // 新規キャラクター作成
      const newCharacter = await pool.query(
        `INSERT INTO characters (user_id, name, level, experience, hp, max_hp, mp, max_mp, attack, defense, gold)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [user.userId, '冒険者', 1, 0, 100, 100, 50, 50, 10, 10, 0]
      )
      return c.json(newCharacter.rows[0])
    }

    return c.json(characterResult.rows[0])
  } catch (error) {
    console.error('Failed to get character:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 健康データを取得してキャラクターを更新
game.post('/sync-health-data', async (c: Context) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const user = getUserFromToken(token)
  if (!user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const pool = getPool()
  try {
    // 今日の日付
    const today = new Date().toISOString().split('T')[0]
    
    // Ouraから健康データを取得
    const sleepResponse = await fetch(
      `https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${today}&end_date=${today}`,
      {
        headers: {
          'Authorization': `Bearer ${user.ouraAccessToken}`,
        },
      }
    )
    
    const activityResponse = await fetch(
      `https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${today}&end_date=${today}`,
      {
        headers: {
          'Authorization': `Bearer ${user.ouraAccessToken}`,
        },
      }
    )
    
    const readinessResponse = await fetch(
      `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${today}&end_date=${today}`,
      {
        headers: {
          'Authorization': `Bearer ${user.ouraAccessToken}`,
        },
      }
    )

    const sleepData = await sleepResponse.json()
    const activityData = await activityResponse.json()
    const readinessData = await readinessResponse.json()

    // データをキャッシュに保存
    const healthData = {
      sleep: sleepData.data?.[0] || null,
      activity: activityData.data?.[0] || null,
      readiness: readinessData.data?.[0] || null,
    }

    await pool.query(
      `INSERT INTO daily_health_cache (user_id, date, sleep_data, activity_data, readiness_data)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, date) 
       DO UPDATE SET 
         sleep_data = $3,
         activity_data = $4,
         readiness_data = $5,
         updated_at = CURRENT_TIMESTAMP`,
      [
        user.userId,
        today,
        JSON.stringify(healthData.sleep),
        JSON.stringify(healthData.activity),
        JSON.stringify(healthData.readiness),
      ]
    )

    // キャラクターステータスを更新
    const character = new Character('冒険者', 1)
    const newStats = character.calculateStatsFromHealthData(
      healthData.sleep,
      healthData.activity,
      healthData.readiness
    )

    await pool.query(
      `UPDATE characters 
       SET mp = $2, max_mp = $3, attack = $4, defense = $5, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [user.userId, newStats.mp, newStats.maxMp, newStats.attack, newStats.defense]
    )

    return c.json({ 
      message: 'Health data synced successfully', 
      healthData,
      newStats 
    })
  } catch (error) {
    console.error('Failed to sync health data:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 冒険を実行
game.post('/adventure', async (c: Context) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const user = getUserFromToken(token)
  if (!user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const { timeOfDay } = await c.req.json()
  if (!['morning', 'afternoon', 'night'].includes(timeOfDay)) {
    return c.json({ error: 'Invalid time of day' }, 400)
  }

  const pool = getPool()
  try {
    // キャラクター情報を取得
    const characterResult = await pool.query(
      'SELECT * FROM characters WHERE user_id = $1',
      [user.userId]
    )
    
    if (characterResult.rows.length === 0) {
      return c.json({ error: 'Character not found' }, 404)
    }

    const characterData = characterResult.rows[0]
    
    // 今日の健康データを取得
    const today = new Date().toISOString().split('T')[0]
    const healthResult = await pool.query(
      'SELECT * FROM daily_health_cache WHERE user_id = $1 AND date = $2',
      [user.userId, today]
    )

    let healthData = null
    if (healthResult.rows.length > 0) {
      const row = healthResult.rows[0]
      healthData = {
        sleep: JSON.parse(row.sleep_data),
        activity: JSON.parse(row.activity_data),
        readiness: JSON.parse(row.readiness_data),
      }
    }

    // 冒険を実行
    const character = new Character(characterData.name, characterData.level)
    const adventure = new Adventure()
    const result = adventure.runAdventure(timeOfDay, healthData || {
      sleep: { score: 70 },
      activity: { steps: 5000 },
      readiness: { score: 70 }
    })

    // 冒険結果を保存
    await pool.query(
      `INSERT INTO adventure_logs (user_id, adventure_type, time_of_day, health_snapshot, result, rewards, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        user.userId,
        result.type,
        timeOfDay,
        JSON.stringify(healthData),
        JSON.stringify(result),
        JSON.stringify(result.rewards),
      ]
    )

    // キャラクターを更新（経験値とゴールド）
    const newExperience = characterData.experience + result.rewards.experience
    const newGold = characterData.gold + result.rewards.gold
    
    // レベルアップ処理
    let newLevel = characterData.level
    let levelUpMessage = null
    if (newExperience >= characterData.level * 100) {
      newLevel++
      levelUpMessage = `レベルアップ！ Lv.${newLevel}になりました！`
    }

    await pool.query(
      `UPDATE characters 
       SET experience = $2, gold = $3, level = $4, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [user.userId, newExperience, newGold, newLevel]
    )

    return c.json({ 
      result,
      levelUp: levelUpMessage,
      character: {
        level: newLevel,
        experience: newExperience,
        gold: newGold,
      }
    })
  } catch (error) {
    console.error('Failed to run adventure:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 冒険ログを取得
game.get('/adventure-logs', async (c: Context) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const user = getUserFromToken(token)
  if (!user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const pool = getPool()
  try {
    const result = await pool.query(
      `SELECT * FROM adventure_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [user.userId]
    )

    return c.json(result.rows)
  } catch (error) {
    console.error('Failed to get adventure logs:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default game