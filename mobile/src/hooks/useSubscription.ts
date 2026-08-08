/**
 * SHEAZ — Hook Abonnement (S10 : freemium)
 * Lit l'entitlement depuis la table `subscriptions` (RLS propriétaire).
 * Le plan est défini côté serveur (inséré à l'achat) — ici on ne fait que lire
 * + upsert local après un achat validé (simulé web / reçu natif).
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Plan = 'free' | 'monthly' | 'yearly';
export type SubStatus = 'active' | 'expired' | 'cancelled' | 'grace';

export interface Subscription {
  id: string;
  plan: Plan;
  source: string;
  status: SubStatus;
  current_period_end: string | null;
  auto_renew: boolean;
}

const FREE: Subscription = { id: '', plan: 'free', source: '', status: 'active', current_period_end: null, auto_renew: false };

export function useSubscription() {
  const [sub, setSub] = useState<Subscription>(FREE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('subscriptions')
      .select('id, plan, source, status, current_period_end, auto_renew')
      .eq('user_id', user.id)
      .eq('source', 'simulated')
      .maybeSingle();
    setSub(data ?? FREE);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Upsert de l'entitlement après achat validé (source = simulated sur web/dev) */
  const setPlan = useCallback(
    async (plan: Plan, source = 'simulated', periodMonths = plan === 'yearly' ? 12 : 1) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + periodMonths);
      const { error } = await supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: user.id,
            plan,
            source,
            status: 'active',
            current_period_end: periodEnd.toISOString(),
            auto_renew: true,
          },
          { onConflict: 'user_id,source' },
        );
      if (!error) await refresh();
    },
    [refresh],
  );

  const isPremium = sub.plan !== 'free' && sub.status === 'active';

  return { sub, isPremium, loading, refresh, setPlan };
}
