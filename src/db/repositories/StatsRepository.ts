import { BaseRepository } from './BaseRepository';
import { MinuteStatDTO } from '../../dto/MinuteStatDTO';

export interface MinuteStatRow {
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  ticks_count?: number;
}

export class StatsRepository extends BaseRepository {
  upsertMinuteStat(stat: MinuteStatDTO): void {
    const stmt = this.db.prepare(`
      INSERT INTO minute_stats(symbol, minute_start, open, high, low, close, volume, ticks_count)
      VALUES(@symbol,@minuteStart,@open,@high,@low,@close,@volume,@ticksCount)
      ON CONFLICT(symbol, minute_start) DO UPDATE SET
        high = excluded.high,
        low = excluded.low,
        close = excluded.close,
        volume = excluded.volume,
        ticks_count = excluded.ticks_count
    `);
    stmt.run({
      symbol: stat.symbol,
      minuteStart: stat.minute_start,
      open: stat.open,
      high: stat.high,
      low: stat.low,
      close: stat.close,
      volume: stat.volume,
      ticksCount: stat.ticks_count,
    });
  }

  getMinuteClose(symbol: string, minuteStart: number): { close: number } | undefined {
    return this.db
      .prepare(`SELECT close FROM minute_stats WHERE symbol = ? AND minute_start = ?`)
      .get(symbol, minuteStart) as { close: number } | undefined;
  }

  getLastClose(symbol: string): { close: number } | undefined {
    return this.db
      .prepare(`SELECT close FROM minute_stats WHERE symbol = ? ORDER BY minute_start DESC LIMIT 1`)
      .get(symbol) as { close: number } | undefined;
  }

  // Получить частичную свечу
  getMinuteStat(symbol: string, minuteStart: number): MinuteStatRow | undefined {
    return this.db
      .prepare(`SELECT open, high, low, volume, ticks_count FROM minute_stats WHERE symbol = ? AND minute_start = ?`)
      .get(symbol, minuteStart) as MinuteStatRow | undefined;
  }

  // НОВЫЙ МЕТОД: Проверить существование
  exists(symbol: string, minuteStart: number): boolean {
    const row = this.db
      .prepare(`SELECT 1 FROM minute_stats WHERE symbol = ? AND minute_start = ?`)
      .get(symbol, minuteStart);
    return !!row;
  }

  getCloseAt(symbol: string, minuteStart: number): number | undefined {
    const row = this.db
      .prepare(`SELECT close FROM minute_stats WHERE symbol = ? AND minute_start = ?`)
      .get(symbol, minuteStart) as { close: number } | undefined;
    return row?.close;
  }

  getLastCloseBefore(symbol: string, beforeMinuteStart: number): number | undefined {
    const row = this.db
      .prepare(`
        SELECT close FROM minute_stats 
        WHERE symbol = ? AND minute_start <= ? 
        ORDER BY minute_start DESC LIMIT 1
      `)
      .get(symbol, beforeMinuteStart) as { close: number } | undefined;
    return row?.close;
  }
}