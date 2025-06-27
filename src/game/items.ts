export interface Item {
  id: string
  name: string
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  description: string
  effects: ItemEffect[]
  value: number // 売却価格
}

export interface ItemEffect {
  stat: 'attack' | 'defense' | 'hp' | 'mp' | 'criticalRate'
  value: number
}

export class ItemDatabase {
  private static items: Map<string, Item> = new Map([
    // 武器
    ['wooden_sword', {
      id: 'wooden_sword',
      name: '木の剣',
      type: 'weapon',
      rarity: 'common',
      description: '初心者用の木製の剣',
      effects: [{ stat: 'attack', value: 5 }],
      value: 10,
    }],
    ['iron_sword', {
      id: 'iron_sword',
      name: '鉄の剣',
      type: 'weapon',
      rarity: 'uncommon',
      description: 'しっかりとした鉄製の剣',
      effects: [{ stat: 'attack', value: 10 }],
      value: 50,
    }],
    ['sleep_blade', {
      id: 'sleep_blade',
      name: '夢見の刃',
      type: 'weapon',
      rarity: 'rare',
      description: '良質な睡眠から力を得る神秘的な剣',
      effects: [
        { stat: 'attack', value: 15 },
        { stat: 'mp', value: 20 },
      ],
      value: 200,
    }],
    
    // 防具
    ['leather_armor', {
      id: 'leather_armor',
      name: '革の鎧',
      type: 'armor',
      rarity: 'common',
      description: '軽くて動きやすい革製の鎧',
      effects: [{ stat: 'defense', value: 5 }],
      value: 15,
    }],
    ['iron_armor', {
      id: 'iron_armor',
      name: '鉄の鎧',
      type: 'armor',
      rarity: 'uncommon',
      description: '頑丈な鉄製の鎧',
      effects: [{ stat: 'defense', value: 10 }],
      value: 60,
    }],
    ['vitality_plate', {
      id: 'vitality_plate',
      name: '活力の胸当て',
      type: 'armor',
      rarity: 'rare',
      description: '装着者の活動量に応じて防御力が上昇する',
      effects: [
        { stat: 'defense', value: 15 },
        { stat: 'hp', value: 30 },
      ],
      value: 250,
    }],
    
    // アクセサリー
    ['health_ring', {
      id: 'health_ring',
      name: '健康の指輪',
      type: 'accessory',
      rarity: 'uncommon',
      description: '装着者の健康状態を向上させる',
      effects: [
        { stat: 'hp', value: 20 },
        { stat: 'mp', value: 10 },
      ],
      value: 80,
    }],
    ['critical_charm', {
      id: 'critical_charm',
      name: 'クリティカルチャーム',
      type: 'accessory',
      rarity: 'rare',
      description: 'クリティカル率を上昇させる魔法のお守り',
      effects: [{ stat: 'criticalRate', value: 10 }],
      value: 150,
    }],
    
    // 消耗品
    ['health_potion', {
      id: 'health_potion',
      name: 'ヘルスポーション',
      type: 'consumable',
      rarity: 'common',
      description: 'HPを50回復する',
      effects: [{ stat: 'hp', value: 50 }],
      value: 20,
    }],
    ['mana_potion', {
      id: 'mana_potion',
      name: 'マナポーション',
      type: 'consumable',
      rarity: 'common',
      description: 'MPを30回復する',
      effects: [{ stat: 'mp', value: 30 }],
      value: 25,
    }],
    
    // 素材
    ['monster_fang', {
      id: 'monster_fang',
      name: 'モンスターの牙',
      type: 'material',
      rarity: 'common',
      description: '武器の強化に使用できる',
      effects: [],
      value: 5,
    }],
    ['crystal_shard', {
      id: 'crystal_shard',
      name: 'クリスタルの欠片',
      type: 'material',
      rarity: 'uncommon',
      description: '魔法のアイテムの材料',
      effects: [],
      value: 30,
    }],
  ])
  
  static getItem(id: string): Item | undefined {
    return this.items.get(id)
  }
  
  static getRandomItem(rarity?: string): Item {
    const itemArray = Array.from(this.items.values())
    const filteredItems = rarity 
      ? itemArray.filter(item => item.rarity === rarity)
      : itemArray
      
    const randomIndex = Math.floor(Math.random() * filteredItems.length)
    return filteredItems[randomIndex]
  }
  
  static getItemsByType(type: string): Item[] {
    return Array.from(this.items.values()).filter(item => item.type === type)
  }
  
  static getDropForAdventure(adventureType: string, healthScore: number): Item | null {
    // 健康スコアに基づいてレアリティを決定
    let rarityChance = Math.random() * 100
    let rarity: string
    
    if (healthScore >= 90) {
      // 高い健康スコアでレア度アップ
      if (rarityChance < 5) rarity = 'legendary'
      else if (rarityChance < 15) rarity = 'epic'
      else if (rarityChance < 35) rarity = 'rare'
      else if (rarityChance < 60) rarity = 'uncommon'
      else rarity = 'common'
    } else if (healthScore >= 70) {
      if (rarityChance < 2) rarity = 'epic'
      else if (rarityChance < 10) rarity = 'rare'
      else if (rarityChance < 40) rarity = 'uncommon'
      else rarity = 'common'
    } else {
      if (rarityChance < 5) rarity = 'rare'
      else if (rarityChance < 25) rarity = 'uncommon'
      else rarity = 'common'
    }
    
    // ドロップ確率（30%）
    if (Math.random() > 0.3) {
      return null
    }
    
    return this.getRandomItem(rarity)
  }
}