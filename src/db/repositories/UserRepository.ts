import { BaseRepository } from './BaseRepository';
import { UserDTO } from '../../dto/UserDTO';

export class UserRepository extends BaseRepository {
  findOrCreate(telegramId: string, username?: string): UserDTO {
    const select = this.db.prepare(`SELECT * FROM users WHERE telegram_id = ?`).get(telegramId);
    if (select) return select as UserDTO;

    const insert = this.db.prepare(`INSERT INTO users(telegram_id, username) VALUES(?, ?)`);
    const info = insert.run(telegramId, username || null);
    return this.db
      .prepare(`SELECT * FROM users WHERE id = ?`)
      .get(info.lastInsertRowid) as UserDTO;
  }

  getByTelegramId(telegramId: string): UserDTO | undefined {
    return this.db
      .prepare(`SELECT * FROM users WHERE telegram_id = ?`)
      .get(telegramId) as UserDTO;
  }

  getById(id: number): UserDTO | undefined {
    return this.db
      .prepare(`SELECT * FROM users WHERE id = ?`)
      .get(id) as UserDTO;
  }
}