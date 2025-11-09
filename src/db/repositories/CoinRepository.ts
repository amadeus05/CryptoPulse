import { BaseRepository } from './BaseRepository';

interface CoinDTO {
  id?: number;
  symbol: string;
  base_asset?: string;
  quote_asset?: string;
}

export class CoinRepository extends BaseRepository {
  createIfNotExists(symbol: string, base?: string, quote?: string): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO coins(symbol, base_asset, quote_asset)
      VALUES(?, ?, ?)
    `);
    stmt.run(symbol, base ?? null, quote ?? null);
  }

  listAll(): CoinDTO[] {
    return this.db.prepare(`SELECT * FROM coins`).all() as CoinDTO[];
  }
}