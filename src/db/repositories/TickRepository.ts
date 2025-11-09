import { BaseRepository } from './BaseRepository';

interface TickDTO {
  id?: number;
  symbol: string;
  price: number;
  event_ts: number;
}

export class TickRepository extends BaseRepository {
  insertTick(symbol: string, price: number, eventTs: number): void {
    const stmt = this.db.prepare(`
      INSERT INTO ticks(symbol, price, event_ts) VALUES(?, ?, ?)
    `);
    stmt.run(symbol, price, eventTs);
  }

  getOldestTickBefore(symbol: string, beforeTs: number): TickDTO | undefined {
    return this.db
      .prepare(`
        SELECT * FROM ticks WHERE symbol = ? AND event_ts <= ? ORDER BY event_ts DESC LIMIT 1
      `)
      .get(symbol, beforeTs) as TickDTO | undefined;
  }

  getLastTick(symbol: string): TickDTO | undefined {
    return this.db
      .prepare(`SELECT * FROM ticks WHERE symbol = ? ORDER BY event_ts DESC LIMIT 1`)
      .get(symbol) as TickDTO | undefined;
  }

  deleteOlderThan(beforeTs: number): void {
    const stmt = this.db.prepare(`DELETE FROM ticks WHERE event_ts < ?`);
    stmt.run(beforeTs);
  }
}