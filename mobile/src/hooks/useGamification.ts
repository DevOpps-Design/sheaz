/**
 * SHEAZ — Hook Gamification (S11C)
 * XP + niveaux, streak quotidien, résultats de quiz, défis du jour.
 * Persisté dans Supabase : colonnes profiles.xp/level/streak + tables
 * quiz_results et challenge_claims (migration 0002, RLS propriétaire).
 * API identique à la version locale (AsyncStorage) — bascule transparente.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { todayKey } from '../lib/store';

interface GamificationState {
  xp: number;
  streak: number;
  lastActiveDay: string | null;
  quizDone: Record<string, string>; // quizKey -> date (AAAA-MM-JJ)
  claimedChallenges: string[]; // ids de défis réclamés (challengeId:date)
}

const DEFAULT: GamificationState = {
  xp: 0,
  streak: 0,
  lastActiveDay: null,
  quizDone: {},
  claimedChallenges: [],
};

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

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const today = todayKey();
    const [prof, quizRows, claimRows] = await Promise.all([
      supabase.from('profiles').select('xp, level, streak, last_active_day').eq('id', user.id).maybeSingle(),
      supabase.from('quiz_results').select('quiz_key, answered_on').eq('user_id', user.id).eq('answered_on', today),
      supabase.from('challenge_claims').select('challenge_id').eq('user_id', user.id).eq('claimed_on', today),
    ]);

    const p = prof.data;
    const quizDone: Record<string, string> = {};
    (quizRows.data ?? []).forEach((r) => {
      quizDone[r.quiz_key as string] = r.answered_on as string;
    });
    const claimed = (claimRows.data ?? []).map((c) => `${c.challenge_id as string}:${today}`);

    // Comptabilise le streak à l'ouverture
    let next: GamificationState = {
      xp: Number(p?.xp ?? 0),
      streak: Number(p?.streak ?? 0),
      lastActiveDay: (p?.last_active_day as string) ?? null,
      quizDone,
      claimedChallenges: claimed,
    };
    if (next.lastActiveDay !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      next.streak = next.lastActiveDay === yesterday ? next.streak + 1 : 1;
      next.lastActiveDay = today;
      await supabase
        .from('profiles')
        .update({ streak: next.streak, last_active_day: today })
        .eq('id', user.id);
    }
    setState(next);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Persiste XP/niveau sur profiles (fire-and-forget, état local déjà à jour) */
  const persistProfile = useCallback((next: GamificationState) => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('profiles')
        .update({ xp: next.xp, level: levelFromXp(next.xp).level, streak: next.streak, last_active_day: next.lastActiveDay })
        .eq('id', user.id);
    })();
  }, []);

  const awardXp = useCallback(
    (amount: number) => {
      const next = { ...state, xp: state.xp + amount };
      setState(next);
      persistProfile(next);
    },
    [state, persistProfile],
  );

  const markQuizDone = useCallback(
    async (key: string, score = 8, total = 8) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const today = todayKey();
      await supabase
        .from('quiz_results')
        .upsert(
          { user_id: user.id, quiz_key: key, score, total, answered_on: today },
          { onConflict: 'user_id,quiz_key,answered_on' },
        );
      const next = { ...state, quizDone: { ...state.quizDone, [key]: today }, xp: state.xp + 15 };
      setState(next);
      persistProfile(next);
    },
    [state, persistProfile],
  );

  const markDailyAnswered = useCallback(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const today = todayKey();
      await supabase
        .from('quiz_results')
        .upsert(
          { user_id: user.id, quiz_key: 'daily', score: 1, total: 1, answered_on: today },
          { onConflict: 'user_id,quiz_key,answered_on' },
        );
    })();
    const next = { ...state, quizDone: { ...state.quizDone, daily: todayKey() }, xp: state.xp + 10 };
    setState(next);
    persistProfile(next);
  }, [state, persistProfile]);

  const claimChallenge = useCallback(
    (id: string) => {
      void (async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const today = todayKey();
        await supabase
          .from('challenge_claims')
          .upsert(
            { user_id: user.id, challenge_id: id, claimed_on: today },
            { onConflict: 'user_id,challenge_id,claimed_on' },
          );
      })();
      const next = {
        ...state,
        claimedChallenges: [...state.claimedChallenges, `${id}:${todayKey()}`],
        xp: state.xp + 30,
      };
      setState(next);
      persistProfile(next);
    },
    [state, persistProfile],
  );

  const isChallengeClaimed = useCallback(
    (id: string) => state.claimedChallenges.includes(`${id}:${todayKey()}`),
    [state],
  );

  const hasAnsweredDaily = state.quizDone['daily']?.slice(0, 10) === todayKey();
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
