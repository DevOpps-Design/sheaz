/**
 * SHEAZ — Récompenses
 * Streak + badges gagnés / verrouillés (gamification).
 * Squelette S5 — données fictives de démonstration.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ScreenHeader from '../components/ScreenHeader';
import IconBadge from '../components/IconBadge';
import type { IconName } from '../components/IconBadge';
import { colors, radii, shadows, spacing, typography } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Badge {
  icon: IconName;
  color: string;
  name: string;
  meta: string;
  unlocked: boolean;
}

const BADGES: Badge[] = [
  { icon: 'weather-sunset-up', color: colors.gold, name: 'Lève-tôt', meta: '3 séances avant 8h', unlocked: true },
  { icon: 'arm-flex', color: colors.sport, name: 'Série de force', meta: '2 semaines de sport', unlocked: true },
  { icon: 'meditation', color: colors.purple, name: 'Zen matinal', meta: '7 méditations', unlocked: true },
  { icon: 'run', color: colors.blue, name: 'Marathonien', meta: 'Courir 42 km cumulés', unlocked: false },
  { icon: 'star', color: colors.gold, name: 'Équilibre parfait', meta: '3 piliers à 100%', unlocked: false },
];

export default function RecompensesScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Récompenses" subtitle="Vos victoires, célébrées" />

      <View style={styles.streakCard}>
        <View style={styles.streakNum}>
          <Text style={styles.streakValue}>12</Text>
          <Text style={styles.streakLabel}><MaterialCommunityIcons name="fire" size={11} color={colors.sport} /> Streak</Text>
        </View>
        <View style={styles.streakBar}>
          <View style={[styles.streakFill, { width: '80%' }]} />
        </View>
        <Text style={styles.streakPct}>80%</Text>
      </View>

      <Text style={styles.section}>Badges</Text>
      {BADGES.map((badge) => (
        <View key={badge.name} style={[styles.badge, !badge.unlocked && styles.badgeLocked]}>
          <IconBadge icon={badge.icon} color={badge.color} size={44} variant={badge.unlocked ? 'solid' : 'soft'} glow={badge.unlocked} />
          <View style={{ flex: 1 }}>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.badgeMeta}>{badge.meta}</Text>
          </View>
          <MaterialCommunityIcons
            name={badge.unlocked ? 'check-circle' : 'lock'}
            size={22}
            color={badge.unlocked ? colors.volt : colors.muted}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: 40 },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...shadows.card,
  },
  streakNum: { alignItems: 'center' },
  streakValue: { ...typography.display, fontSize: 34, color: colors.sport },
  streakLabel: { ...typography.caption, fontSize: 11, color: colors.muted, flexDirection: 'row', alignItems: 'center', gap: 3 },
  streakBar: {
    flex: 1,
    height: 10,
    backgroundColor: colors.line,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  streakFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.gold,
  },
  streakPct: { ...typography.label, fontSize: 12, color: colors.muted },
  section: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: 11,
    ...shadows.card,
  },
  badgeLocked: { opacity: 0.55 },
  badgeName: { ...typography.label, fontSize: 14, color: colors.ink },
  badgeMeta: { ...typography.body, fontSize: 12, color: colors.muted },
});
