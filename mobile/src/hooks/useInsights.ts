/**
 * SHEAZ — Hook Insights (S13A)
 * Agrégations 7/30 jours + corrélations simples (sommeil↔humeur, hydratation↔humeur).
 * Le range 30 jours est réservé au Premium (gate) — sinon 7 jours.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSubscription } from './useSubscription';

export interface WeightPoint {
  date: string;
  value: number;
}

export interface CorrResult {
  /** humeur moyenne (1-6) quand la condition est remplie, null si données insuffisantes */
  good: number | null;
  poor: number | null;
  days: number;
}

export interface InsightData {
  sleep: { avgMin: number | null; avgQuality: number | null; days: number };
  hydration: { avgGlasses: number | null; days: number };
  weight: { latest: number | null; delta: number | null; points: WeightPoint[] };
  mood: { avg: number | null; days: number };
  workouts: { count: number; totalMin: number };
  nutrition: { avgKcal: number | null; avgScore: number | null; days: number };
  quizCount: number;
  xp: number;
  streak: number;
  corrSleepMood: CorrResult;
  corrHydrationMood: CorrResult;
}

const EMPTY: InsightData = {
  sleep: { avgMin: null, avgQuality: null, days: 0 },
  hydration: { avgGlasses: null, days: 0 },
  weight: { latest: null, delta: null, points: [] },
  mood: { avg: null, days: 0 },
  workouts: { count: 0, totalMin: 0 },
  nutrition: { avgKcal: null, avgScore: null, days: 0 },
  quizCount: 0,
  xp: 0,
  streak: 0,
  corrSleepMood: { good: null, poor: null, days: 0 },
  corrHydrationMood: { good: null, poor: null, days: 0 },
};

const GOOD_SLEEP_MIN = 420; // 7 h
const GOOD_GLASSES = 8;

function avg(nums: (number | null | undefined)[]): number | null {
  const vals = nums.filter((n): n is number => typeof n === 'number' && !Number.isNaN(n));
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

/** Corrélation : humeur moyenne selon une condition binaire par jour */
function correlate(
  dayData: Record<string, { sleepMin?: number; mood?: number; glasses?: number }>,
  cond: (d: { sleepMin?: number; mood?: number; glasses?: number }) => boolean,
): CorrResult {
  const good: number[] = [];
  const poor: number[] = [];
  let days = 0;
  for (const d of Object.values(dayData)) {
    if (d.mood === undefined) continue;
    if (cond(d)) good.push(d.mood);
    else poor.push(d.mood);
    days += 1;
  }
  return { good: avg(good), poor: avg(poor), days };
}

export function useInsights() {
  const { isPremium } = useSubscription();
  const [range, setRange] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightData>(EMPTY);

  // Gate : 30 jours réservé au Premium
  const effectiveRange = isPremium ? range : 7;

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const from = new Date();
    from.setDate(from.getDate() - effectiveRange + 1);
    from.setHours(0, 0, 0, 0);
    const fromIso = from.toISOString();
    const fromDate = fromIso.slice(0, 10);

    const [sleepRes, hydRes, bodyRes, moodRes, wRes, foodRes, quizRes, profRes] = await Promise.all([
      supabase.from('sleep_entries').select('*').eq('user_id', user.id).gte('sleep_date', fromDate),
      supabase.from('hydration_entries').select('*').eq('user_id', user.id).gte('entry_date', fromDate),
      supabase
        .from('body_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_type', 'weight')
        .gte('measured_on', fromDate)
        .order('measured_on', { ascending: true }),
      supabase.from('mood_entries').select('*').eq('user_id', user.id).gte('logged_at', fromIso),
      supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', fromIso)
        .not('ended_at', 'is', null),
      supabase.from('food_logs').select('*').eq('user_id', user.id).gte('logged_on', fromDate),
      supabase.from('quiz_results').select('*').eq('user_id', user.id).gte('answered_on', fromDate),
      supabase.from('profiles').select('xp, streak').eq('id', user.id).maybeSingle(),
    ]);

    // Par jour : sommeil / humeur / hydratation (pour corrélations)
    const dayData: Record<string, { sleepMin?: number; mood?: number; glasses?: number }> = {};
    for (const s of sleepRes.data ?? []) {
      dayData[s.sleep_date as string] = { ...dayData[s.sleep_date], sleepMin: s.duration_min ?? undefined };
    }
    for (const m of moodRes.data ?? []) {
      const d = (m.logged_at as string).slice(0, 10);
      dayData[d] = { ...dayData[d], mood: m.mood as number };
    }
    for (const h of hydRes.data ?? []) {
      dayData[h.entry_date as string] = { ...dayData[h.entry_date], glasses: h.glasses as number };
    }

    // Sommeil
    const sleeps = (sleepRes.data ?? []) as { duration_min: number | null; quality: number | null }[];
    const hydrations = (hydRes.data ?? []) as { glasses: number }[];
    const moods = (moodRes.data ?? []) as { mood: number }[];
    const workouts = (wRes.data ?? []) as { duration_sec: number | null }[];
    const foods = (foodRes.data ?? []) as { kcal: number; score: number; logged_on: string }[];
    const weights = (bodyRes.data ?? []) as { measured_on: string; value: number }[];

    const foodDays = new Set(foods.map((f) => f.logged_on)).size;

    const next: InsightData = {
      sleep: {
        avgMin: avg(sleeps.map((s) => s.duration_min)),
        avgQuality: avg(sleeps.map((s) => s.quality)),
        days: sleeps.length,
      },
      hydration: {
        avgGlasses: avg(hydrations.map((h) => h.glasses)),
        days: hydrations.length,
      },
      weight: {
        latest: weights.length ? Number(weights[weights.length - 1].value) : null,
        delta: weights.length >= 2
          ? Math.round((Number(weights[weights.length - 1].value) - Number(weights[0].value)) * 10) / 10
          : null,
        points: weights.map((w) => ({ date: w.measured_on, value: Number(w.value) })),
      },
      mood: { avg: avg(moods.map((m) => m.mood)), days: moods.length },
      workouts: {
        count: workouts.length,
        totalMin: Math.round(workouts.reduce((a, w) => a + (w.duration_sec ?? 0), 0) / 60),
      },
      nutrition: {
        avgKcal: foodDays > 0
          ? Math.round(foods.reduce((a, f) => a + Number(f.kcal ?? 0), 0) / foodDays)
          : null,
        avgScore: avg(foods.map((f) => f.score)),
        days: foodDays,
      },
      quizCount: (quizRes.data ?? []).length,
      xp: Number(profRes.data?.xp ?? 0),
      streak: Number(profRes.data?.streak ?? 0),
      corrSleepMood: correlate(dayData, (d) => (d.sleepMin ?? 0) >= GOOD_SLEEP_MIN),
      corrHydrationMood: correlate(dayData, (d) => (d.glasses ?? 0) >= GOOD_GLASSES),
    };
    setData(next);
    setLoading(false);
  }, [effectiveRange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(
    () => ({ ...data, loading, range, effectiveRange, setRange, isPremium, refresh }),
    [data, loading, range, effectiveRange, isPremium, refresh],
  );
}
