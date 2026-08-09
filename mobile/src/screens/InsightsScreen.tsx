/**
 * SHEAZ — Insights (S13A)
 * Tendances 7/30 jours : sommeil, hydratation, poids, humeur, sport, assiette, XP.
 * Corrélations simples (sommeil↔humeur, hydratation↔humeur) — promesse Premium.
 * Gate : 30 jours réservé au Premium.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenHeader from '../components/ScreenHeader';
import IconBadge, { type IconName } from '../components/IconBadge';
import { useInsights } from '../hooks/useInsights';
import type { RootStackParamList } from '../navigation/types';
import { colors, gradients, radii, shadows, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Insights'>;

const MOOD_EMOJI = ['', 'emoticon-sad-outline', 'emoticon-neutral-outline', 'emoticon-happy-outline', 'emoticon-excited-outline', 'emoticon-cool-outline', 'emoticon-kiss-outline'];

function fmtMin(min: number | null): string {
  if (min === null) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m} min`;
}

function fmtKg(v: number | null): string {
  return v === null ? '—' : `${v.toFixed(1)} kg`;
}

/* ------------------------------ Carte stat ------------------------------ */
function StatCard({ icon, color, value, label, sub }: { icon: IconName; color: string; value: string; label: string; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <IconBadge icon={icon} color={color} size={34} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

/* ------------------------------ Corrélation ------------------------------ */
function CorrCard({
  icon,
  color,
  title,
  goodLabel,
  goodValue,
  poorLabel,
  poorValue,
  verdict,
}: {
  icon: IconName;
  color: string;
  title: string;
  goodLabel: string;
  goodValue: number | null;
  poorLabel: string;
  poorValue: number | null;
  verdict: string | null;
}) {
  const hasData = goodValue !== null || poorValue !== null;
  return (
    <View style={styles.corrCard}>
      <View style={styles.corrHead}>
        <IconBadge icon={icon} color={color} size={34} />
        <Text style={styles.corrTitle}>{title}</Text>
      </View>
      {hasData ? (
        <>
          <View style={styles.corrRow}>
            <Text style={styles.corrLabel}>{goodLabel}</Text>
            <View style={styles.corrBarTrack}>
              <View
                style={[styles.corrBar, { width: `${Math.min(100, ((goodValue ?? 0) / 6) * 100)}%`, backgroundColor: color }]}
              />
            </View>
            <Text style={styles.corrValue}>{goodValue !== null ? `${goodValue}/6` : '—'}</Text>
          </View>
          <View style={styles.corrRow}>
            <Text style={styles.corrLabel}>{poorLabel}</Text>
            <View style={styles.corrBarTrack}>
              <View
                style={[styles.corrBar, { width: `${Math.min(100, ((poorValue ?? 0) / 6) * 100)}%`, backgroundColor: colors.muted }]}
              />
            </View>
            <Text style={styles.corrValue}>{poorValue !== null ? `${poorValue}/6` : '—'}</Text>
          </View>
          {verdict ? (
            <View style={styles.verdict}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={15} color={colors.gold} />
              <Text style={styles.verdictText}>{verdict}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <Text style={styles.corrEmpty}>
          Loggez {goodLabel.toLowerCase()} et votre humeur sur quelques jours pour révéler la corrélation.
        </Text>
      )}
    </View>
  );
}

/* ------------------------------ Écran ------------------------------ */
export default function InsightsScreen({ navigation }: Props) {
  const ins = useInsights();

  const corrSleepVerdict =
    ins.corrSleepMood.good !== null && ins.corrSleepMood.poor !== null
      ? ins.corrSleepMood.good > ins.corrSleepMood.poor
        ? `Bien dormir (≥ 7 h) améliore votre humeur de +${(ins.corrSleepMood.good - ins.corrSleepMood.poor).toFixed(1)} point.`
        : 'Votre humeur est stable, quel que soit votre sommeil.'
      : null;
  const corrHydraVerdict =
    ins.corrHydrationMood.good !== null && ins.corrHydrationMood.poor !== null
      ? ins.corrHydrationMood.good > ins.corrHydrationMood.poor
        ? `Bien vous hydrater (≥ 8 verres) améliore votre humeur de +${(ins.corrHydrationMood.good - ins.corrHydrationMood.poor).toFixed(1)} point.`
        : 'Votre humeur ne semble pas liée à l’hydratation.'
      : null;

  const empty = !ins.loading &&
    ins.sleep.days === 0 && ins.hydration.days === 0 && ins.weight.points.length === 0 &&
    ins.mood.days === 0 && ins.workouts.count === 0 && ins.nutrition.days === 0 && ins.quizCount === 0;

  const weightBars = ins.weight.points.slice(-14);
  const weightMax = Math.max(...weightBars.map((p) => p.value), 1);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Vos" accent="insights" subtitle="Tendances & corrélations" />

      {/* Sélecteur 7 / 30 jours */}
      <View style={styles.segment}>
        {([7, 30] as const).map((r) => {
          const locked = r === 30 && !ins.isPremium;
          const active = ins.effectiveRange === r;
          return (
            <TouchableOpacity
              key={r}
              style={[styles.segmentBtn, active && styles.segmentBtnOn]}
              activeOpacity={0.85}
              onPress={() => (locked ? navigation.navigate('Premium') : ins.setRange(r))}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextOn]}>{r} jours</Text>
              {locked ? <MaterialCommunityIcons name="lock-outline" size={13} color={colors.muted} style={{ marginLeft: 4 }} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
      {ins.range === 30 && !ins.isPremium ? (
        <TouchableOpacity style={styles.premiumHint} activeOpacity={0.85} onPress={() => navigation.navigate('Premium')}>
          <MaterialCommunityIcons name="crown" size={15} color={colors.gold} />
          <Text style={styles.premiumHintText}>Débloquez 30 jours avec Premium</Text>
        </TouchableOpacity>
      ) : null}

      {ins.loading ? (
        <Text style={styles.emptyText}>Analyse de vos données…</Text>
      ) : empty ? (
        <View style={styles.emptyCard}>
          <IconBadge icon="chart-line" color={colors.blue} size={44} />
          <Text style={styles.emptyTitle}>Pas encore de données</Text>
          <Text style={styles.emptyText}>
            Renseignez votre sommeil, votre humeur, vos séances et votre assiette : vos tendances apparaîtront ici.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            <StatCard
              icon="weather-night"
              color={colors.purple}
              value={fmtMin(ins.sleep.avgMin)}
              label="Sommeil / nuit"
              sub={ins.sleep.avgQuality !== null ? `qualité ${ins.sleep.avgQuality}/5 · ${ins.sleep.days} nuits` : `${ins.sleep.days} nuits`}
            />
            <StatCard
              icon="water"
              color={colors.blue}
              value={ins.hydration.avgGlasses !== null ? `${ins.hydration.avgGlasses}` : '—'}
              label="Verres / jour"
              sub={`${ins.hydration.days} jours loggés`}
            />
            <StatCard
              icon="scale-bathroom"
              color={colors.sport}
              value={fmtKg(ins.weight.latest)}
              label="Poids"
              sub={ins.weight.delta !== null ? `${ins.weight.delta > 0 ? '+' : ''}${ins.weight.delta.toFixed(1)} kg sur la période` : '1 mesure'}
            />
            <StatCard
              icon="emoticon-happy-outline"
              color={colors.gold}
              value={ins.mood.avg !== null ? `${ins.mood.avg}/6` : '—'}
              label="Humeur moyenne"
              sub={`${ins.mood.days} entrées`}
            />
            <StatCard
              icon="run-fast"
              color={colors.sport}
              value={`${ins.workouts.count}`}
              label="Séances"
              sub={ins.workouts.totalMin > 0 ? `${ins.workouts.totalMin} min au total` : 'aucune terminée'}
            />
            <StatCard
              icon="food-apple"
              color={colors.gold}
              value={ins.nutrition.avgKcal !== null ? `${ins.nutrition.avgKcal}` : '—'}
              label="kcal / jour"
              sub={ins.nutrition.avgScore !== null ? `score santé ${ins.nutrition.avgScore.toFixed(1)}/4` : `${ins.nutrition.days} jours loggés`}
            />
            <StatCard
              icon="lightning-bolt"
              color={colors.purple}
              value={`${ins.xp} XP`}
              label="Total XP"
              sub={ins.streak > 0 ? `streak ${ins.streak} jour${ins.streak > 1 ? 's' : ''}` : 'démarrez un streak'}
            />
            <StatCard
              icon="head-question-outline"
              color={colors.blue}
              value={`${ins.quizCount}`}
              label="Quiz réalisés"
              sub={`sur ${ins.effectiveRange} jours`}
            />
          </View>

          {/* Courbe poids */}
          {weightBars.length >= 2 ? (
            <View style={styles.weightCard}>
              <View style={styles.corrHead}>
                <IconBadge icon="chart-line" color={colors.sport} size={34} />
                <Text style={styles.corrTitle}>Évolution du poids</Text>
              </View>
              <View style={styles.bars}>
                {weightBars.map((p, i) => (
                  <View key={i} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View
                        style={[styles.bar, { height: `${Math.max(8, (p.value / weightMax) * 100)}%`, backgroundColor: i === weightBars.length - 1 ? colors.sport : colors.sportSoft }]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{p.value.toFixed(0)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Corrélations */}
          <Text style={styles.section}>Corrélations</Text>
          <CorrCard
            icon="weather-night"
            color={colors.purple}
            title="Sommeil & humeur"
            goodLabel="≥ 7 h de sommeil"
            goodValue={ins.corrSleepMood.good}
            poorLabel="Moins de 7 h"
            poorValue={ins.corrSleepMood.poor}
            verdict={corrSleepVerdict}
          />
          <CorrCard
            icon="water"
            color={colors.blue}
            title="Hydratation & humeur"
            goodLabel="≥ 8 verres"
            goodValue={ins.corrHydrationMood.good}
            poorLabel="Moins de 8 verres"
            poorValue={ins.corrHydrationMood.poor}
            verdict={corrHydraVerdict}
          />

          {/* Données & RGPD */}
          <Text style={styles.section}>Vos données</Text>
          <TouchableOpacity style={styles.dataLink} activeOpacity={0.85} onPress={() => navigation.navigate('Data')}>
            <IconBadge icon="database-outline" color={colors.blue} size={38} />
            <View style={{ flex: 1 }}>
              <Text style={styles.dataTitle}>Données & RGPD</Text>
              <Text style={styles.dataSub}>Exporter ou effacer mes données</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: 40 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: 4,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  segmentBtnOn: { backgroundColor: colors.ink },
  segmentText: { ...typography.label, fontSize: 14, color: colors.muted },
  segmentTextOn: { color: colors.white },
  premiumHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.goldSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
  },
  premiumHintText: { ...typography.label, fontSize: 13, color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  statCard: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: spacing.lg,
    ...shadows.lift(colors.blue),
  },
  statValue: { ...typography.display, fontSize: 24, color: colors.ink, marginTop: spacing.sm },
  statLabel: { ...typography.label, fontSize: 14, color: colors.ink, marginTop: 2 },
  statSub: { ...typography.caption, fontSize: 11, color: colors.muted, marginTop: 2 },
  section: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  weightCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.lift(colors.sport),
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: spacing.md, height: 90 },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: colors.paper, borderRadius: 6, overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 6 },
  barLabel: { ...typography.caption, fontSize: 9, color: colors.muted, marginTop: 4 },
  corrCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.lift(colors.purple),
  },
  corrHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  corrTitle: { ...typography.display, fontSize: 17, color: colors.ink, flex: 1 },
  corrRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm },
  corrLabel: { ...typography.caption, fontSize: 12, color: colors.muted, width: 110 },
  corrBarTrack: { flex: 1, height: 8, backgroundColor: colors.paper, borderRadius: 4, overflow: 'hidden' },
  corrBar: { height: '100%', borderRadius: 4 },
  corrValue: { ...typography.label, fontSize: 13, color: colors.ink, width: 38, textAlign: 'right' },
  corrEmpty: { ...typography.body, fontSize: 13, color: colors.muted, lineHeight: 19 },
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.goldSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  verdictText: { ...typography.label, fontSize: 13, color: colors.ink, flex: 1 },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 10,
    ...shadows.lift(colors.blue),
  },
  emptyTitle: { ...typography.display, fontSize: 17, color: colors.ink },
  emptyText: { ...typography.body, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19 },
  dataLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.lift(colors.blue),
  },
  dataTitle: { ...typography.label, fontSize: 15, color: colors.ink },
  dataSub: { ...typography.caption, fontSize: 12, color: colors.muted, marginTop: 2 },
});
