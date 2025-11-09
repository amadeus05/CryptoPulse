import { UserSettingsRepository } from '../db/repositories/UserSettingsRepository';
import { SignalRepository } from '../db/repositories/SignalRepository';
import { StatsService } from './StatsService';
import { RateLimiterService } from './RateLimiterService';
import { SignalDTO } from '../dto/SignalDTO';
import { logger } from '../utils/logger';
import PQueue from 'p-queue';
import { config } from '../config';
import { percentChange } from '../utils/helpers';
import { TelegramBotService } from './TelegramBotService';
import { UserSettingDTO } from '../dto/UserSettingDTO';

export class SignalDetector {
  private settingsRepo = new UserSettingsRepository();
  private signalRepo = new SignalRepository();
  private queue = new PQueue({ concurrency: 2 });

  constructor(
    private statsService: StatsService,
    private rateLimiter: RateLimiterService,
    private telegramService: TelegramBotService,
    private checkIntervalSec: number = config.CHECK_INTERVAL_SEC
  ) {}

  start(): void {
    setInterval(() => this.checkAll(), this.checkIntervalSec * 1000);
  }

  async checkAll() {
    try {
      const active: UserSettingDTO[] = this.settingsRepo.listActive();
      for (const s of active) {
        const current = this.statsService.getCurrentPrice(s.symbol);
        const minutesAgo = s.interval_min ?? 20;
        const base = this.statsService.getPriceMinutesAgo(s.symbol, minutesAgo);
        if (current == null || base == null) continue;

        const change = percentChange(base, current);
        const matched =
          (s.direction === 'up' && change >= s.percent) ||
          (s.direction === 'down' && change <= -s.percent);

        if (matched) {
          const key = `${s.user_id}:${s.symbol}:${s.direction}:${s.percent}`;
          if (!this.rateLimiter.canSend(key)) continue;

          const sig: SignalDTO = {
            user_id: s.user_id,
            symbol: s.symbol,
            direction: s.direction,
            percent: s.percent,
            base_price: base,
            current_price: current,
          };
          const saved: SignalDTO = this.signalRepo.create(sig);

          this.queue.add(async () => {
            try {
              await this.telegramService.sendSignal(saved);
              this.signalRepo.markSent(saved.id!);
            } catch (err) {
              logger.error({ err }, 'Failed to send signal');
            }
          });
        }
      }
    } catch (err) {
      logger.error({ err }, 'SignalDetector.checkAll error');
    }
  }
}
