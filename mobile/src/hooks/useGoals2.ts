/**
 * SHEAZ — Hook Objectifs 2.0 (S11B)
 * CRUD sur la table Supabase `goals` (RLS propriétaire, déjà en place) +
 * progression automatique calculée depuis les vraies données :
 *   - pilier Sport  (1) : séances de sport (workout_sessions)
 *   - pilier Corps  (2) : verres d'eau, repas loggés (food), poids
 *   - pilier Mental (3) : sessions de méditation, humeurs notées
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Goal {
  id: string;
  pillar: number;
  title: string;
  target: number | null;
  unit: string | null;
  period: string; // day | week | month
  ends_on: string | null;
  created_at: string;
}

export interface GoalCounters {
  workouts: number; // séances sport (période)
  workoutMin: number; // minutes de sport (période)
  meditations: number; // sessions méditation (période)
  water: number; // verres aujourd'hui
  meals: number; // repas loggés aujourd'hui
  moods: number; // humeurs notées aujourd'hui
}

export interface GoalProgress {
  current: number;
  target: number;
  percent: number; // 0-100, plafonné
  done: boolean;
}

/** Calcule la progression d'un objectif selon son pilier et son unité */
export function computeProgress(g: Goal, c: GoalCounters): GoalProgress {
  let current = 0;
  let target = g.target ?? 1;
  const unit = g.unit ?? 'séances';

  switch (g.pillar) {
    case 1: // Sport
      current = unit === 'min' || unit === 'minutes' ? c.workoutMin : c.workouts;
      break;
    case 2: // Corps
      if (unit === 'verres' || unit === 'verre') current = c.water;
      else if (unit === 'repas' || unit === 'repas/jour') current = c.meals;
      else current = c.workouts; // fallback : activités
      break;
    case 3: // Mental
      if (unit === 'humeurs' || unit === 'humeur') current = c.moods;
      else current = c.meditations;
      break;
    default:
      current = c.workouts;
  }

  if (target <= 0) target = 1;
  const percent = Math.min(100, Math.round((current / target) * 100));
  return { current, target, percent, done: current >= target };
}

export function useGoals2() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [counters, setCounters] = useState<GoalCounters>({ workouts: 0, workoutMin: 0, meditations: 0, water: 0, meals: 0, moods: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: gs }, wk, md] = await Promise.all([
      supabase.from('goals').select('*').order('created_at', { ascending: true }),
      supabase
        .from('workout_sessions')
        .select('created_at, duration_min')
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase
        .from('meditation_sessions')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const wkCount = (wk.data ?? []).length;
    const wkMin = (wk.data ?? []).reduce((s, w) => s + (w.duration_min ?? 0), 0);
    const medCount = (md.data ?? []).length;
    const moodCount = 0; // humeurs : calculé via useData (voir écran)
    const waterCount = 0; // eau : passé par l'écran

    setGoals((gs as Goal[]) ?? []);
    setCounters({ workouts: wkCount, workoutMin: wkMin, meditations: medCount, water: waterCount, meals: 0, moods: moodCount });
    setLoading(false);
    void today;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Complète les compteurs alimentation/eau/humeur depuis les autres hooks */
  const withCounters = useCallback(
    (extra: Partial<GoalCounters>) => ({ ...counters, ...extra }),
    [counters],
  );

  const createGoal = useCallback(
    async (g: { pillar: number; title: string; target?: number | null; unit?: string; period?: string; ends_on?: string | null }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;
      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        pillar: g.pillar,
        title: g.title,
        target: g.target ?? null,
        unit: g.unit ?? null,
        period: g.period ?? 'week',
        ends_on: g.ends_on ?? null,
      });
      if (!error) await refresh();
      return !error;
    },
    [refresh],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (!error) await refresh();
      return !error;
    },
    [refresh],
  );

  const progressOf = useCallback(
    (g: Goal, extra?: Partial<GoalCounters>): GoalProgress => computeProgress(g, { ...counters, ...extra }),
    [counters],
  );

  return { goals, counters, loading, refresh, withCounters, createGoal, deleteGoal, progressOf };
}

export const GOAL_PILLARS = [
  { pillar: 1, label: 'Sport', icon: 'dumbbell', color: '#FF5A1F' },
  { pillar: 2, label: 'Corps', icon: 'water', color: '#2E6BFF' },
  { pillar: 3, label: 'Mental', icon: 'meditation', color: '#8B5CF6' },
] as const;

export const GOAL_UNITS = ['séances', 'min', 'verres', 'repas', 'kg', 'sessions', 'humeurs'] as const;
