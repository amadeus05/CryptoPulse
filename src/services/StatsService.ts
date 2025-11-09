/**
 * StatsService:
 * - Принимает тики
 * - Сохраняет их в ticks
 * - Агрегирует по минутам и сохраняет в minute_stats
 * - Держит последние цены в памяти для быстрого доступа
 */
import { TickerDTO } from '../dto/TickerDTO';
import { TickRepository } from '../db/repositories/TickRepository';
import { StatsRepository } from '../db/repositories/StatsRepository';
import { CoinRepository } from '../db/repositories/CoinRepository';
import { MinuteStatDTO } from '../dto/MinuteStatDTO';
import { logger } from '../utils/logger';
import { nowSec } from '../utils/helpers';

export class StatsService {
  private tickRepo = new TickRepository();
  private statsRepo = new StatsRepository();
  private coinRepo = new CoinRepository();

  // in-memory cache последних цен (symbol -> {price, ts})
  private lastPriceMap: Map<string, { price: number; ts: number }> = new Map();

  constructor() {}

  // Вызывается из BinanceSocketService
  onTicker(t: TickerDTO) {
    try {
      // Сохраняем raw tick
      this.tickRepo.insertTick(t.symbol, t.price, t.event_ts);

      // Обновляем coin таблицу (если новая монета)
      this.coinRepo.createIfNotExists(t.symbol);

      // Обновляем минутную агрегацию
      this.aggregateToMinute(t);

      // Обновляем in-memory последний тик
      this.lastPriceMap.set(t.symbol, { price: t.price, ts: t.event_ts });

      // Очистим старые тики (например, старше 24 часов)
      const olderThan = nowSec() - 24 * 60 * 60;
      this.tickRepo.deleteOlderThan(olderThan);
    } catch (err) {
      logger.error({ err }, 'StatsService.onTicker error');
    }
  }

  private aggregateToMinute(t: TickerDTO) {
    const minuteStart = Math.floor(t.event_ts / 60) * 60;

    // Используем публичный метод
    const exists = this.statsRepo.exists(t.symbol, minuteStart);

    if (!exists) {
      const stat: MinuteStatDTO = {
        symbol: t.symbol,
        minute_start: minuteStart,
        open: t.price,
        high: t.price,
        low: t.price,
        close: t.price,
        volume: 0,
        ticks_count: 1,
      };
      this.statsRepo.upsertMinuteStat(stat);
    } else {
      // Получаем частичную свечу
      const saved = this.statsRepo.getMinuteStat(t.symbol, minuteStart);
      if (!saved) return;

      const updated: MinuteStatDTO = {
        symbol: t.symbol,
        minute_start: minuteStart,
        open: saved.open ?? t.price,
        high: Math.max(saved.high ?? t.price, t.price),
        low: Math.min(saved.low ?? t.price, t.price),
        close: t.price,
        volume: (saved.volume ?? 0),
        ticks_count: (saved.ticks_count ?? 0) + 1,
      };
      this.statsRepo.upsertMinuteStat(updated);
    }
  }

  // Получить цену сейчас (в памяти или из БД)
  getCurrentPrice(symbol: string): number | null {
    const item = this.lastPriceMap.get(symbol);
    if (item) return item.price;
    const last = this.tickRepo.getLastTick(symbol);
    return last ? last.price : null;
  }

  // Получить цену ~20 минут назад (по минутной агрегации)
  getPriceMinutesAgo(symbol: string, minutesAgo: number): number | null {
    const target = Math.floor((nowSec() - minutesAgo * 60) / 60) * 60;

    // 1. Точная минута
    const exact = this.statsRepo.getCloseAt(symbol, target);
    if (exact !== undefined) return exact;

    // 2. Fallback: ближайшая минута назад
    const fallback = this.statsRepo.getLastCloseBefore(symbol, target);
    return fallback ?? null;
  }
}
