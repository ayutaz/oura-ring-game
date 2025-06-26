export interface OuraSleepData {
  score: number
  contributors: {
    deep_sleep: number
    efficiency: number
    latency: number
    rem_sleep: number
    restfulness: number
    timing: number
    total_sleep: number
  }
}

export interface OuraActivityData {
  score: number
  steps: number
  active_calories: number
}

export interface OuraReadinessData {
  score: number
  hrv_balance: number
  temperature_deviation: number
}

export interface OuraHealthData {
  sleep: OuraSleepData
  activity: OuraActivityData
  readiness: OuraReadinessData
}