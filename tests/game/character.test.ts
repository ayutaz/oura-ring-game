import { describe, it, expect } from 'vitest'
import { Character } from '@game/character'
import type { OuraHealthData } from '@oura/types'

describe('Character', () => {
  describe('ステータス計算', () => {
    it('睡眠スコアが高いほどMPが増加する', () => {
      // Arrange
      const healthData: OuraHealthData = {
        sleep: {
          score: 90,
          contributors: {
            deep_sleep: 85,
            efficiency: 92,
            latency: 88,
            rem_sleep: 90,
            restfulness: 87,
            timing: 91,
            total_sleep: 89,
          },
        },
        activity: {
          score: 0,
          steps: 0,
          active_calories: 0,
        },
        readiness: {
          score: 0,
          hrv_balance: 0,
          temperature_deviation: 0,
        },
      }
      
      // Act
      const character = new Character(healthData)
      const stats = character.getStats()
      
      // Assert
      expect(stats.mp).toBeGreaterThan(Character.BASE_STATS.mp)
      expect(stats.mp).toBe(Character.BASE_STATS.mp + Math.floor(90 * 1.5))
    })

    it('歩数が多いほど攻撃力が増加する', () => {
      // Arrange  
      const healthData: OuraHealthData = {
        sleep: {
          score: 0,
          contributors: {
            deep_sleep: 0,
            efficiency: 0,
            latency: 0,
            rem_sleep: 0,
            restfulness: 0,
            timing: 0,
            total_sleep: 0,
          },
        },
        activity: {
          score: 80,
          steps: 12000,
          active_calories: 400,
        },
        readiness: {
          score: 0,
          hrv_balance: 0,
          temperature_deviation: 0,
        },
      }
      
      // Act
      const character = new Character(healthData)
      const stats = character.getStats()
      
      // Assert
      expect(stats.attack).toBeGreaterThan(Character.BASE_STATS.attack)
      expect(stats.attack).toBe(
        Character.BASE_STATS.attack + 
        Math.floor(12000 / 500) + 
        Math.floor(400 / 50)
      )
    })

    it('準備度スコアが高いほどクリティカル率が増加する', () => {
      // Arrange
      const healthData: OuraHealthData = {
        sleep: {
          score: 0,
          contributors: {
            deep_sleep: 0,
            efficiency: 0,
            latency: 0,
            rem_sleep: 0,
            restfulness: 0,
            timing: 0,
            total_sleep: 0,
          },
        },
        activity: {
          score: 0,
          steps: 0,
          active_calories: 0,
        },
        readiness: {
          score: 85,
          hrv_balance: 80,
          temperature_deviation: -0.2,
        },
      }
      
      // Act
      const character = new Character(healthData)
      const stats = character.getStats()
      
      // Assert
      expect(stats.criticalRate).toBeGreaterThan(5) // base critical rate
      expect(stats.criticalRate).toBe(5 + Math.floor(80 * 0.2))
    })
  })

  describe('職業判定', () => {
    it('高活動量の場合は戦士になる', () => {
      // Arrange
      const healthData: OuraHealthData = {
        sleep: {
          score: 70,
          contributors: {
            deep_sleep: 70,
            efficiency: 70,
            latency: 70,
            rem_sleep: 70,
            restfulness: 70,
            timing: 70,
            total_sleep: 70,
          },
        },
        activity: {
          score: 95,
          steps: 15000,
          active_calories: 600,
        },
        readiness: {
          score: 75,
          hrv_balance: 70,
          temperature_deviation: 0,
        },
      }
      
      // Act
      const character = new Character(healthData)
      
      // Assert
      expect(character.getClass()).toBe('warrior')
    })

    it('高い睡眠スコアとレム睡眠の場合は魔法使いになる', () => {
      // Arrange
      const healthData: OuraHealthData = {
        sleep: {
          score: 95,
          contributors: {
            deep_sleep: 90,
            efficiency: 92,
            latency: 88,
            rem_sleep: 95,
            restfulness: 91,
            timing: 93,
            total_sleep: 90,
          },
        },
        activity: {
          score: 60,
          steps: 5000,
          active_calories: 200,
        },
        readiness: {
          score: 70,
          hrv_balance: 65,
          temperature_deviation: 0,
        },
      }
      
      // Act
      const character = new Character(healthData)
      
      // Assert
      expect(character.getClass()).toBe('mage')
    })
  })

  describe('レベルアップ', () => {
    it('経験値が閾値を超えるとレベルアップする', () => {
      // Arrange
      const healthData: OuraHealthData = {
        sleep: {
          score: 80,
          contributors: {
            deep_sleep: 80,
            efficiency: 80,
            latency: 80,
            rem_sleep: 80,
            restfulness: 80,
            timing: 80,
            total_sleep: 80,
          },
        },
        activity: {
          score: 80,
          steps: 10000,
          active_calories: 300,
        },
        readiness: {
          score: 80,
          hrv_balance: 75,
          temperature_deviation: 0,
        },
      }
      const character = new Character(healthData)
      const initialLevel = character.getLevel()
      
      // Act
      character.gainExperience(100) // レベル1→2の必要経験値
      
      // Assert
      expect(character.getLevel()).toBe(initialLevel + 1)
      expect(character.getExperience()).toBe(0) // 余剰経験値はリセット
    })
  })
})