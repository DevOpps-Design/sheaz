/**
 * SHEAZ — Achats intégrés — implémentation WEB (navigateur)
 * Utilisée automatiquement par Metro sur web (fichier .web.ts).
 * MODE DÉMO : pas de vrai paiement sur le web — l'achat est simulé et
 * l'entitlement est écrit en base (source 'simulated'). Sur mobile, le reçu
 * natif est vérifié côté serveur (Edge Function verify-receipt, S12).
 */
import { supabase } from './supabase';
import type { Plan } from '../hooks/useSubscription';

export const PRODUCT_IDS = {
  yearly: 'sheaz.premium.yearly',
  monthly: 'sheaz.premium.monthly',
} as const;

export async function isIapAvailable(): Promise<boolean> {
  // Web = démo : toujours "disponible" pour le parcours de test
  return true;
}

export async function getProducts(): Promise<{ id: string; price: string; title: string }[]> {
  return [
    { id: PRODUCT_IDS.yearly, price: '29,99 €', title: 'Sheaz Premium Annuel' },
    { id: PRODUCT_IDS.monthly, price: '4,99 €', title: 'Sheaz Premium Mensuel' },
  ];
}

/** Achat simulé (démo web) — écrit directement l'entitlement en base */
export async function purchase(plan: Plan): Promise<{ ok: boolean; message: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Connectez-vous pour activer Premium.' };
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + (plan === 'yearly' ? 12 : 1));
  const { error } = await supabase.from('subscriptions').upsert(
    {
      user_id: user.id,
      plan,
      source: 'simulated',
      status: 'active',
      current_period_end: periodEnd.toISOString(),
      auto_renew: true,
    },
    { onConflict: 'user_id,source' },
  );
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Premium activé (mode démo web) ✅' };
}

export async function restorePurchases(): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: 'Restauration disponible sur mobile (App Store / Play).' };
}
