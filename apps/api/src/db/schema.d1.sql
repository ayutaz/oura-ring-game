-- D1 (SQLite) Schema for Oura Quest
-- CloudflareのD1データベース用スキーマ

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  oura_user_id TEXT UNIQUE,
  oura_access_token TEXT,
  oura_refresh_token TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- キャラクターテーブル
CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT '冒険者',
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  hp INTEGER DEFAULT 100,
  max_hp INTEGER DEFAULT 100,
  mp INTEGER DEFAULT 50,
  max_mp INTEGER DEFAULT 50,
  attack INTEGER DEFAULT 10,
  defense INTEGER DEFAULT 10,
  gold INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 日次健康データキャッシュ
CREATE TABLE IF NOT EXISTS daily_health_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  sleep_data TEXT, -- JSON
  activity_data TEXT, -- JSON
  readiness_data TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, date)
);

-- 冒険ログ
CREATE TABLE IF NOT EXISTS adventure_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  adventure_type TEXT NOT NULL,
  time_of_day TEXT NOT NULL,
  health_snapshot TEXT, -- JSON
  result TEXT NOT NULL, -- JSON
  rewards TEXT NOT NULL, -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_oura_user_id ON users(oura_user_id);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_health_cache_user_date ON daily_health_cache(user_id, date);
CREATE INDEX IF NOT EXISTS idx_adventure_logs_user_id ON adventure_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_adventure_logs_created_at ON adventure_logs(created_at);