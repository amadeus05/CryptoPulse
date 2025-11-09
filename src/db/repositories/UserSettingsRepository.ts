import { BaseRepository } from './BaseRepository';
import { UserSettingDTO } from '../../dto/UserSettingDTO';

export class UserSettingsRepository extends BaseRepository {
  add(setting: UserSettingDTO): UserSettingDTO | null {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO user_settings(user_id, symbol, direction, percent, enabled, interval_min )
      VALUES(?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      setting.user_id,
      setting.symbol,
      setting.direction,
      setting.percent,
      setting.enabled ? 1 : 0,
      setting.interval_min  ?? 20
    );
    if (info.changes) {
      return this.db
        .prepare(`SELECT * FROM user_settings WHERE id = ?`)
        .get(info.lastInsertRowid) as UserSettingDTO;
    }
    return null;
  }

  listActive(): UserSettingDTO[] {
    return this.db
      .prepare(`SELECT * FROM user_settings WHERE enabled = 1`)
      .all() as UserSettingDTO[];
  }

  listByUser(userId: number): UserSettingDTO[] {
    return this.db
      .prepare(`SELECT * FROM user_settings WHERE user_id = ?`)
      .all(userId) as UserSettingDTO[];
  }

  remove(id: number): void {
    this.db.prepare(`DELETE FROM user_settings WHERE id = ?`).run(id);
  }

  toggle(id: number): void {
    this.db.prepare(`
      UPDATE user_settings SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END WHERE id = ?
    `).run(id);
  }

  getById(id: number): UserSettingDTO | undefined {
    return this.db
      .prepare(`SELECT * FROM user_settings WHERE id = ?`)
      .get(id) as UserSettingDTO;
  }
}