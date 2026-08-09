# verify-receipt — Edge Function S12

Vérification **serveur** des reçus d'abonnement Premium :
- **Apple App Store** : endpoint legacy `verifyReceipt` (prod + bascule sandbox 21007)
- **Google Play** : Play Developer API v3 (JWT RS256 via service account → OAuth → `purchases.subscriptions.get`)

L'entitlement est écrit dans `subscriptions` (source `appstore` / `playstore`)
avec la **clé service role** — le client ne peut pas s'auto-entitle.

## Secrets à configurer (Project Settings → Edge Functions → Secrets)

| Secret | Description |
|---|---|
| `APPLE_SHARED_SECRET` | Shared Secret App Store Connect (App Store Connect → App → App 信息 → 订阅 → 共享密钥) |
| `GOOGLE_SERVICE_ACCOUNT` | JSON complet du service account Play Console (clé privée incluse) |
| `GOOGLE_PACKAGE_NAME` | `com.sheaz.app` (défaut si absent) |

## Déploiement

```bash
supabase login --token $SUPABASE_ACCESS_TOKEN
supabase functions deploy verify-receipt --project-ref bhnvnqscblqfhqrejurp
```

## Test local (avec les secrets)

```bash
supabase functions serve verify-receipt --env-file ./supabase/.env.local
curl -X POST http://127.0.0.1:54321/functions/v1/verify-receipt \
  -H "Authorization: Bearer <jwt>" -H "Content-Type: application/json" \
  -d '{"platform":"apple","receipt":"<base64>","productId":"sheaz.premium.yearly"}'
```

## Comportement

- `401` si non authentifié (identité = JWT Supabase, jamais le userId du client)
- `402` si le reçu est invalide / expiré / appartient à un autre compte
- `200 {ok, plan, expires_at, source}` si valide → upsert `subscriptions`
- `OPTIONS` géré pour le web (CORS)
