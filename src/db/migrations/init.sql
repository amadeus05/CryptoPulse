-- Инициализация БД для Crypto Watch Bot

CREATE TABLE IF NOT EXISTS coins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT UNIQUE NOT NULL,
  base_asset TEXT,
  quote_asset TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS ticks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  price REAL NOT NULL,
  event_ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ticks_symbol_ts ON ticks(symbol, event_ts);

CREATE TABLE IF NOT EXISTS minute_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  minute_start INTEGER NOT NULL,
  open REAL, high REAL, low REAL, close REAL,
  volume REAL, ticks_count INTEGER,
  UNIQUE(symbol, minute_start)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,
  percent REAL NOT NULL,
  interval_min INTEGER DEFAULT 20,
  enabled INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  UNIQUE(user_id, symbol, direction, percent, interval_min)
);

CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,
  percent REAL NOT NULL,
  base_price REAL NOT NULL,
  current_price REAL NOT NULL,
  detected_at INTEGER DEFAULT (strftime('%s','now')),
  sent INTEGER DEFAULT 0
);
