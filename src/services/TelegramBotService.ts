/**
 * Сервис Telegram bot (Telegraf)
 * - Реализует команды /start, /add, /list, /remove, /toggle
 * - Отправляет сигналы пользователю (sendSignal)
 */
import { Telegraf } from 'telegraf';
import { config } from '../config';
import { UserRepository } from '../db/repositories/UserRepository';
import { UserSettingsRepository } from '../db/repositories/UserSettingsRepository';
import { logger } from '../utils/logger';
import { SignalDTO } from '../dto/SignalDTO';
import { UserSettingDTO } from '../dto/UserSettingDTO';

export class TelegramBotService {
  private bot: Telegraf;
  private userRepo = new UserRepository();
  private settingsRepo = new UserSettingsRepository();

  constructor(token?: string) {
    const tk = token || config.TELEGRAM_TOKEN;
    if (!tk) throw new Error('TELEGRAM_TOKEN is required');
    this.bot = new Telegraf(tk);
    this.setupHandlers();
  }

  setupHandlers() {
    // /start
    this.bot.start(async (ctx) => {
      const tgId = String(ctx.from?.id);
      const user = this.userRepo.findOrCreate(tgId, ctx.from?.username);
      await ctx.reply(`Привет, ${ctx.from?.username || 'пользователь'}! Я буду отслеживать ваши крипто-правила.`);
    });

    // /add SYMBOL direction percent
    // пример: /add BTCUSDT up 2
    this.bot.command('add', async (ctx) => {
      const text = ctx.message?.text || '';
      const parts = text.split(/\s+/);
      if (parts.length < 4 || parts.length > 5) {
        await ctx.reply(
          'Использование: /add SYMBOL up|down PERCENT [минуты]\n' +
          'Пример: /add BTCUSDT up 2\n' +
          '       /add DOGEUSDT up 10 5'
        );
        return;
      }

      const [, symbol, directionRaw, percentRaw, timeRaw] = parts;
      const direction = directionRaw.toLowerCase() === 'up' ? 'up' : 'down';
      const percent = Math.abs(Number(percentRaw));
      const timeWindow = timeRaw ? Math.max(1, Math.min(1440, Number(timeRaw))) : 20;

      if (!symbol || !percent || isNaN(percent)) {
        await ctx.reply('Неверные параметры');
        return;
      }

      const tgId = String(ctx.from?.id);
      const user = this.userRepo.findOrCreate(tgId, ctx.from?.username);
      const created = this.settingsRepo.add({
        user_id: user.id!,
        symbol: symbol.toUpperCase(),
        direction: direction as 'up' | 'down',
        percent,
        enabled: true,
        interval_min : timeWindow,
      } as any);

      if (created) {
        const timeText = timeWindow === 20 ? '' : ` за ${timeWindow} мин`;
        await ctx.reply(`Добавлено #${created.id}: ${created.symbol} ${created.direction} ${created.percent}%${timeText}`);
      } else {
        await ctx.reply('Правило не добавлено (дубликат)');
      }
    });

    // /list
    this.bot.command('list', async (ctx) => {
      const tgId = String(ctx.from?.id);
      const user = this.userRepo.findOrCreate(tgId, ctx.from?.username);
      const list = this.settingsRepo.listByUser(user.id as number); //TODO add check
      if (!list || list.length === 0) {
        await ctx.reply('У вас нет правил. Добавьте с помощью /add');
        return;
      }
      const msg = list
        .map((r: any) => `#${r.id} ${r.symbol} ${r.direction} ${r.percent}% ${r.enabled ? 'ON' : 'OFF'}`)
        .join('\n');
      await ctx.reply(`Ваши правила:\n${msg}`);
    });

    // /remove id
    this.bot.command('remove', async (ctx) => {
      const text = ctx.message?.text || '';
      const parts = text.split(/\s+/);
      if (parts.length < 2) {
        await ctx.reply('Использование: /remove <id>');
        return;
      }
      const id = Number(parts[1]);
      if (!id) {
        await ctx.reply('Неверный id');
        return;
      }
      this.settingsRepo.remove(id);
      await ctx.reply(`Правило #${id} удалено (если существовало).`);
    });

    // /toggle id
    this.bot.command('toggle', async (ctx) => {
      const text = ctx.message?.text || '';
      const parts = text.split(/\s+/);
      if (parts.length < 2) {
        await ctx.reply('Использование: /toggle <id>');
        return;
      }
      const id = Number(parts[1]);
      if (!id) {
        await ctx.reply('Неверный id');
        return;
      }
      this.settingsRepo.toggle(id);
      const updated = this.settingsRepo.getById(id) as UserSettingDTO; //TODO add check
      await ctx.reply(`#${id} теперь ${updated.enabled ? 'ON' : 'OFF'}`);
    });
  }

  // запускаем бота polling
  start() {
    this.bot.launch();
    logger.info('Telegram bot started');
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  // Отправка сигнала пользователю (используется SignalDetector)
  async sendSignal(signal: SignalDTO) {
    const user = this.userRepo.getById(signal.user_id);
    if (!user) return;

    const chatId = Number(user.telegram_id);
    const timeText = signal.detected_at
      ? new Date(signal.detected_at * 1000).toISOString().slice(11, 19)
      : '—';

    const text = `
  Сигнал: ${signal.symbol} ${signal.direction.toUpperCase()} ${signal.percent}%
  Базовая: ${signal.base_price.toFixed(8)}
  Текущая: ${signal.current_price.toFixed(8)}
  Время: ${timeText}
  `.trim();

    await this.bot.telegram.sendMessage(chatId, text);
  }
}
