/**
 * SHEAZ — Hook Alimentation (S11A)
 * Journal des repas persisté dans Supabase (table food_logs, RLS propriétaire).
 * API identique à la version locale (AsyncStorage) — bascule transparente pour les écrans.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Food } from '../data/foods';
import { healthScore } from '../data/foods';
import { supabase } from '../lib/supabase';
import { todayKey } from '../lib/store';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEALS: { key: MealType; label: string; icon: string; hint: string }[] = [
  { key: 'breakfast', label: 'Petit-déjeuner', icon: 'weather-sunny', hint: 'Démarrez la journée' },
  { key: 'lunch', label: 'Déjeuner', icon: 'white-balance-sunny', hint: 'Repas du midi' },
  { key: 'dinner', label: 'Dîner', icon: 'weather-night', hint: 'Léger et digeste' },
  { key: 'snack', label: 'Collations', icon: 'cookie', hint: 'Encas malins' },
];

export interface FoodLog {
  id: string;
  foodId: string;
  name: string;
  meal: MealType;
  qty: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  score: number; // 0-4
  loggedAt: string;
}

export function useFood() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('food_logs')
      .select('*')
      .order('logged_on', { ascending: false })
      .limit(500);
    if (error) return;
    setLogs(
      (data ?? []).map((r) => ({
        id: r.id as string,
        foodId: (r.food_id as string) ?? (r.food_name as string),
        name: r.food_name as string,
        meal: r.meal_type as MealType,
        qty: 1,
        kcal: Number(r.kcal ?? 0),
        proteinG: Number(r.protein_g ?? 0),
        carbsG: 0,
        fatG: 0,
        fiberG: Number(r.fiber_g ?? 0),
        sugarG: Number(r.sugar_g ?? 0),
        score: Number(r.score ?? 2),
        loggedAt: (r.logged_on as string) ?? '',
      })),
    );
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addLog = useCallback(
    async (food: Food, meal: MealType, qty = 1) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('food_logs')
        .insert({
          user_id: user.id,
          food_name: food.name,
          meal_type: meal,
          kcal: Math.round(food.kcal * qty),
          protein_g: Math.round(food.proteinG * qty * 10) / 10,
          fiber_g: Math.round(food.fiberG * qty * 10) / 10,
          sugar_g: Math.round(food.sugarG * qty * 10) / 10,
          score: healthScore(food),
          logged_on: todayKey(),
        })
        .select()
        .single();
      if (error || !data) return;
      setLogs((prev) => [
        {
          id: data.id as string,
          foodId: food.id,
          name: food.name,
          meal,
          qty,
          kcal: Math.round(food.kcal * qty),
          proteinG: Math.round(food.proteinG * qty * 10) / 10,
          carbsG: Math.round(food.carbsG * qty * 10) / 10,
          fatG: Math.round(food.fatG * qty * 10) / 10,
          fiberG: Math.round(food.fiberG * qty * 10) / 10,
          sugarG: Math.round(food.sugarG * qty * 10) / 10,
          score: healthScore(food),
          loggedAt: todayKey(),
        },
        ...prev,
      ]);
    },
    [],
  );

  const removeLog = useCallback(async (id: string) => {
    await supabase.from('food_logs').delete().eq('id', id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const todayLogs = useMemo(() => logs.filter((l) => l.loggedAt.slice(0, 10) === todayKey()), [logs]);

  const meals = useMemo(
    () => ({
      breakfast: todayLogs.filter((l) => l.meal === 'breakfast'),
      lunch: todayLogs.filter((l) => l.meal === 'lunch'),
      dinner: todayLogs.filter((l) => l.meal === 'dinner'),
      snack: todayLogs.filter((l) => l.meal === 'snack'),
    }),
    [todayLogs],
  );

  const totals = useMemo(() => {
    const t = todayLogs.reduce(
      (acc, l) => {
        acc.kcal += l.kcal;
        acc.proteinG += l.proteinG;
        acc.carbsG += l.carbsG;
        acc.fatG += l.fatG;
        acc.fiberG += l.fiberG;
        acc.sugarG += l.sugarG;
        return acc;
      },
      { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0 },
    );
    return t;
  }, [todayLogs]);

  /** Score santé moyen du jour (0-4), null si aucun repas */
  const avgScore = useMemo(() => {
    if (todayLogs.length === 0) return null;
    return todayLogs.reduce((s, l) => s + l.score, 0) / todayLogs.length;
  }, [todayLogs]);

  const mealCount = todayLogs.length;

  return { logs, ready, todayLogs, meals, totals, avgScore, mealCount, addLog, removeLog };
}
