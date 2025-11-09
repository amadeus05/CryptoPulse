import dotenv from 'dotenv';
dotenv.config();

export const config = {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN || '',
  BINANCE_WS_URL: process.env.BINANCE_WS_URL || 'wss://stream.binance.com:9443/ws/!ticker@arr',
  DB_PATH: process.env.DB_PATH || './data/bot.db',
  CHECK_INTERVAL_SEC: Number(process.env.CHECK_INTERVAL_SEC || 10),
};
