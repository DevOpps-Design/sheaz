/**
 * SHEAZ — Hook Corps (S8 : module Bien-être complet)
 * Sommeil (sleep_entries), hydratation (hydration_entries), poids (body_metrics).
 * Tout est persisté en base avec RLS (user_id = auth.uid()).
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const today = () => new Date().toISOString().slice(0, 10);

/* ---------------------------------- Sommeil ---------------------------------- */

export interface SleepEntry {
  sleep_date: string;
  duration_min: number | null;
  quality: number | null; // 1-5
}

export function useSleep() {
  const [entry, setEntry] = useState<SleepEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('sleep_entries')
      .select('sleep_date, duration_min, quality')
      .eq('user_id', user.id)
      .order('sleep_date', { ascending: false })
      .limit(7);
    // Dernière nuit enregistrée (la plus récente, souvent hier)
    setEntry(data?.[0] ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Enregistre (upsert) la durée de sommeil pour une date donnée */
  const saveSleep = useCallback(
    async (sleepDate: string, patch: { duration_min?: number | null; quality?: number | null }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('sleep_entries')
        .upsert({ user_id: user.id, sleep_date: sleepDate, ...patch }, { onConflict: 'user_id,sleep_date' });
      setEntry((prev) => (prev && prev.sleep_date === sleepDate ? { ...prev, ...patch } : prev));
      refresh();
    },
    [refresh],
  );

  /** Ajuste la durée de la nuit affichée par pas de 15 min */
  const adjustDuration = useCallback(
    async (deltaMin: number) => {
      const target = entry?.sleep_date ?? today();
      const base = entry?.duration_min ?? 7 * 60 + 30; // défaut 7h30
      const next = Math.max(0, Math.min(16 * 60, base + deltaMin));
      await saveSleep(target, { duration_min: next });
    },
    [entry, saveSleep],
  );

  const setQuality = useCallback(
    async (q: number) => {
      const target = entry?.sleep_date ?? today();
      await saveSleep(target, { quality: q });
    },
    [entry, saveSleep],
  );

  const durationLabel = (min: number | null | undefined) => {
    if (min == null) return '—';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
  };

  return { entry, loading, refresh, saveSleep, adjustDuration, setQuality, durationLabel };
}

/* ---------------------------------- Hydratation ---------------------------------- */

export function useHydration() {
  const [glasses, setGlasses] = useState(0);
  const [loading, setLoading] = useState(true);
  const GOAL = 8;

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('hydration_entries')
      .select('glasses')
      .eq('user_id', user.id)
      .eq('entry_date', today())
      .maybeSingle();
    setGlasses(data?.glasses ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setGlassesCount = useCallback(
    async (count: number) => {
      const clamped = Math.max(0, Math.min(20, count));
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('hydration_entries')
        .upsert({ user_id: user.id, entry_date: today(), glasses: clamped }, { onConflict: 'user_id,entry_date' });
      setGlasses(clamped);
    },
    [],
  );

  const addGlass = useCallback(() => setGlassesCount(glasses + 1), [glasses, setGlassesCount]);
  const removeGlass = useCallback(() => setGlassesCount(glasses - 1), [glasses, setGlassesCount]);

  return { glasses, goal: GOAL, loading, refresh, addGlass, removeGlass, setGlassesCount };
}

/* ---------------------------------- Poids ---------------------------------- */

export interface WeightEntry {
  id: string;
  value: number;
  unit: string;
  measured_on: string;
}

export function useWeight() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('body_metrics')
      .select('id, value, unit, measured_on')
      .eq('user_id', user.id)
      .eq('metric_type', 'weight')
      .order('measured_on', { ascending: false })
      .limit(14);
    setEntries(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addWeight = useCallback(
    async (kg: number) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('body_metrics')
        .insert({ user_id: user.id, metric_type: 'weight', value: kg, unit: 'kg', measured_on: today() });
      refresh();
    },
    [refresh],
  );

  const latest = entries[0] ?? null;
  const previous = entries[1] ?? null;
  const delta = latest && previous ? Math.round((latest.value - previous.value) * 10) / 10 : null;

  return { entries, latest, delta, loading, refresh, addWeight };
}
