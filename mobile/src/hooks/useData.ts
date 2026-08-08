/**
 * SHEAZ — Hooks de données (Supabase)
 * Chargement + actions par domaine. Re-fetch simple + rafraîchissement.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/* ---------------------------------- Habitudes ---------------------------------- */

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  pillar: number;
  reminder_time: string | null;
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: h } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');
    setHabits(h ?? []);

    const { data: l } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('done_on', new Date().toISOString().slice(0, 10));
    const map: Record<string, boolean> = {};
    (l ?? []).forEach((row) => (map[row.habit_id as string] = true));
    setLogs(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (habitId: string) => {
      const done = !logs[habitId];
      setLogs((prev) => ({ ...prev, [habitId]: done }));
      if (done) {
        await supabase.from('habit_logs').insert({ habit_id: habitId });
      } else {
        await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('done_on', new Date().toISOString().slice(0, 10));
      }
    },
    [logs],
  );

  return { habits, logs, toggle, loading, refresh };
}

/* ---------------------------------- Humeur ---------------------------------- */

export function useMood() {
  const [mood, setMoodState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('mood_entries')
      .select('mood')
      .eq('user_id', user.id)
      .gte('logged_at', today)
      .order('logged_at', { ascending: false })
      .limit(1);
    setMoodState(data?.[0]?.mood ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setMood = useCallback(async (value: number) => {
    setMoodState(value);
    await supabase.from('mood_entries').insert({ mood: value });
  }, []);

  return { mood, setMood, loading, refresh };
}

/* ---------------------------------- Séances sport ---------------------------------- */

export function useWorkoutSession() {
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1);
    if (data?.[0]) {
      setRunning(true);
      setStartedAt(data[0].started_at as string);
      setSeconds(Math.floor((Date.now() - new Date(data[0].started_at).getTime()) / 1000));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const now = new Date().toISOString();
    await supabase.from('workout_sessions').insert({ user_id: user.id, started_at: now });
    setRunning(true);
    setStartedAt(now);
    setSeconds(0);
  }, []);

  const stop = useCallback(async () => {
    if (!startedAt) return;
    const now = new Date().toISOString();
    await supabase
      .from('workout_sessions')
      .update({ ended_at: now, duration_sec: seconds, calories: Math.round(seconds * 0.09) })
      .eq('started_at', startedAt)
      .is('ended_at', null);
    setRunning(false);
    setStartedAt(null);
    setSeconds(0);
  }, [startedAt, seconds]);

  return { running, seconds, loading, start, stop };
}

/* ---------------------------------- Dashboard ---------------------------------- */

export interface DashboardData {
  sport: { percent: number; label: string };
  corps: { percent: number; label: string };
  mental: { percent: number; label: string };
  refresh: () => Promise<void>;
  loading: boolean;
}

export function useDashboard(): DashboardData {
  const [data, setData] = useState({
    sport: { percent: 0, label: 'Chargement…' },
    corps: { percent: 0, label: 'Chargement…' },
    mental: { percent: 0, label: 'Chargement…' },
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);

    // Objectifs
    const { data: goals } = await supabase.from('goals').select('*').eq('user_id', user.id);
    const goalFor = (pillar: number) =>
      (goals ?? []).filter((g) => g.pillar === pillar);

    // Habitudes + logs du jour
    const { data: habits } = await supabase.from('habits').select('*').eq('user_id', user.id);
    const { data: habitLogs } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('done_on', today);
    const doneToday = new Set((habitLogs ?? []).map((r) => r.habit_id));

    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', today);

    const { data: mood } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', today);

    const habitFor = (pillar: number) =>
      (habits ?? []).filter((h) => h.pillar === pillar);

    // Sport : séances de la semaine vs objectif
    const sportGoal = goalFor(1)[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const { data: weekSessions } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', weekStart.toISOString())
      .not('ended_at', 'is', null);
    const sportCount = (weekSessions ?? []).length;
    const sportPercent = sportGoal?.target ? Math.min(100, Math.round((sportCount / sportGoal.target) * 100)) : sportCount > 0 ? 50 : 0;

    // Corps : habitudes du jour
    const corpsHabits = habitFor(2);
    const corpsDone = corpsHabits.filter((h) => doneToday.has(h.id)).length;
    const corpsPercent = corpsHabits.length ? Math.round((corpsDone / corpsHabits.length) * 100) : 0;

    // Mental : méditations + humeur
    const mentalHabits = habitFor(3);
    const mentalDone = mentalHabits.filter((h) => doneToday.has(h.id)).length;
    const mentalCount = mentalDone + (mood?.length ? 1 : 0);
    const mentalPercent = Math.min(100, Math.round((mentalCount / Math.max(1, mentalHabits.length + 1)) * 100));

    setData({
      sport: {
        percent: sportPercent,
        label: sportGoal ? `${sportCount}/${sportGoal.target} séances cette semaine` : 'Aucun objectif',
      },
      corps: {
        percent: corpsPercent,
        label: `${corpsDone}/${corpsHabits.length} habitudes aujourd’hui`,
      },
      mental: {
        percent: mentalPercent,
        label: mood?.length ? 'Humeur notée' : 'Humeur à noter',
      },
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, refresh, loading };
}
