import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { config } from '../../config';

const MIGRATION_PATH = path.join(process.cwd(), 'src', 'db', 'migrations', 'init.sql');

function run() {
  const dbPath = config.DB_PATH || './data/bot.db';
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
  db.exec(sql);
  console.log('Migrations executed');
  db.close();
}

run();
