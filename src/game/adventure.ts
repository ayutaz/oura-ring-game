import type { Character } from './character'
import type { OuraHealthData } from '@oura/types'
import { ItemDatabase } from './items.js'

export interface AdventureEvent {
  type: 'hidden_dungeon' | 'penalty' | 'boss_battle' | 'normal'
  name: string
  message: string
}

export interface AdventureItem {
  name: string
  type: 'magic' | 'equipment' | 'consumable'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface AdventureResult {
  events: AdventureEvent[]
  items: AdventureItem[]
  experienceMultiplier: number
  goldMultiplier: number
  treasureBoxes: number
  criticalSuccess: boolean
  baseExperience: number
  baseGold: number
  classBonus: {
    experience: number
    gold: number
  }
}

export class Adventure {
  morningAdventure(character: Character, healthData: OuraHealthData): AdventureResult {
    const result: AdventureResult = {
      events: [],
      items: [],
      experienceMultiplier: 1,
      goldMultiplier: 1,
      treasureBoxes: 0,
      criticalSuccess: false,
      baseExperience: 0,
      baseGold: 0,
      classBonus: { experience: 0, gold: 0 },
    }

    // 睡眠スコアによるイベント
    if (healthData.sleep.score >= 90) {
      result.events.push({
        type: 'hidden_dungeon',
        name: '夢幻の塔',
        message: '良質な睡眠により、隠しダンジョン「夢幻の塔」を発見！',
      })
      result.experienceMultiplier = 1.5
    } else if (healthData.sleep.score < 60) {
      result.events.push({
        type: 'penalty',
        name: 'モンスター奇襲',
        message: '寝不足により、モンスターに奇襲された！',
      })
      result.experienceMultiplier = 0.7
    }

    // レム睡眠によるアイテム
    if (healthData.sleep.contributors.rem_sleep >= 90) {
      result.items.push({
        name: '夢の結晶',
        type: 'magic',
        rarity: 'rare',
      })
    }

    return result
  }

  afternoonAdventure(character: Character, healthData: OuraHealthData): AdventureResult {
    const result: AdventureResult = {
      events: [],
      items: [],
      experienceMultiplier: 1,
      goldMultiplier: 1,
      treasureBoxes: 0,
      criticalSuccess: false,
      baseExperience: 0,
      baseGold: 0,
      classBonus: { experience: 0, gold: 0 },
    }

    // 歩数によるアイテムと報酬
    if (healthData.activity.steps >= 10000) {
      result.items.push({
        name: '冒険者のブーツ',
        type: 'equipment',
        rarity: 'rare',
      })
      result.goldMultiplier = 2
    }

    // 歩数による宝箱
    result.treasureBoxes = Math.floor(healthData.activity.steps / 2000)

    return result
  }

  eveningAdventure(character: Character, healthData: OuraHealthData): AdventureResult {
    const result: AdventureResult = {
      events: [],
      items: [],
      experienceMultiplier: 1,
      goldMultiplier: 1,
      treasureBoxes: 0,
      criticalSuccess: false,
      baseExperience: 0,
      baseGold: 0,
      classBonus: { experience: 0, gold: 0 },
    }

    // 全スコアが高い場合のボス戦
    if (
      healthData.sleep.score >= 80 &&
      healthData.activity.score >= 80 &&
      healthData.readiness.score >= 80
    ) {
      result.events.push({
        type: 'boss_battle',
        name: '健康の守護者',
        message: '準備万端！伝説のボス「健康の守護者」に挑戦！',
      })
    }

    // 準備度とHRVによるクリティカル
    if (healthData.readiness.score >= 90 && healthData.readiness.hrv_balance >= 85) {
      result.criticalSuccess = true
      result.experienceMultiplier = 2
      result.goldMultiplier = 2
    }

    return result
  }

  calculateRewards(character: Character, healthData: OuraHealthData): AdventureResult {
    const averageScore = (
      healthData.sleep.score +
      healthData.activity.score +
      healthData.readiness.score
    ) / 3

    const result: AdventureResult = {
      events: [],
      items: [],
      experienceMultiplier: 1,
      goldMultiplier: 1,
      treasureBoxes: 0,
      criticalSuccess: false,
      baseExperience: Math.floor(100 * (averageScore / 100)),
      baseGold: Math.floor(50 * (averageScore / 100)),
      classBonus: { experience: 0, gold: 0 },
    }

    // クラスボーナス
    if (character.getClass() === 'warrior') {
      result.classBonus.gold = 20
    } else if (character.getClass() === 'mage') {
      result.classBonus.experience = 30
    }

    return result
  }
}