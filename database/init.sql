-- Oura Quest プロトタイプ用データベーススキーマ

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    oura_user_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Oura認証トークン
CREATE TABLE IF NOT EXISTS oura_tokens (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- キャラクター情報
CREATE TABLE IF NOT EXISTS characters (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    experience INTEGER DEFAULT 0 CHECK (experience >= 0),
    total_gold INTEGER DEFAULT 0 CHECK (total_gold >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 日次健康データキャッシュ
CREATE TABLE IF NOT EXISTS daily_health_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sleep_score INTEGER CHECK (sleep_score >= 0 AND sleep_score <= 100),
    sleep_duration INTEGER, -- 分単位
    activity_score INTEGER CHECK (activity_score >= 0 AND activity_score <= 100),
    steps INTEGER CHECK (steps >= 0),
    active_calories INTEGER CHECK (active_calories >= 0),
    readiness_score INTEGER CHECK (readiness_score >= 0 AND readiness_score <= 100),
    hrv_balance INTEGER,
    temperature_deviation DECIMAL(3, 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- 冒険ログ
CREATE TABLE IF NOT EXISTS adventure_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    story_text TEXT NOT NULL,
    experience_gained INTEGER DEFAULT 0 CHECK (experience_gained >= 0),
    gold_gained INTEGER DEFAULT 0 CHECK (gold_gained >= 0),
    health_score_average INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- インデックス作成
CREATE INDEX idx_daily_health_data_user_date ON daily_health_data(user_id, date DESC);
CREATE INDEX idx_adventure_logs_user_date ON adventure_logs(user_id, date DESC);

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルに更新日時トリガーを設定
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oura_tokens_updated_at BEFORE UPDATE ON oura_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();