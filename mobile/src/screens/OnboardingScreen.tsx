/**
 * SHEAZ — Onboarding post-inscription
 * 1) Choix des piliers (sport · corps · mental)  2) Consentement RGPD (données santé)
 * → seed des objectifs + habitudes par défaut.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { seedDefaults } from '../lib/seed';
import IconBadge from '../components/IconBadge';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing, typography } from '../theme';

const PILLARS = [
  { id: 1, icon: 'dumbbell', name: 'Sport', desc: 'Séances, cardio, force', color: colors.sport },
  { id: 2, icon: 'water', name: 'Corps', desc: 'Sommeil, eau, habitudes', color: colors.blue },
  { id: 3, icon: 'brain', name: 'Mental', desc: 'Méditation, humeur', color: colors.purple },
] as const;

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [pillars, setPillars] = useState<number[]>([1, 2, 3]);
  const [consentHealth, setConsentHealth] = useState(false);
  const [consentAnalytics, setConsentAnalytics] = useState(true);
  const [dailyTime, setDailyTime] = useState('20:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePillar = (id: number) =>
    setPillars((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const finish = async () => {
    if (pillars.length === 0) {
      setError('Choisissez au moins un pilier.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await seedDefaults({ pillars, consentHealth, consentAnalytics, dailyTime });
      onDone();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message.includes('Session')
            ? e.message
            : 'Une erreur est survenue. Réessayez.'
          : 'Une erreur est survenue. Réessayez.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.step}>Étape {step} / 2</Text>
        <Text style={styles.title}>
          {step === 1 ? 'Votre équilibre, à votre image' : 'Vos données, vos règles'}
        </Text>
      </View>

      {step === 1 ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {PILLARS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.pillar,
                pillars.includes(p.id) && {
                  borderColor: p.color,
                  backgroundColor: `${p.color}14`,
                  ...shadows.lift(p.color),
                },
              ]}
              activeOpacity={0.8}
              onPress={() => togglePillar(p.id)}
            >
              <IconBadge icon={p.icon} color={p.color} size={46} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pillarName}>{p.name}</Text>
                <Text style={styles.pillarDesc}>{p.desc}</Text>
              </View>
              <View style={[styles.check, pillars.includes(p.id) && { backgroundColor: p.color, borderColor: p.color }]}>
                {pillars.includes(p.id) ? (
                  <MaterialCommunityIcons name="check" size={16} color={colors.white} />
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Consentement données de santé</Text>
            <Text style={styles.cardText}>
              Sheaz est conforme au RGPD (art. 9). Vos données de santé sont hébergées en
              Europe, chiffrées, et ne sont jamais revendues. Vous pouvez les exporter ou
              les effacer à tout moment depuis votre profil.
            </Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>J'accepte le traitement de mes données de santé</Text>
              <Switch
                value={consentHealth}
                onValueChange={setConsentHealth}
                trackColor={{ true: colors.blue, false: colors.line }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Statistiques d'usage</Text>
            <Text style={styles.cardText}>
              Des données anonymisées pour améliorer l'app (sans données de santé).
            </Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Autoriser les statistiques anonymes</Text>
              <Switch
                value={consentAnalytics}
                onValueChange={setConsentAnalytics}
                trackColor={{ true: colors.blue, false: colors.line }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.cta, !consentHealth && styles.ctaDisabled]} activeOpacity={0.85} onPress={finish} disabled={loading || !consentHealth}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.ctaText}>Commencer mon équilibre</Text>}
          </TouchableOpacity>
          {!consentHealth ? (
            <Text style={styles.hint}>Le consentement santé est requis (RGPD) pour utiliser Sheaz.</Text>
          ) : null}
        </ScrollView>
      )}

      <View style={styles.footer}>
        {step === 2 ? (
          <TouchableOpacity onPress={() => setStep(1)}>
            <Text style={styles.back}>← Retour</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        {step === 1 ? (
          <TouchableOpacity style={styles.nextBtn} activeOpacity={0.85} onPress={() => setStep(2)}>
            <Text style={styles.nextText}>Continuer →</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  step: {
    ...typography.label,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.sport,
    marginBottom: 6,
  },
  title: {
    ...typography.display,
    fontSize: 22,
    color: colors.ink,
  },
  content: { padding: spacing.xl, paddingTop: 0, paddingBottom: 100 },
  pillar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: 12,
  },
  pillarEmoji: { fontSize: 28 },
  pillarName: { ...typography.label, fontSize: 16, color: colors.ink },
  pillarDesc: { ...typography.body, fontSize: 12, color: colors.muted },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D6DEEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { ...typography.body, fontSize: 12, color: colors.sport, marginTop: 8 },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: 14,
  },
  cardTitle: { ...typography.label, fontSize: 15, color: colors.ink, marginBottom: 6 },
  cardText: { ...typography.body, fontSize: 12.5, color: colors.muted, lineHeight: 19 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
  },
  switchLabel: { ...typography.label, fontSize: 13, color: colors.ink, flex: 1 },
  cta: {
    backgroundColor: colors.sport,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { ...typography.display, fontSize: 16, color: colors.white },
  hint: {
    ...typography.body,
    fontSize: 11.5,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  back: { ...typography.label, fontSize: 14, color: colors.muted },
  nextBtn: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingHorizontal: 26,
    paddingVertical: 13,
  },
  nextText: { ...typography.display, fontSize: 14, color: colors.white },
});
