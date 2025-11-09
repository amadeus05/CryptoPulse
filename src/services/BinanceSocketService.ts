/**
 * Сервис подключения к Binance WebSocket
 * Парсит !ticker@arr — массив тиков и вызывает колбек для каждого тика
 */
import WebSocket from 'ws';
import { config } from '../config';
import { logger } from '../utils/logger';
import { TickerDTO } from '../dto/TickerDTO';
import { StatsService } from './StatsService';

export class BinanceSocketService {
  private ws?: WebSocket;
  private url: string;

  constructor(private statsService: StatsService, url?: string) {
    this.url = url || config.BINANCE_WS_URL;
  }

  start() {
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      logger.info('Connected to Binance WebSocket');
    });

    this.ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (Array.isArray(parsed)) {
          for (const t of parsed) {
            this.handleRawTicker(t);
          }
        } else if (parsed && parsed.s && parsed.c) {
          this.handleRawTicker(parsed);
        } else if (parsed.result === null && parsed.stream) {
          // ignore...
        } else if (parsed.stream && parsed.data) {
          this.handleRawTicker(parsed.data);
        }
      } catch (err) {
        logger.error({ err, data: data.toString() }, 'Failed to parse ws message');
      }
    });

    this.ws.on('close', (code) => {
      logger.warn({ code }, 'Binance WS closed — reconnect in 2s');
      setTimeout(() => this.start(), 2000);
    });

    this.ws.on('error', (err) => {
      logger.error({ err }, 'Binance WS error');
    });
  }

  private handleRawTicker(raw: any) {
    const symbol = raw.s || raw.symbol;
    const priceStr = raw.c || raw.price;
    if (!symbol || !priceStr) return;
    const price = Number(priceStr);
    const eventTs = Math.floor((raw.E ? raw.E : Date.now()) / 1000);
    const ticker: TickerDTO = {
      symbol,
      price,
      event_ts: eventTs,
    };
    this.statsService.onTicker(ticker);
  }

  stop() {
    if (this.ws) this.ws.close();
  }
}
