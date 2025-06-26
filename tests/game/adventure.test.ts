import { describe, it, expect, beforeEach } from 'vitest'
import { Adventure, AdventureResult } from '@game/adventure'
import { Character } from '@game/character'
import type { OuraHealthData } from '@oura/types'

describe('Adventure', () => {
  let healthData: OuraHealthData

  beforeEach(() => {
    healthData = {
      sleep: {
        score: 80,
        contributors: {
          deep_sleep: 80,
          efficiency: 85,
          latency: 75,
          rem_sleep: 82,
          restfulness: 78,
          timing: 80,
          total_sleep: 85,
        },
      },
      activity: {
        score: 75,
        steps: 8000,
        active_calories: 300,
      },
      readiness: {
        score: 82,
        hrv_balance: 75,
        temperature_deviation: -0.1,
      },
    }
  })

  describe('朝の冒険（睡眠ベース）', () => {
    it('睡眠スコア90以上で隠しダンジョンが出現する', () => {
      // Arrange
      healthData.sleep.score = 92
      const character = new Character(healthData)
      const adventure = new Adventure()
      
      // Act
      const result = adventure.morningAdventure(character, healthData)
      
      // Assert
      expect(result.events).toContainEqual({
        type: 'hidden_dungeon',
        name: '夢幻の塔',
        message: '良質な睡眠により、隠しダンジョン「夢幻の塔」を発見！',
      })
      expect(result.experienceMultiplier).toBeGreaterThanOrEqual(1.5)
    })

    it('睡眠スコア60未満でペナルティイベントが発生する', () => {
      // Arrange
      healthData.sleep.score = 55
      const character = new Character(healthData)
      const adventure = new Adventure()
      
      // Act
      const result = adventure.morningAdventure(character, healthData)
      
      // Assert
      expect(result.events).toContainEqual({
        type: 'penalty',
        name: 'モンスター奇襲',
        message: '寝不足により、モンスターに奇襲された！',
      })
      expect(result.experienceMultiplier).toBeLessThan(1)
    })

    it('レム睡眠が高いと魔法アイテムを獲得する', () => {
      // Arrange
      healthData.sleep.contributors.rem_sleep = 90
      const character = new Character(healthData)
      const adventure = new Adventure()
      
      // Act
      const result = adventure.morningAdventure(character, healthData)
      
      // Assert
      expect(result.items).toContainEqual({
        name: '夢の結晶',
        type: 'magic',
        rarity: 'rare',
      })
    })
  })

  describe('昼の冒険（活動ベース）', () => {
    it('歩数10000以上でレアアイテムを獲得する', () => {
      // Arrange
      healthData.activity.steps = 12000
      const character = new Character(healthData)
      const adventure = new Adventure()
      
      // Act
      const result = adventure.afternoonAdventure(character, healthData)
      
      // Assert
      expect(result.items).toContainEqual({
        name: '冒険者のブーツ',
        type: 'equipment',
        rarity: 'rare',
      })
      expect(result.goldMultiplier).toBeGreaterThanOrEqual(2)
    })

    it('歩数に応じて宝箱が出現する', () => {
      // Arrange
      const character = new Character(healthData)
      const adventure = new Adventure()
      
      // Act
      const result = adventure.afternoonAdventure(character, healthData)
      
      // Assert
      const treasureCount = Math.floor(healthData.activity.steps / 2000)
      expect(result.treasureBoxes).toBe(treasureCount)
    })
  })

  describe('夕方の冒険（総合ベース）', () => {
    it('全てのスコアが80以上でボス戦が発生する', () => {
      // Arrange
      healthData.sleep.score = 85
      healthData.activity.score = 82
      healthData.readiness.score = 88
      const character = new Character(healthData)
      const adventure = new Adventure()
      
      // Act
      const result = adventure.eveningAdventure(character, healthData)
      
      // Assert
      expect(result.events).toContainEqual({
        type: 'boss_battle',
        name: '健康の守護者',
        message: '準備万端！伝説のボス「健康の守護者」に挑戦！',
      })
    })

    it('準備度とHRVバランスが高いとクリティカル成功する', () => {
      // Arrange
      healthData.readiness.score = 90
      healthData.readiness.hrv_balance = 85
      const character = new Character(healthData)
      const adventure = new Adventure()
      
      // Act
      const result = adventure.eveningAdventure(character, healthData)
      
      // Assert
      expect(result.criticalSuccess).toBe(true)
      expect(result.experienceMultiplier).toBeGreaterThanOrEqual(2)
      expect(result.goldMultiplier).toBeGreaterThanOrEqual(2)
    })
  })

  describe('報酬計算', () => {
    it('基本報酬は健康スコアの平均に比例する', () => {
      // Arrange
      const character = new Character(healthData)
      const adventure = new Adventure()
      
      // Act
      const result = adventure.calculateRewards(character, healthData)
      
      // Assert
      const averageScore = (
        healthData.sleep.score + 
        healthData.activity.score + 
        healthData.readiness.score
      ) / 3
      
      expect(result.baseExperience).toBe(Math.floor(100 * (averageScore / 100)))
      expect(result.baseGold).toBe(Math.floor(50 * (averageScore / 100)))
    })

    it('キャラクターのクラスによってボーナスが変わる', () => {
      // Arrange
      const warriorData: OuraHealthData = {
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
      
      const mageData: OuraHealthData = {
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
      
      const warrior = new Character(warriorData)
      const mage = new Character(mageData)
      const adventure = new Adventure()
      
      // Act
      const warriorResult = adventure.calculateRewards(warrior, warriorData)
      const mageResult = adventure.calculateRewards(mage, mageData)
      
      // Assert
      expect(warrior.getClass()).toBe('warrior')
      expect(warriorResult.classBonus.gold).toBeGreaterThan(0)
      
      expect(mage.getClass()).toBe('mage')
      expect(mageResult.classBonus.experience).toBeGreaterThan(0)
    })
  })
})