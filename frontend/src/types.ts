export interface DailyData {
  date: string;
  launched: number;
  destroyed: number;
  personnel_losses?: number;
  temp_mean?: number | null;
  precip?: number | null;
  wind_speed?: number | null;
  cloud_cover?: number | null;
}

export interface WeeklyData {
  week_start: string;
  launched: number;
  destroyed: number;
  personnel_losses?: number;
  efficiency: number;
}

export interface StatsPeriod {
  date?: string;
  launched: number;
  destroyed: number;
  efficiency: number;
}

export interface Stats {
  today: StatsPeriod;
  this_week: StatsPeriod;
  this_month: StatsPeriod;
  all_time: {
    launched: number;
    destroyed: number;
    efficiency: number;
    days: number;
    first_date: string;
    last_date: string;
  };
}

export interface MissileType {
  model: string;
  total_launched: number;
  total_destroyed: number;
  efficiency: number;
}

export interface ByModelData {
  date: string;
  model: string;
  launched: number;
  destroyed: number;
}
