/**
 * SHEAZ — Hook Méditations (S9 : module Mental complet)
 * Sessions réellement persistées dans meditation_sessions (RLS user).
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface MeditationSession {
  id: string;
  title: string;
  duration_sec: number;
  completed_at: string;
}

export function useMeditations() {
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('meditation_sessions')
      .select('id, title, duration_sec, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(20);
    setSessions(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Enregistre une session terminée */
  const logSession = useCallback(
    async (title: string, durationSec: number) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('meditation_sessions')
        .insert({ user_id: user.id, title, duration_sec: durationSec });
      refresh();
    },
    [refresh],
  );

  const today = new Date().toISOString().slice(0, 10);
  const countToday = sessions.filter((s) => (s.completed_at ?? '').slice(0, 10) === today).length;
  const totalMinutes = Math.round(sessions.reduce((acc, s) => acc + (s.duration_sec ?? 0), 0) / 60);

  return { sessions, countToday, totalMinutes, loading, refresh, logSession };
}
