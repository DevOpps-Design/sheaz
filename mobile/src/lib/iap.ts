/**
 * SHEAZ — Achats intégrés — implémentation NATIVE (iOS/Android)
 * Utilisée automatiquement par Metro sur natif (fichier .ts résolu par défaut).
 * react-native-iap v16 (OpenIAP) : nécessite un build de développement (EAS) —
 * les produits doivent être déclarés dans App Store Connect / Play Console (S11-S12).
 * En Expo Go le module natif est absent → retombe en mode simulé (message clair).
 */
import * as iap from 'react-native-iap';
import type { ProductOrSubscription, Purchase } from 'react-native-iap';

import { supabase } from './supabase';
import type { Plan } from '../hooks/useSubscription';

export const PRODUCT_IDS = {
  yearly: 'sheaz.premium.yearly',
  monthly: 'sheaz.premium.monthly',
} as const;

let connected = false;

async function ensureConnected(): Promise<boolean> {
  try {
    if (!connected) {
      await iap.initConnection();
      connected = true;
    }
    return true;
  } catch {
    return false;
  }
}

export async function isIapAvailable(): Promise<boolean> {
  return ensureConnected();
}

/** Récupère les prix réels des produits (depuis les stores) */
export async function getProducts(): Promise<{ id: string; price: string; title: string }[]> {
  if (!(await ensureConnected())) return [];
  try {
    const products = await iap.fetchProducts({ skus: Object.values(PRODUCT_IDS), type: 'subs' });
    if (!products) return [];
    return products.map((p: ProductOrSubscription) => ({ id: p.id, price: p.displayPrice, title: p.title }));
  } catch {
    return [];
  }
}

/**
 * Lance l'achat réel d'un abonnement. À la fin : finishTransaction +
 * enregistrement de l'entitlement en base (source 'store'). La VÉRIFICATION du
 * reçu côté serveur (Edge Function + Apple/Google) sera durcie en S11.
 */
export async function purchase(plan: Plan): Promise<{ ok: boolean; message: string }> {
  const sku = plan === 'yearly' ? PRODUCT_IDS.yearly : PRODUCT_IDS.monthly;
  if (!(await ensureConnected())) {
    return { ok: false, message: 'Achats indisponibles ici (build natif requis).' };
  }
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const purchaseResult = await iap.requestPurchase({
      request: {
        apple: { sku },
        google: { skus: [sku], obfuscatedAccountId: user?.id },
      },
      type: 'subs',
    });

    const purchases = Array.isArray(purchaseResult) ? purchaseResult : purchaseResult ? [purchaseResult] : [];
    for (const p of purchases) {
      await iap.finishTransaction({ purchase: p, isConsumable: false });
    }

    if (user) {
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + (plan === 'yearly' ? 12 : 1));
      await supabase.from('subscriptions').upsert(
        {
          user_id: user.id,
          plan,
          source: 'store',
          status: 'active',
          current_period_end: periodEnd.toISOString(),
          auto_renew: true,
        },
        { onConflict: 'user_id,source' },
      );
    }
    return { ok: purchases.length > 0, message: purchases.length > 0 ? 'Achat confirmé ✅' : 'Aucun achat retourné.' };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Achat annulé.' };
  }
}

/** Restaure les achats précédents (App Store / Play) */
export async function restorePurchases(): Promise<{ ok: boolean; message: string }> {
  if (!(await ensureConnected())) {
    return { ok: false, message: 'Restauration indisponible ici (build natif requis).' };
  }
  try {
    const purchases = await iap.getAvailablePurchases();
    if (purchases.length === 0) return { ok: false, message: 'Aucun achat à restaurer.' };
    const p: Purchase = purchases[0];
    const plan: Plan = p.productId.includes('yearly') ? 'yearly' : 'monthly';
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('subscriptions').upsert(
        {
          user_id: user.id,
          plan,
          source: 'store',
          status: 'active',
          auto_renew: true,
        },
        { onConflict: 'user_id,source' },
      );
    }
    return { ok: true, message: 'Abonnement restauré ✅' };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Restauration impossible.' };
  }
}
