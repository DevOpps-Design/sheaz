/**
 * SHEAZ — Récompenses
 * Streak + badges gagnés / verrouillés (gamification).
 * Squelette S5 — données fictives de démonstration.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { colors, radii, spacing, typography } from '../theme';

interface Badge {
  emoji: string;
  name: string;
  meta: string;
  unlocked: boolean;
}

const BADGES: Badge[] = [
  { emoji: '🌅', name: 'Lève-tôt', meta: '3 séances avant 8h', unlocked: true },
  { emoji: '💪', name: 'Série de force', meta: '2 semaines de sport', unlocked: true },
  { emoji: '🧘', name: 'Zen matinal', meta: '7 méditations', unlocked: true },
  { emoji: '🏃', name: 'Marathonien', meta: 'Courir 42 km cumulés', unlocked: false },
  { emoji: '🌟', name: 'Équilibre parfait', meta: '3 piliers à 100%', unlocked: false },
];

export default function RecompensesScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Récompenses" subtitle="Vos victoires, célébrées 🏆" />

      <View style={styles.streakCard}>
        <View style={styles.streakNum}>
          <Text style={styles.streakValue}>12</Text>
          <Text style={styles.streakLabel}>🔥 Streak</Text>
        </View>
        <View style={styles.streakBar}>
          <View style={[styles.streakFill, { width: '80%' }]} />
        </View>
        <Text style={styles.streakPct}>80%</Text>
      </View>

      <Text style={styles.section}>Badges</Text>
      {BADGES.map((badge) => (
        <View key={badge.name} style={[styles.badge, !badge.unlocked && styles.badgeLocked]}>
          <View style={[styles.badgeIcon, !badge.unlocked && styles.badgeIconLocked]}>
            <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.badgeMeta}>{badge.meta}</Text>
          </View>
          <Text style={[styles.badgeState, !badge.unlocked && styles.badgeStateLocked]}>
            {badge.unlocked ? '✓' : '🔒'}
          </Text>
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
  },
  streakNum: { alignItems: 'center' },
  streakValue: { ...typography.display, fontSize: 34, color: colors.sport },
  streakLabel: { ...typography.caption, fontSize: 11, color: colors.muted },
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
  },
  badgeLocked: { opacity: 0.55 },
  badgeIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIconLocked: { backgroundColor: colors.paper },
  badgeEmoji: { fontSize: 22 },
  badgeName: { ...typography.label, fontSize: 14, color: colors.ink },
  badgeMeta: { ...typography.body, fontSize: 12, color: colors.muted },
  badgeState: { ...typography.label, fontSize: 14, color: colors.gold },
  badgeStateLocked: { color: colors.muted },
});
