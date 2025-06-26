// Oura API統合の実装例

// types/oura.ts - Oura APIのレスポンス型定義
export interface OuraDailySleep {
  id: string;
  day: string;
  score: number;
  contributors: {
    deep_sleep: number;
    efficiency: number;
    latency: number;
    rem_sleep: number;
    restfulness: number;
    timing: number;
    total_sleep: number;
  };
  timestamp: string;
}

export interface OuraDailyActivity {
  id: string;
  day: string;
  score: number;
  active_calories: number;
  steps: number;
  contributors: {
    meet_daily_targets: number;
    move_every_hour: number;
    recovery_time: number;
    stay_active: number;
    training_frequency: number;
    training_volume: number;
  };
}

export interface OuraDailyReadiness {
  id: string;
  day: string;
  score: number;
  temperature_deviation: number;
  contributors: {
    activity_balance: number;
    body_temperature: number;
    hrv_balance: number;
    previous_day_activity: number;
    previous_night: number;
    recovery_index: number;
    resting_heart_rate: number;
    sleep_balance: number;
  };
}

// services/oura-client.ts - Oura APIクライアント
export class OuraClient {
  private baseUrl = 'https://api.ouraring.com/v2/usercollection';
  
  constructor(private accessToken: string) {}

  private async fetchData<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Oura API error: ${response.status}`);
    }

    return response.json();
  }

  async getDailySleep(startDate: string, endDate: string): Promise<OuraDailySleep[]> {
    const data = await this.fetchData<{ data: OuraDailySleep[] }>('daily_sleep', {
      start_date: startDate,
      end_date: endDate,
    });
    return data.data;
  }

  async getDailyActivity(startDate: string, endDate: string): Promise<OuraDailyActivity[]> {
    const data = await this.fetchData<{ data: OuraDailyActivity[] }>('daily_activity', {
      start_date: startDate,
      end_date: endDate,
    });
    return data.data;
  }

  async getDailyReadiness(startDate: string, endDate: string): Promise<OuraDailyReadiness[]> {
    const data = await this.fetchData<{ data: OuraDailyReadiness[] }>('daily_readiness', {
      start_date: startDate,
      end_date: endDate,
    });
    return data.data;
  }
}

// services/character-calculator.ts - キャラクターステータス計算
export interface CharacterStats {
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  speed: number;
  luck: number;
  criticalRate: number;
  magicPower: number;
}

export interface HealthMetrics {
  sleep: OuraDailySleep;
  activity: OuraDailyActivity;
  readiness: OuraDailyReadiness;
}

export class CharacterCalculator {
  private readonly BASE_STATS = {
    hp: 100,
    mp: 50,
    attack: 10,
    defense: 10,
    speed: 10,
    luck: 5,
  };

  calculateStats(metrics: HealthMetrics): CharacterStats {
    const { sleep, activity, readiness } = metrics;

    // HP: 活動量に基づく
    const hp = this.BASE_STATS.hp + 
      (activity.score * 2) + 
      (activity.steps / 100);

    // MP: 睡眠の質に基づく
    const mp = this.BASE_STATS.mp + 
      (sleep.score * 1.5) + 
      (sleep.contributors.rem_sleep * 10);

    // 攻撃力: 活動カロリーと歩数に基づく
    const attack = this.BASE_STATS.attack + 
      Math.floor(activity.active_calories / 50) + 
      Math.floor(activity.steps / 500);

    // 防御力: 回復指標に基づく
    const defense = this.BASE_STATS.defense + 
      (readiness.contributors.recovery_index * 5) +
      (readiness.contributors.resting_heart_rate * 3);

    // 素早さ: 準備度スコアに基づく
    const speed = this.BASE_STATS.speed + 
      (readiness.score * 0.3) +
      (activity.contributors.move_every_hour * 2);

    // 運: 体温変動とHRVバランスに基づく
    const luck = this.BASE_STATS.luck + 
      Math.abs(readiness.temperature_deviation * 2) +
      (readiness.contributors.hrv_balance * 0.5);

    // クリティカル率: HRVバランスに基づく
    const criticalRate = 5 + (readiness.contributors.hrv_balance * 0.2);

    // 魔力: 深い睡眠に基づく
    const magicPower = 10 + 
      (sleep.contributors.deep_sleep * 5) +
      (sleep.contributors.efficiency * 3);

    return {
      hp: Math.round(hp),
      mp: Math.round(mp),
      attack: Math.round(attack),
      defense: Math.round(defense),
      speed: Math.round(speed),
      luck: Math.round(luck),
      criticalRate: Math.round(criticalRate),
      magicPower: Math.round(magicPower),
    };
  }

  determineClass(metrics: HealthMetrics): string {
    const { sleep, activity, readiness } = metrics;

    // 職業判定ロジック
    const activityScore = activity.score + activity.steps / 1000;
    const sleepScore = sleep.score + sleep.contributors.rem_sleep * 10;
    const balanceScore = readiness.score + readiness.contributors.hrv_balance * 10;

    const scores = {
      warrior: activityScore * 1.5,
      mage: sleepScore * 1.5,
      priest: balanceScore * 1.5,
      rogue: (activity.steps / 100) + (activity.contributors.move_every_hour * 20),
    };

    // 最も高いスコアの職業を返す
    return Object.entries(scores).reduce((a, b) => 
      scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
    )[0];
  }
}

// game/adventure-engine.ts - 自動冒険エンジン
export interface AdventureResult {
  experience: number;
  gold: number;
  items: string[];
  encounters: string[];
}

export class AdventureEngine {
  generateAdventure(stats: CharacterStats, healthMetrics: HealthMetrics): AdventureResult {
    const { sleep, activity, readiness } = healthMetrics;
    
    // 冒険の成功度を計算
    const successRate = (
      (readiness.score / 100) * 0.4 +
      (sleep.score / 100) * 0.3 +
      (activity.score / 100) * 0.3
    );

    // 基本報酬
    let experience = 100 * successRate;
    let gold = 50 * successRate;
    const items: string[] = [];
    const encounters: string[] = [];

    // 朝の冒険（睡眠データベース）
    if (sleep.score > 85) {
      experience *= 1.5;
      items.push('夢の結晶');
      encounters.push('良質な睡眠により、隠しダンジョン「夢幻の塔」を発見！');
    } else if (sleep.score < 60) {
      experience *= 0.7;
      encounters.push('寝不足により、モンスターに奇襲された！');
    }

    // 昼の冒険（活動データベース）
    if (activity.steps > 10000) {
      gold *= 2;
      items.push('冒険者のブーツ');
      encounters.push(`${activity.steps}歩の大冒険！レアアイテムを発見！`);
    }
    
    // クリティカルイベント
    if (Math.random() * 100 < stats.criticalRate) {
      experience *= 2;
      gold *= 2;
      encounters.push('クリティカルヒット！大成功の冒険！');
    }

    return {
      experience: Math.round(experience),
      gold: Math.round(gold),
      items,
      encounters,
    };
  }
}

// 使用例
async function syncAndUpdateCharacter(userId: string, accessToken: string) {
  const ouraClient = new OuraClient(accessToken);
  const calculator = new CharacterCalculator();
  const adventureEngine = new AdventureEngine();

  // 今日の日付を取得
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Ouraデータを取得
    const [sleep, activity, readiness] = await Promise.all([
      ouraClient.getDailySleep(today, today),
      ouraClient.getDailyActivity(today, today),
      ouraClient.getDailyReadiness(today, today),
    ]);

    if (sleep[0] && activity[0] && readiness[0]) {
      const healthMetrics = {
        sleep: sleep[0],
        activity: activity[0],
        readiness: readiness[0],
      };

      // キャラクターステータスを計算
      const stats = calculator.calculateStats(healthMetrics);
      const characterClass = calculator.determineClass(healthMetrics);

      // 自動冒険を実行
      const adventureResult = adventureEngine.generateAdventure(stats, healthMetrics);

      // 結果を保存（実際の実装ではDBに保存）
      console.log('Character Stats:', stats);
      console.log('Character Class:', characterClass);
      console.log('Adventure Result:', adventureResult);

      return {
        stats,
        class: characterClass,
        adventure: adventureResult,
      };
    }
  } catch (error) {
    console.error('Failed to sync Oura data:', error);
    throw error;
  }
}