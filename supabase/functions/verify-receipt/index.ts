/**
 * SHEAZ — verify-receipt (S12)
 * Edge Function Supabase : vérification serveur des reçus d'abonnement
 * Apple App Store (verifyReceipt) et Google Play (Play Developer API).
 *
 * ── Appel ─────────────────────────────────────────────────────────────
 * POST /functions/v1/verify-receipt   (auth requise : JWT Supabase)
 * {
 *   "platform":  "apple" | "google",
 *   "receipt":   "…",            // iOS: transactionReceipt (base64) · Android: purchaseToken
 *   "productId": "sheaz.premium.yearly" | "sheaz.premium.monthly"
 * }
 *
 * ── Secrets requis (Project Settings → Edge Functions secrets) ─────────
 *   APPLE_SHARED_SECRET        — Shared Secret App Store Connect
 *   GOOGLE_SERVICE_ACCOUNT     — JSON du service account Play Console (string)
 *   GOOGLE_PACKAGE_NAME        — "com.sheaz.app"
 *
 * ── Sécurité ──────────────────────────────────────────────────────────
 * L'identité est prise depuis le JWT Supabase (auth.getUser) — le userId
 * est toujours celui de l'utilisateur authentifié, jamais fourni par le client.
 * L'upsert de l'entitlement passe par la clé service role (auto-injectée).
 */
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';
import { SignJWT, importPKCS8 } from 'npm:jose@^5.2.0';

const APPLE_PROD = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

function planFromProductId(productId: string | undefined): 'yearly' | 'monthly' {
  return productId?.includes('yearly') ? 'yearly' : 'monthly';
}

/** Source interne pour la table subscriptions */
function sourceFor(platform: string): string {
  return platform === 'apple' ? 'appstore' : 'playstore';
}

// ═══════════════════════ APPLE ═══════════════════════

interface AppleReceiptInfo {
  product_id?: string;
  expires_date_ms?: string;
  is_trial_period?: string;
  auto_renew_status?: string;
}

async function verifyApple(receipt: string): Promise<{ ok: boolean; plan: 'yearly' | 'monthly'; expiresAt: string; reason?: string }> {
  const secret = Deno.env.get('APPLE_SHARED_SECRET');
  if (!secret) return { ok: false, plan: 'monthly', expiresAt: '', reason: 'APPLE_SHARED_SECRET non configuré' };

  const body = { 'receipt-data': receipt, password: secret, 'exclude-old-transactions': true };
  let res = await fetch(APPLE_PROD, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let data = await res.json() as { status: number; latest_receipt_info?: AppleReceiptInfo[] };

  // 21007 = reçu sandbox envoyé à la prod → re-tenter sur le sandbox
  if (data.status === 21007) {
    res = await fetch(APPLE_SANDBOX, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    data = await res.json() as { status: number; latest_receipt_info?: AppleReceiptInfo[] };
  }

  if (data.status !== 0) {
    const reasons: Record<number, string> = {
      21000: 'App Store inaccessible', 21002: 'reçu malformé', 21003: 'erreur d’authentification',
      21004: 'shared secret invalide', 21005: 'serveur indisponible', 21008: 'reçu prod envoyé au sandbox',
      21010: 'reçu anormal', 21100: 'erreur interne App Store',
    };
    return { ok: false, plan: 'monthly', expiresAt: '', reason: `Apple status ${data.status} — ${reasons[data.status] ?? 'reçu invalide'}` };
  }

  const info = data.latest_receipt_info?.[0];
  const expiresMs = info?.expires_date_ms;
  if (!expiresMs) return { ok: false, plan: 'monthly', expiresAt: '', reason: 'abonnement sans date d’expiration' };

  return { ok: true, plan: planFromProductId(info?.product_id), expiresAt: new Date(Number(expiresMs)).toISOString() };
}

// ═══════════════════════ GOOGLE ═══════════════════════

async function googleAccessToken(): Promise<string> {
  const svc = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
  if (!svc) throw new Error('GOOGLE_SERVICE_ACCOUNT non configuré');
  const account = JSON.parse(svc) as { client_email: string; private_key: string };
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(account.private_key, 'RS256');
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/androidpublisher' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(account.client_email)
    .setAudience(GOOGLE_TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json() as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`OAuth Google: ${data.error ?? 'inconnu'}`);
  return data.access_token;
}

interface GoogleSubResponse {
  paymentState?: number;
  expiryTimeMillis?: string;
  autoRenewing?: boolean;
  obfuscatedExternalAccountId?: string;
  error?: { message?: string; code?: number };
}

async function verifyGoogle(receipt: string, productId: string, userId: string): Promise<{ ok: boolean; plan: 'yearly' | 'monthly'; expiresAt: string; reason?: string }> {
  const pkg = Deno.env.get('GOOGLE_PACKAGE_NAME') ?? 'com.sheaz.app';
  const token = await googleAccessToken();
  const url = `${GOOGLE_API}/${pkg}/purchases/subscriptions/${productId}/tokens/${receipt}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json() as GoogleSubResponse;

  if (res.status !== 200 || data.error) {
    return { ok: false, plan: 'monthly', expiresAt: '', reason: `Google: ${data.error?.message ?? 'erreur API'}` };
  }
  // Liens anti-fraude : l'achat doit appartenir à l'utilisateur courant
  if (data.obfuscatedExternalAccountId && data.obfuscatedExternalAccountId !== userId) {
    return { ok: false, plan: 'monthly', expiresAt: '', reason: 'l’achat ne correspond pas à ce compte' };
  }
  const expiresMs = data.expiryTimeMillis;
  if (!expiresMs) return { ok: false, plan: 'monthly', expiresAt: '', reason: 'abonnement sans expiration' };
  if (Number(expiresMs) < Date.now()) return { ok: false, plan: 'monthly', expiresAt: '', reason: 'abonnement expiré' };

  return { ok: true, plan: planFromProductId(productId), expiresAt: new Date(Number(expiresMs)).toISOString() };
}

// ═══════════════════════ HANDLER ═══════════════════════

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  // Identité : JWT Supabase (jamais de userId client)
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return json({ error: 'Non authentifié' }, 401);
  const userId = userData.user.id;

  let body: { platform?: string; receipt?: string; productId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps JSON invalide' }, 400);
  }
  const { platform, receipt, productId } = body;
  if (!platform || !receipt) return json({ error: 'platform et receipt requis' }, 400);
  if (platform !== 'apple' && platform !== 'google') return json({ error: 'platform doit être apple ou google' }, 400);

  let verdict: { ok: boolean; plan: 'yearly' | 'monthly'; expiresAt: string; reason?: string };
  try {
    verdict = platform === 'apple'
      ? await verifyApple(receipt)
      : await verifyGoogle(receipt, productId ?? 'sheaz.premium.monthly', userId);
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : 'store non configuré' }, 402);
  }

  if (!verdict.ok) return json({ ok: false, error: verdict.reason ?? 'reçu invalide' }, 402);

  // Upsert de l'entitlement côté serveur (service role)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
  const { error: upsertErr } = await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      plan: verdict.plan,
      source: sourceFor(platform),
      status: 'active',
      current_period_end: verdict.expiresAt,
      auto_renew: true,
    },
    { onConflict: 'user_id,source' },
  );
  if (upsertErr) return json({ ok: false, error: `Erreur base: ${upsertErr.message}` }, 500);

  return json({ ok: true, plan: verdict.plan, expires_at: verdict.expiresAt, source: sourceFor(platform) });
});
