/**
 * SHEAZ — Premium (paywall) — S10 : connecté
 * Entitlement réel (useSubscription) · achats react-native-iap (natif) / simulés (web)
 * · restauration · statut affiché.
 */
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import ScreenHeader from '../components/ScreenHeader';
import { useSubscription } from '../hooks/useSubscription';
import { purchase, restorePurchases, getProducts } from '../lib/iap';
import { colors, gradients, radii, shadows, spacing, typography } from '../theme';

type Plan = 'yearly' | 'monthly';

const BENEFITS: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }[] = [
  { icon: 'chart-line', label: 'Insights avancés (tendances, corrélations)' },
  { icon: 'meditation', label: 'Méditations complètes illimitées' },
  { icon: 'run-fast', label: 'Plans sport personnalisés' },
  { icon: 'cloud-check-outline', label: 'Synchronisation santé multi-appareils' },
  { icon: 'shield-check-outline', label: 'Données chiffrées & export RGPD' },
];

export default function PremiumScreen() {
  const { sub, isPremium, loading, setPlan } = useSubscription();
  const [plan, setPlanState] = useState<Plan>('yearly');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});

  // Charger les prix réels (natif) / catalogue (web)
  React.useEffect(() => {
    (async () => {
      const products = await getProducts();
      const map: Record<string, string> = {};
      products.forEach((p) => (map[p.id] = p.price));
      setPrices(map);
    })();
  }, []);

  const buy = async (p: Plan) => {
    setBusy(true);
    setMsg(null);
    const res = await purchase(p);
    if (res.ok) {
      await setPlan(p);
      setMsg({ type: 'ok', text: res.message });
    } else {
      setMsg({ type: 'err', text: res.message });
    }
    setBusy(false);
  };

  const restore = async () => {
    setBusy(true);
    setMsg(null);
    const res = await restorePurchases();
    if (res.ok) {
      await setPlan(sub.plan === 'yearly' ? 'yearly' : 'monthly');
      setMsg({ type: 'ok', text: res.message });
    } else {
      setMsg({ type: 'err', text: res.message });
    }
    setBusy(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.sport} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Premium" />

      {isPremium ? (
        /* ------------------------- État Premium actif ------------------------- */
        <View style={styles.activeCard}>
          <View style={styles.activeCrown}>
            <LinearGradient colors={gradients.reward} style={styles.activeCrownBg}>
              <MaterialCommunityIcons name="crown" size={26} color={colors.white} />
            </LinearGradient>
          </View>
          <Text style={styles.activeTitle}>Sheaz Premium actif</Text>
          <Text style={styles.activePlan}>
            Plan {sub.plan === 'yearly' ? 'annuel' : 'mensuel'} · renouvellement auto
          </Text>
          {sub.current_period_end ? (
            <Text style={styles.activeUntil}>Valable jusqu'au {sub.current_period_end.slice(0, 10)}</Text>
          ) : null}
          <View style={styles.activeBenefits}>
            {BENEFITS.map((b) => (
              <View key={b.icon} style={styles.benefitRow}>
                <MaterialCommunityIcons name={b.icon} size={17} color={colors.volt} />
                <Text style={styles.benefitText}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        /* ------------------------- Paywall ------------------------- */
        <>
          <View style={styles.hero}>
            <View style={styles.crownWrap}>
              <LinearGradient colors={gradients.reward} style={styles.crownBg}>
                <MaterialCommunityIcons name="crown" size={34} color={colors.white} />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>
              Sheaz <Text style={styles.heroAccent}>Premium</Text>
            </Text>
            <Text style={styles.heroSub}>Insights avancés · Méditations complètes · Plans personnalisés</Text>
          </View>

          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b.icon} style={styles.benefitRow}>
                <MaterialCommunityIcons name={b.icon} size={17} color={colors.volt} />
                <Text style={styles.benefitText}>{b.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={[styles.plan, plan === 'yearly' && styles.planOn]} activeOpacity={0.8} onPress={() => setPlanState('yearly')}>
            <View style={[styles.radio, plan === 'yearly' && styles.radioOn]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.planName}>Annuel</Text>
              <Text style={styles.planMeta}>Économisez 2 mois · 7 jours offerts</Text>
            </View>
            <Text style={styles.planPrice}>
              {prices['sheaz.premium.yearly'] ?? '29,99€'} <Text style={styles.planSmall}>/an</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.plan, plan === 'monthly' && styles.planOn]} activeOpacity={0.8} onPress={() => setPlanState('monthly')}>
            <View style={[styles.radio, plan === 'monthly' && styles.radioOn]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.planName}>Mensuel</Text>
              <Text style={styles.planMeta}>Annulable à tout moment</Text>
            </View>
            <Text style={styles.planPrice}>
              {prices['sheaz.premium.monthly'] ?? '4,99€'} <Text style={styles.planSmall}>/mois</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cta} activeOpacity={0.85} disabled={busy} onPress={() => buy(plan)}>
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaText}>Commencer l'essai gratuit</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.restoreBtn} onPress={restore} disabled={busy}>
            <MaterialCommunityIcons name="restore" size={15} color={colors.muted} />
            <Text style={styles.restoreText}>Restaurer mes achats</Text>
          </TouchableOpacity>

          {msg ? (
            <Text style={[styles.msg, msg.type === 'ok' ? styles.msgOk : styles.msgErr]}>{msg.text}</Text>
          ) : null}

          <Text style={styles.trial}>7 jours offerts · Sans engagement · Annulable en 2 taps</Text>
          <Text style={styles.legal}>
            <MaterialCommunityIcons name="lock-outline" size={11} color={colors.muted} /> Paiement sécurisé · Conditions · Confidentialité
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: 40 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  hero: {
    backgroundColor: colors.ink,
    borderRadius: radii.lg,
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.lift(colors.purple),
  },
  crownWrap: { marginBottom: 12 },
  crownBg: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow(colors.gold),
  },
  heroTitle: { ...typography.display, fontSize: 24, color: colors.white },
  heroAccent: { ...typography.accent, color: colors.gold },
  heroSub: {
    ...typography.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginTop: 8,
  },
  benefits: { marginBottom: spacing.lg, gap: 9 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { ...typography.body, fontSize: 13, color: colors.ink, flex: 1 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: 11,
  },
  planOn: { borderColor: colors.blue, backgroundColor: '#F3F7FF' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D6DEEA' },
  radioOn: { borderColor: colors.blue },
  planName: { ...typography.label, fontSize: 15, color: colors.ink },
  planMeta: { ...typography.body, fontSize: 12, color: colors.muted },
  planPrice: { ...typography.display, fontSize: 16, color: colors.ink },
  planSmall: { fontSize: 11, color: colors.muted, fontWeight: '500' },
  cta: {
    backgroundColor: colors.sport,
    borderRadius: radii.lg,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  ctaText: { ...typography.display, fontSize: 16, color: colors.white },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
  },
  restoreText: { ...typography.label, fontSize: 13, color: colors.muted },
  msg: { ...typography.label, fontSize: 13, textAlign: 'center', marginTop: 12 },
  msgOk: { color: colors.volt },
  msgErr: { color: colors.sport },
  trial: {
    ...typography.body,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 12,
  },
  legal: {
    ...typography.caption,
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 14,
  },
  /* --- Premium actif --- */
  activeCard: {
    backgroundColor: colors.ink,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lift(colors.gold),
  },
  activeCrown: { marginBottom: 10 },
  activeCrownBg: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow(colors.gold),
  },
  activeTitle: { ...typography.display, fontSize: 20, color: colors.white },
  activePlan: { ...typography.body, fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 4 },
  activeUntil: { ...typography.caption, fontSize: 12, color: colors.gold, marginTop: 6 },
  activeBenefits: { marginTop: 20, gap: 12, width: '100%' },
});
