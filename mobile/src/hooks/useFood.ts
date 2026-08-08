/**
 * SHEAZ — Hook Alimentation (S11A)
 * Journal des repas persisté localement (AsyncStorage) en attendant la
 * migration 0002 (table food_logs). API identique pour la bascule Supabase.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Food } from '../data/foods';
import { healthScore } from '../data/foods';
import { getJson, setJson, todayKey, uid } from '../lib/store';

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

const KEY = 'sheaz.food_logs.v1';

export function useFood() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getJson<FoodLog[]>(KEY, []).then((l) => {
      setLogs(l);
      setReady(true);
    });
  }, []);

  const persist = useCallback((next: FoodLog[]) => {
    setLogs(next);
    setJson(KEY, next);
  }, []);

  const addLog = useCallback(
    (food: Food, meal: MealType, qty = 1) => {
      const log: FoodLog = {
        id: uid(),
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
        loggedAt: new Date().toISOString(),
      };
      persist([...logs, log]);
    },
    [logs, persist],
  );

  const removeLog = useCallback(
    (id: string) => persist(logs.filter((l) => l.id !== id)),
    [logs, persist],
  );

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
