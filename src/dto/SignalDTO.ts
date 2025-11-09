export interface SignalDTO {
  id?: number;
  user_id: number;
  symbol: string;
  direction: 'up' | 'down';
  percent: number;
  base_price: number;
  current_price: number;
  detected_at?: number;
  sent?: number;
}
