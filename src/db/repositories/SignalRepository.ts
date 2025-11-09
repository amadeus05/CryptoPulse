import { BaseRepository } from './BaseRepository';
import { SignalDTO } from '../../dto/SignalDTO';

export class SignalRepository extends BaseRepository {
  create(signal: SignalDTO): SignalDTO {
    const stmt = this.db.prepare(`
      INSERT INTO signals(user_id, symbol, direction, percent, base_price, current_price, detected_at, sent)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = Math.floor(Date.now() / 1000);
    const info = stmt.run(
      signal.user_id,
      signal.symbol,
      signal.direction,
      signal.percent,
      signal.base_price,
      signal.current_price,
      now,
      signal.sent ? 1 : 0
    );
    return this.db
      .prepare(`SELECT * FROM signals WHERE id = ?`)
      .get(info.lastInsertRowid) as SignalDTO;
  }

  lastSignalFor(userId: number, symbol: string, direction: string, percent: number): SignalDTO | undefined {
    return this.db
      .prepare(`
        SELECT * FROM signals WHERE user_id = ? AND symbol = ? AND direction = ? AND percent = ?
        ORDER BY detected_at DESC LIMIT 1
      `)
      .get(userId, symbol, direction, percent) as SignalDTO;
  }

  markSent(id: number): void {
    this.db.prepare(`UPDATE signals SET sent = 1 WHERE id = ?`).run(id);
  }
}