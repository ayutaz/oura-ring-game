import type { OuraHealthData } from '@oura/types'

export interface CharacterStats {
  hp: number
  mp: number
  attack: number
  defense: number
  speed: number
  luck: number
  criticalRate: number
}

export class Character {
  static readonly BASE_STATS = {
    hp: 100,
    mp: 50,
    attack: 10,
    defense: 10,
    speed: 10,
    luck: 5,
  }

  private level: number = 1
  private experience: number = 0
  private readonly experiencePerLevel: number = 100

  constructor(private healthData: OuraHealthData) {}

  getStats(): CharacterStats {
    const { sleep, activity, readiness } = this.healthData

    return {
      hp: Character.BASE_STATS.hp,
      mp: Character.BASE_STATS.mp + Math.floor(sleep.score * 1.5),
      attack: Character.BASE_STATS.attack + 
        Math.floor(activity.steps / 500) + 
        Math.floor(activity.active_calories / 50),
      defense: Character.BASE_STATS.defense,
      speed: Character.BASE_STATS.speed,
      luck: Character.BASE_STATS.luck,
      criticalRate: 5 + Math.floor(readiness.hrv_balance * 0.2),
    }
  }

  getClass(): string {
    const { sleep, activity } = this.healthData

    const activityScore = activity.score + activity.steps / 1000
    const sleepScore = sleep.score + sleep.contributors.rem_sleep * 0.1

    if (activityScore > sleepScore) {
      return 'warrior'
    }
    return 'mage'
  }

  getLevel(): number {
    return this.level
  }

  getExperience(): number {
    return this.experience
  }

  gainExperience(amount: number): void {
    this.experience += amount
    if (this.experience >= this.experiencePerLevel) {
      this.level++
      this.experience = 0
    }
  }
}