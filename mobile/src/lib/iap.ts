/**
 * SHEAZ — Achats intégrés — implémentation NATIVE (iOS/Android)
 * Utilisée automatiquement par Metro sur natif (fichier .ts résolu par défaut).
 * react-native-iap v16 (OpenIAP) : nécessite un build de développement (EAS) —
 * les produits doivent être déclarés dans App Store Connect / Play Console.
 * En Expo Go le module natif est absent → retombe en mode simulé (message clair).
 * Depuis S12 : le reçu est VÉRIFIÉ côté serveur (Edge Function verify-receipt).
 *
 * ⚠️ Expo Go : react-native-iap v16 dépend de react-native-nitro-modules
 * (TurboModule natif ABSENT d'Expo Go) → le `require()` THROW au chargement.
 * On ne charge donc JAMAIS le module dans Expo Go (guard isRunningInExpoGo
 * + require dynamique try/catch) : toutes les fonctions passent en mode
 * dégradé propre. Les achats réels fonctionneront sur les builds natifs.
 */
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import type * as IapNS from 'react-native-iap';
import type { ProductOrSubscription, Purchase } from 'react-native-iap';

import { supabase } from './supabase';
import type { Plan } from '../hooks/useSubscription';

export const PRODUCT_IDS = {
  yearly: 'sheaz.premium.yearly',
  monthly: 'sheaz.premium.monthly',
} as const;

type IapModule = typeof IapNS;

const RUNNING_IN_EXPO_GO = isRunningInExpoGo();
let iapCache: IapModule | null | undefined; // undefined = pas encore tenté
let connected = false;

/**
 * Charge react-native-iap UNIQUEMENT hors Expo Go.
 * Dans Expo Go, le require() déclenche un crash (TurboModule natif absent) → null.
 */
function getIap(): IapModule | null {
  if (RUNNING_IN_EXPO_GO) return null;
  if (iapCache !== undefined) return iapCache;
  try {
    // Require dynamique : le module (nitro-modules) ne s'exécute que s'il est
    // réellement chargé — jamais dans Expo Go. En cas d'échec → mode dégradé.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-iap') as IapModule & { default?: IapModule };
    iapCache = mod.default ?? mod;
  } catch {
    iapCache = null; // module indisponible → achats désactivés proprement
  }
  return iapCache;
}

async function ensureConnected(): Promise<boolean> {
  const iap = getIap();
  if (!iap) return false;
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
  const iap = getIap();
  if (!iap || !(await ensureConnected())) return [];
  try {
    const products = await iap.fetchProducts({ skus: Object.values(PRODUCT_IDS), type: 'subs' });
    if (!products) return [];
    return products.map((p: ProductOrSubscription) => ({ id: p.id, price: p.displayPrice, title: p.title }));
  } catch {
    return [];
  }
}

/** Extrait le reçu à envoyer au serveur (iOS: transactionReceipt · Android: purchaseToken) */
function receiptOf(p: Purchase): string {
  const anyP = p as unknown as { transactionReceipt?: string; purchaseToken?: string };
  return anyP.transactionReceipt ?? anyP.purchaseToken ?? '';
}

/**
 * Vérification serveur du reçu (Edge Function verify-receipt, S12).
 * Retourne true si le serveur a validé ET écrit l'entitlement (service role).
 * Le fallback local (source 'store') reste pour les stores non configurés.
 */
async function verifyReceiptServer(p: Purchase): Promise<boolean> {
  const receipt = receiptOf(p);
  if (!receipt) return false;
  try {
    const { data, error } = await supabase.functions.invoke('verify-receipt', {
      body: {
        platform: Platform.OS === 'ios' ? 'apple' : 'google',
        receipt,
        productId: p.productId,
      },
    });
    return !error && data?.ok === true;
  } catch {
    return false;
  }
}

/**
 * Lance l'achat réel d'un abonnement. Le reçu est vérifié côté serveur
 * (Edge Function verify-receipt → Apple/Google) ; en cas d'échec de
 * configuration du store, fallback sur l'enregistrement local.
 */
export async function purchase(plan: Plan): Promise<{ ok: boolean; message: string }> {
  const iap = getIap();
  if (!iap || !(await ensureConnected())) {
    return { ok: false, message: 'Achats indisponibles ici (build natif requis).' };
  }
  try {
    const sku = plan === 'yearly' ? PRODUCT_IDS.yearly : PRODUCT_IDS.monthly;
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
    let verified = false;
    for (const p of purchases) {
      await iap.finishTransaction({ purchase: p, isConsumable: false });
      verified = (await verifyReceiptServer(p)) || verified;
    }

    if (user && purchases.length > 0 && !verified) {
      // Fallback (stores non configurés côté serveur) — entitlement local
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
    return {
      ok: purchases.length > 0,
      message: verified
        ? 'Achat vérifié côté serveur ✅'
        : purchases.length > 0
          ? 'Achat confirmé ✅'
          : 'Aucun achat retourné.',
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Achat annulé.' };
  }
}

/** Restaure les achats précédents (App Store / Play) — reçu vérifié côté serveur */
export async function restorePurchases(): Promise<{ ok: boolean; message: string }> {
  const iap = getIap();
  if (!iap || !(await ensureConnected())) {
    return { ok: false, message: 'Restauration indisponible ici (build natif requis).' };
  }
  try {
    const purchases = await iap.getAvailablePurchases();
    if (purchases.length === 0) return { ok: false, message: 'Aucun achat à restaurer.' };
    const p: Purchase = purchases[0];
    const plan: Plan = p.productId.includes('yearly') ? 'yearly' : 'monthly';

    let verified = false;
    for (const purchase of purchases) {
      verified = (await verifyReceiptServer(purchase)) || verified;
    }

    if (!verified) {
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
    }
    return { ok: true, message: verified ? 'Abonnement restauré et vérifié ✅' : 'Abonnement restauré ✅' };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Restauration impossible.' };
  }
}
