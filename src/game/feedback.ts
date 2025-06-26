import type { OuraHealthData } from '@oura/types'

export enum FeedbackType {
  IMMEDIATE = 'immediate',
  DAILY_SUMMARY = 'daily_summary',
  MILESTONE = 'milestone',
  STREAK = 'streak',
  COMEBACK = 'comeback',
  EPIC_MOMENT = 'epic_moment',
}

export enum FeedbackTiming {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  REALTIME = 'realtime',
}

export interface Feedback {
  type: FeedbackType
  timing?: FeedbackTiming
  visual?: string
  audio?: string
  message?: string
  duration?: number
  particleEffect?: boolean
  rewards?: Array<{ type: string; amount?: number }>
  debuffs?: Array<{ type: string; duration: string }>
  progressBar?: boolean
  progressPercentage?: number
  reward?: string
  celebration?: boolean
  adventureDigest?: {
    duration: string
    highlights: any[]
  }
  suggestions?: Array<{
    type: string
    reason: string
    recommendation: string
  }>
  bonus?: any
  encouragement?: boolean
  compensation?: {
    type: string
  }
  humor?: string
  badge?: string
  intensity?: string
  screenEffect?: string
  sharePrompt?: boolean
}

export class FeedbackSystem {
  onStepsUpdate(previousSteps: number, currentSteps: number): Feedback {
    if (currentSteps > previousSteps) {
      return {
        type: FeedbackType.IMMEDIATE,
        visual: 'coin_sparkle',
        audio: 'coin_collect',
        duration: 1500,
      }
    }
    return { type: FeedbackType.IMMEDIATE }
  }

  onSleepDataSync(sleepData: OuraHealthData['sleep']): Feedback {
    const mpGain = Math.floor(sleepData.score * 1.5)
    return {
      type: FeedbackType.IMMEDIATE,
      visual: 'level_up_effect',
      message: `MP +${mpGain}回復！`,
      duration: 2000,
    }
  }

  onHeartRateUpdate(heartRateData: { bpm: number; isStable: boolean; hrv: number }): Feedback {
    if (heartRateData.isStable) {
      return {
        type: FeedbackType.IMMEDIATE,
        visual: 'aura_effect',
        particleEffect: true,
        duration: 3000,
      }
    }
    return { type: FeedbackType.IMMEDIATE }
  }

  getMorningFeedback(morningData: OuraHealthData): Feedback {
    const feedback: Feedback = {
      type: FeedbackType.DAILY_SUMMARY,
      timing: FeedbackTiming.MORNING,
    }

    if (morningData.sleep.score >= 90) {
      feedback.visual = 'legendary_rest'
      feedback.message = '伝説の休息！'
      feedback.rewards = [{
        type: 'mp_recovery',
        amount: Math.floor(morningData.sleep.score * 2),
      }]
    } else if (morningData.sleep.score < 70) {
      feedback.visual = 'nightmare'
      feedback.message = '悪夢にうなされた...'
      feedback.debuffs = [{
        type: 'mp_penalty',
        duration: 'until_noon',
      }]
    } else {
      feedback.visual = 'normal_rest'
      feedback.message = '良い夢を見たようだ'
    }

    return feedback
  }

  getAfternoonFeedback(currentSteps: number, targetSteps: number): Feedback {
    const percentage = (currentSteps / targetSteps) * 100
    const remaining = targetSteps - currentSteps

    return {
      type: FeedbackType.DAILY_SUMMARY,
      timing: FeedbackTiming.AFTERNOON,
      progressBar: true,
      progressPercentage: Math.min(percentage, 100),
      message: remaining > 0 
        ? `あと${remaining}歩で レア宝箱 が出現！`
        : '目標達成！レア宝箱をゲット！',
    }
  }

  checkMilestone(steps: number, milestones: Array<{ steps: number; reward: string }>): Feedback {
    const achieved = milestones.find(m => m.steps === steps)
    
    if (achieved) {
      return {
        type: FeedbackType.MILESTONE,
        visual: 'milestone_achieved',
        reward: achieved.reward,
        celebration: true,
      }
    }

    return { type: FeedbackType.IMMEDIATE }
  }

  getEveningFeedback(dailyData: OuraHealthData): Feedback {
    const feedback: Feedback = {
      type: FeedbackType.DAILY_SUMMARY,
      timing: FeedbackTiming.EVENING,
      adventureDigest: {
        duration: '3-5min',
        highlights: [
          `睡眠スコア: ${dailyData.sleep.score}`,
          `歩数: ${dailyData.activity.steps}`,
          `準備度: ${dailyData.readiness.score}`,
        ],
      },
      suggestions: [],
    }

    if (dailyData.sleep.score < 75) {
      feedback.suggestions!.push({
        type: 'equipment_change',
        reason: 'low_sleep_score',
        recommendation: '回復の指輪を装備して睡眠の質を改善しましょう',
      })
    }

    return feedback
  }

  checkLoginStreak(streakData: { currentStreak: number; bestStreak: number; lastLogin: Date }): Feedback {
    if (streakData.currentStreak === 0) {
      return {
        type: FeedbackType.COMEBACK,
        bonus: { type: 'comeback_bonus', amount: 100 },
        message: '再出発ボーナス！また一緒に冒険しましょう',
        encouragement: true,
      }
    }

    if (streakData.currentStreak % 3 === 0) {
      return {
        type: FeedbackType.STREAK,
        reward: { type: 'streak_reward', day: streakData.currentStreak },
        message: `${streakData.currentStreak}日連続ログイン達成！`,
        visual: 'streak_celebration',
      }
    }

    return { type: FeedbackType.IMMEDIATE }
  }

  handleNegativeEvent(event: { type: string; severity: string }): Feedback {
    return {
      type: FeedbackType.IMMEDIATE,
      compensation: {
        type: 'recovery_spring',
      },
      humor: 'たまには休むことも大切！',
      badge: 'なまけ者の日',
    }
  }

  onRareItemDrop(event: { itemName: string; rarity: string; dropRate: number }): Feedback {
    return {
      type: FeedbackType.EPIC_MOMENT,
      intensity: 'maximum',
      screenEffect: 'full_screen_flash',
      duration: 7000,
      sharePrompt: true,
      message: `${event.itemName}を獲得！（ドロップ率: ${event.dropRate * 100}%）`,
    }
  }
}