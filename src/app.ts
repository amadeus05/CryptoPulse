/**
 * Точка входа приложения
 * Инициализируем DB, сервисы, биндим зависимости и стартуем бота и WebSocket
 */
import { config } from './config';
import { logger } from './utils/logger';
import { StatsService } from './services/StatsService';
import { BinanceSocketService } from './services/BinanceSocketService';
import { RateLimiterService } from './services/RateLimiterService';
import { TelegramBotService } from './services/TelegramBotService';
import { SignalDetector } from './services/SignalDetector';

async function main() {
  logger.info('Starting Crypto Watch Bot');

  // Инициализация DB (singleton в файле database.ts уже выполнит миграцию)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  await import('./db/database');

  // Сервисы
  const stats = new StatsService();
  const telegram = new TelegramBotService();
  const rateLimiter = new RateLimiterService(60);
  const detector = new SignalDetector(stats, rateLimiter, telegram, config.CHECK_INTERVAL_SEC);

  // Binance WS
  const binance = new BinanceSocketService(stats, config.BINANCE_WS_URL);

  // Стартуем
  telegram.start();
  binance.start();
  detector.start();

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'uncaughtException');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'unhandledRejection');
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start app');
  process.exit(1);
});
