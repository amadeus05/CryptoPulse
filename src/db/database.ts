import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';

const MIGRATION_PATH = path.join(process.cwd(), 'src', 'db', 'migrations', 'init.sql');

export class DB {
  public db: Database.Database;

  constructor(private dbPath: string = config.DB_PATH) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.init();
  }

  private init() {
    try {
      const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
      this.db.exec(sql);
      logger.info('DB initialized & migrations executed');
    } catch (err) {
      logger.error({ err }, 'DB migration failed');
      throw err;
    }
  }
}

export const db = new DB().db;
