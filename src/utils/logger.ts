import pino from 'pino';

export const logger = pino({
  name: 'crypto-bot',
  level: process.env.LOG_LEVEL || 'info',
});
