export interface UserSettingDTO {
  id?: number;
  user_id: number;
  symbol: string;
  direction: 'up' | 'down';
  percent: number;
  interval_min: number; 
  enabled?: boolean;
  created_at?: number;
}
