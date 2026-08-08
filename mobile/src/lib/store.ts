/**
 * SHEAZ — Couche de persistance locale (S11)
 * AsyncStorage (natif + web via localStorage). Utilisée en attendant
 * l'application de la migration 0002 (tables food_logs/quiz_results +
 * colonnes XP) ; les écrans/hooks gardent la même API lors du branchement Supabase.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // stockage indisponible : silencieux
  }
}

export function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
