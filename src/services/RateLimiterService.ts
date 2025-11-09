/**
 * RateLimiterService предотвращает повторную отправку одинаковых сигналов одному пользователю чаще чем limitSec
 */
import { nowSec } from '../utils/helpers';

export class RateLimiterService {
  private lastSentMap: Map<string, number> = new Map(); // key -> unix sec

  constructor(private limitSec: number = 60) {}

  // key составляется как `${userId}:${symbol}:${direction}:${percent}`
  canSend(key: string): boolean {
    const last = this.lastSentMap.get(key);
    const now = nowSec();
    if (!last || now - last >= this.limitSec) {
      this.lastSentMap.set(key, now);
      return true;
    }
    return false;
  }
}
