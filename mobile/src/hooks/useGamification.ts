/**
 * SHEAZ — Hook Gamification (S11C)
 * XP + niveaux, streak quotidien, résultats de quiz, défis du jour.
 * Persisté localement (AsyncStorage) en attendant la migration 0002
 * (colonnes profiles.xp/level + table quiz_results).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getJson, setJson, todayKey } from '../lib/store';

interface GamificationState {
  xp: number;
  streak: number;
  lastActiveDay: string | null;
  quizDone: Record<string, string>; // quizKey -> date ISO
  dailyAnswered: string | null; // date du dernier daily répondu
  claimedChallenges: string[]; // ids de défis réclamés (dates incluses)
}

const DEFAULT: GamificationState = {
  xp: 0,
  streak: 0,
  lastActiveDay: null,
  quizDone: {},
  dailyAnswered: null,
  claimedChallenges: [],
};

const KEY = 'sheaz.gamification.v1';

/** XP requis pour atteindre un niveau : niveau n = 80 × n × (n+1) / 2 cumulé */
export function xpForLevel(level: number): number {
  return 80 * ((level * (level + 1)) / 2);
}

export function levelFromXp(xp: number): { level: number; into: number; needed: number } {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level += 1;
  const base = level === 1 ? 0 : xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, into: xp - base, needed: next - base };
}

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Débutant',
  2: 'Curieux',
  3: 'Régulier',
  4: 'Assidu',
  5: 'Passionné',
  6: 'Dévoué',
  7: 'Expert',
  8: 'Champion',
  9: 'Légende',
  10: 'Maître du bien-être',
};

export interface Challenge {
  id: string;
  label: string;
  icon: string;
  xp: number;
  /** vérifie si le défi est accompli (données réelles du jour) */
  check: () => boolean;
}

export function useGamification() {
  const [state, setState] = useState<GamificationState>(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getJson<GamificationState>(KEY, DEFAULT).then((s) => {
      // Comptabilise le streak à l'ouverture
      const today = todayKey();
      let next = { ...s };
      if (s.lastActiveDay !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        next.streak = s.lastActiveDay === yesterday ? (s.streak ?? 0) + 1 : 1;
        next.lastActiveDay = today;
        setJson(KEY, next);
      }
      setState(next);
      setReady(true);
    });
  }, []);

  const save = useCallback((next: GamificationState) => {
    setState(next);
    setJson(KEY, next);
  }, []);

  const awardXp = useCallback(
    (amount: number) => save({ ...state, xp: state.xp + amount }),
    [state, save],
  );

  const markQuizDone = useCallback(
    (key: string) => {
      const quizDone = { ...state.quizDone, [key]: new Date().toISOString() };
      save({ ...state, quizDone, xp: state.xp + 15 });
    },
    [state, save],
  );

  const markDailyAnswered = useCallback(
    () => save({ ...state, dailyAnswered: todayKey(), xp: state.xp + 10 }),
    [state, save],
  );

  const claimChallenge = useCallback(
    (id: string) => save({ ...state, claimedChallenges: [...state.claimedChallenges, `${id}:${todayKey()}`], xp: state.xp + 30 }),
    [state, save],
  );

  const isChallengeClaimed = useCallback(
    (id: string) => state.claimedChallenges.includes(`${id}:${todayKey()}`),
    [state],
  );

  const hasAnsweredDaily = state.dailyAnswered === todayKey();
  const hasDoneQuiz = (key: string) => state.quizDone[key]?.slice(0, 10) === todayKey();

  const { level, into, needed } = useMemo(() => levelFromXp(state.xp), [state.xp]);

  return {
    ...state,
    ready,
    level,
    levelInto: into,
    levelNeeded: needed,
    levelTitle: LEVEL_TITLES[level] ?? 'Maître du bien-être',
    awardXp,
    markQuizDone,
    markDailyAnswered,
    claimChallenge,
    isChallengeClaimed,
    hasAnsweredDaily,
    hasDoneQuiz,
  };
}
