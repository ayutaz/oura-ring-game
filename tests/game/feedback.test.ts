import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FeedbackSystem, FeedbackType, FeedbackTiming } from '@game/feedback'
import type { OuraHealthData } from '@oura/types'

describe('FeedbackSystem', () => {
  let feedbackSystem: FeedbackSystem

  beforeEach(() => {
    feedbackSystem = new FeedbackSystem()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('即時フィードバック（0-3秒）', () => {
    it('歩数増加時にコイン獲得音を再生する', () => {
      // Arrange
      const previousSteps = 5000
      const currentSteps = 5100
      
      // Act
      const feedback = feedbackSystem.onStepsUpdate(previousSteps, currentSteps)
      
      // Assert
      expect(feedback.type).toBe(FeedbackType.IMMEDIATE)
      expect(feedback.visual).toBe('coin_sparkle')
      expect(feedback.audio).toBe('coin_collect')
      expect(feedback.duration).toBeLessThanOrEqual(3000)
    })

    it('睡眠データ同期時にレベルアップ演出を表示する', () => {
      // Arrange
      const sleepData: OuraHealthData['sleep'] = {
        score: 90,
        contributors: {
          deep_sleep: 88,
          efficiency: 92,
          latency: 85,
          rem_sleep: 91,
          restfulness: 89,
          timing: 90,
          total_sleep: 88,
        },
      }
      
      // Act
      const feedback = feedbackSystem.onSleepDataSync(sleepData)
      
      // Assert
      expect(feedback.type).toBe(FeedbackType.IMMEDIATE)
      expect(feedback.visual).toContain('level_up')
      expect(feedback.message).toContain('MP')
    })

    it('心拍数安定時にオーラエフェクトを表示する', () => {
      // Arrange
      const heartRateData = {
        bpm: 60,
        isStable: true,
        hrv: 45,
      }
      
      // Act
      const feedback = feedbackSystem.onHeartRateUpdate(heartRateData)
      
      // Assert
      expect(feedback.type).toBe(FeedbackType.IMMEDIATE)
      expect(feedback.visual).toBe('aura_effect')
      expect(feedback.particleEffect).toBe(true)
    })
  })

  describe('朝のフィードバック（6:00）', () => {
    it('睡眠スコア90以上でキラキラエフェクトを表示する', () => {
      // Arrange
      const morningData: OuraHealthData = {
        sleep: {
          score: 92,
          contributors: {
            deep_sleep: 90,
            efficiency: 93,
            latency: 88,
            rem_sleep: 92,
            restfulness: 91,
            timing: 92,
            total_sleep: 90,
          },
        },
        activity: { score: 0, steps: 0, active_calories: 0 },
        readiness: { score: 0, hrv_balance: 0, temperature_deviation: 0 },
      }
      
      // Act
      const feedback = feedbackSystem.getMorningFeedback(morningData)
      
      // Assert
      expect(feedback.timing).toBe(FeedbackTiming.MORNING)
      expect(feedback.visual).toBe('legendary_rest')
      expect(feedback.message).toBe('伝説の休息！')
      expect(feedback.rewards).toContainEqual({
        type: 'mp_recovery',
        amount: expect.any(Number),
      })
    })

    it('睡眠スコア70未満で薄暗い演出を表示する', () => {
      // Arrange
      const morningData: OuraHealthData = {
        sleep: {
          score: 65,
          contributors: {
            deep_sleep: 60,
            efficiency: 65,
            latency: 70,
            rem_sleep: 62,
            restfulness: 68,
            timing: 65,
            total_sleep: 60,
          },
        },
        activity: { score: 0, steps: 0, active_calories: 0 },
        readiness: { score: 0, hrv_balance: 0, temperature_deviation: 0 },
      }
      
      // Act
      const feedback = feedbackSystem.getMorningFeedback(morningData)
      
      // Assert
      expect(feedback.visual).toBe('nightmare')
      expect(feedback.message).toBe('悪夢にうなされた...')
      expect(feedback.debuffs).toContainEqual({
        type: 'mp_penalty',
        duration: 'until_noon',
      })
    })
  })

  describe('昼のフィードバック（12:00）', () => {
    it('目標歩数に近づくとプログレスバーを表示する', () => {
      // Arrange
      const currentSteps = 8000
      const targetSteps = 10000
      
      // Act
      const feedback = feedbackSystem.getAfternoonFeedback(currentSteps, targetSteps)
      
      // Assert
      expect(feedback.timing).toBe(FeedbackTiming.AFTERNOON)
      expect(feedback.progressBar).toBe(true)
      expect(feedback.progressPercentage).toBe(80)
      expect(feedback.message).toBe('あと2000歩で レア宝箱 が出現！')
    })

    it('マイルストーン達成時に特別演出を表示する', () => {
      // Arrange
      const milestones = [
        { steps: 5000, reward: 'bronze_chest' },
        { steps: 10000, reward: 'silver_chest' },
        { steps: 15000, reward: 'gold_chest' },
      ]
      
      // Act
      const feedback = feedbackSystem.checkMilestone(10000, milestones)
      
      // Assert
      expect(feedback.type).toBe(FeedbackType.MILESTONE)
      expect(feedback.visual).toBe('milestone_achieved')
      expect(feedback.reward).toBe('silver_chest')
      expect(feedback.celebration).toBe(true)
    })
  })

  describe('夕方のフィードバック（18:00）', () => {
    it('1日の冒険ダイジェストを生成する', () => {
      // Arrange
      const dailyData: OuraHealthData = {
        sleep: { score: 85, contributors: {} as any },
        activity: { score: 80, steps: 12000, active_calories: 400 },
        readiness: { score: 82, hrv_balance: 78, temperature_deviation: -0.1 },
      }
      
      // Act
      const feedback = feedbackSystem.getEveningFeedback(dailyData)
      
      // Assert
      expect(feedback.timing).toBe(FeedbackTiming.EVENING)
      expect(feedback.type).toBe(FeedbackType.DAILY_SUMMARY)
      expect(feedback.adventureDigest).toBeDefined()
      expect(feedback.adventureDigest.duration).toBe('3-5min')
      expect(feedback.adventureDigest.highlights.length).toBeGreaterThan(0)
    })

    it('明日への装備変更提案を含む', () => {
      // Arrange
      const dailyData: OuraHealthData = {
        sleep: { score: 70, contributors: {} as any },
        activity: { score: 85, steps: 8000, active_calories: 300 },
        readiness: { score: 75, hrv_balance: 70, temperature_deviation: 0.2 },
      }
      
      // Act
      const feedback = feedbackSystem.getEveningFeedback(dailyData)
      
      // Assert
      expect(feedback.suggestions).toBeDefined()
      expect(feedback.suggestions).toContainEqual({
        type: 'equipment_change',
        reason: 'low_sleep_score',
        recommendation: expect.any(String),
      })
    })
  })

  describe('連続記録フィードバック', () => {
    it('3日連続ログインで特別報酬を表示する', () => {
      // Arrange
      const streakData = {
        currentStreak: 3,
        bestStreak: 5,
        lastLogin: new Date(),
      }
      
      // Act
      const feedback = feedbackSystem.checkLoginStreak(streakData)
      
      // Assert
      expect(feedback.type).toBe(FeedbackType.STREAK)
      expect(feedback.reward).toBeDefined()
      expect(feedback.message).toContain('3日連続')
      expect(feedback.visual).toBe('streak_celebration')
    })

    it('連続記録が途切れた場合に再出発ボーナスを提供する', () => {
      // Arrange
      const streakData = {
        currentStreak: 0,
        bestStreak: 10,
        lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2日前
      }
      
      // Act
      const feedback = feedbackSystem.checkLoginStreak(streakData)
      
      // Assert
      expect(feedback.type).toBe(FeedbackType.COMEBACK)
      expect(feedback.bonus).toBeDefined()
      expect(feedback.message).toContain('再出発')
      expect(feedback.encouragement).toBe(true)
    })
  })

  describe('感情曲線の管理', () => {
    it('ネガティブイベント後にポジティブ補正を行う', () => {
      // Arrange
      const negativeEvent = {
        type: 'sleep_penalty',
        severity: 'medium',
      }
      
      // Act
      const feedback = feedbackSystem.handleNegativeEvent(negativeEvent)
      
      // Assert
      expect(feedback.compensation).toBeDefined()
      expect(feedback.compensation.type).toBe('recovery_spring')
      expect(feedback.humor).toBeDefined()
      expect(feedback.badge).toBe('なまけ者の日')
    })

    it('レアアイテム獲得時に興奮度を最大化する', () => {
      // Arrange
      const rareItemEvent = {
        itemName: '伝説の剣',
        rarity: 'legendary',
        dropRate: 0.01,
      }
      
      // Act
      const feedback = feedbackSystem.onRareItemDrop(rareItemEvent)
      
      // Assert
      expect(feedback.type).toBe(FeedbackType.EPIC_MOMENT)
      expect(feedback.intensity).toBe('maximum')
      expect(feedback.screenEffect).toBe('full_screen_flash')
      expect(feedback.duration).toBeGreaterThan(5000)
      expect(feedback.sharePrompt).toBe(true)
    })
  })
})