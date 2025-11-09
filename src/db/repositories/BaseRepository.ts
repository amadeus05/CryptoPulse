import { db } from '../database';

export abstract class BaseRepository {
  protected db = db;
}
