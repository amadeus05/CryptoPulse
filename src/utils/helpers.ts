/**
 * Утилиты
 */

/** Текущий unix timestamp (сек) */
export const nowSec = (): number => Math.floor(Date.now() / 1000);

/** Процент изменения (в процентах) */
export const percentChange = (from: number, to: number): number => {
  if (from === 0) return 0;
  return ((to - from) / from) * 100;
};
