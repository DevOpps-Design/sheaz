/**
 * SHEAZ — Premium (paywall)
 * Offres annuelle / mensuelle + essai 7 jours. Squelette S5.
 * Intégration paiement réelle : react-native-iap (S10).
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { colors, radii, spacing, typography } from '../theme';

type Plan = 'yearly' | 'monthly';

export default function PremiumScreen() {
  const [plan, setPlan] = useState<Plan>('yearly');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Premium" />

      <View style={styles.hero}>
        <Text style={styles.crown}>👑</Text>
        <Text style={styles.heroTitle}>
          Sheaz <Text style={styles.heroAccent}>Premium</Text>
        </Text>
        <Text style={styles.heroSub}>Insights avancés · Méditations complètes · Plans personnalisés</Text>
      </View>

      <TouchableOpacity
        style={[styles.plan, plan === 'yearly' && styles.planOn]}
        activeOpacity={0.8}
        onPress={() => setPlan('yearly')}
      >
        <View style={[styles.radio, plan === 'yearly' && styles.radioOn]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.planName}>Annuel</Text>
          <Text style={styles.planMeta}>Économisez 2 mois · 7 jours offerts</Text>
        </View>
        <Text style={styles.planPrice}>
          29,99€ <Text style={styles.planSmall}>/an</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.plan, plan === 'monthly' && styles.planOn]}
        activeOpacity={0.8}
        onPress={() => setPlan('monthly')}
      >
        <View style={[styles.radio, plan === 'monthly' && styles.radioOn]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.planName}>Mensuel</Text>
          <Text style={styles.planMeta}>Annulable à tout moment</Text>
        </View>
        <Text style={styles.planPrice}>
          4,99€ <Text style={styles.planSmall}>/mois</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cta} activeOpacity={0.85}>
        <Text style={styles.ctaText}>Commencer l'essai gratuit</Text>
      </TouchableOpacity>

      <Text style={styles.trial}>
        7 jours offerts · Sans engagement · Annulable en 2 taps
      </Text>
      <Text style={styles.legal}>
        🔒 Paiement sécurisé · Conditions · Confidentialité
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: 40 },
  hero: {
    backgroundColor: colors.ink,
    borderRadius: radii.lg,
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  crown: { fontSize: 42, marginBottom: 8 },
  heroTitle: { ...typography.display, fontSize: 24, color: colors.white },
  heroAccent: { ...typography.accent, color: colors.gold },
  heroSub: {
    ...typography.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginTop: 8,
  },
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
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D6DEEA',
  },
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
});
