import { useEffect, useState } from "react";
import type { DailyData, MissileType, Stats, WeeklyData } from "../types";

const API = import.meta.env.DEV ? "" : "";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function useStats() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchJson<Stats>("/api/stats")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

export function useDailyData() {
  const [data, setData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchJson<DailyData[]>("/api/daily")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

export function useWeeklyData() {
  const [data, setData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchJson<WeeklyData[]>("/api/weekly")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

export function useMissileTypes() {
  const [data, setData] = useState<MissileType[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchJson<MissileType[]>("/api/missile-types")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}
