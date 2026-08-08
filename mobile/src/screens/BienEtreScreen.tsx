/**
 * SHEAZ — Module Bien-être
 * Sommeil, hydratation, habitudes du jour, poids.
 * Squelette S5 — données fictives de démonstration.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { colors, radii, spacing, typography } from '../theme';

export default function BienEtreScreen() {
  const [habits, setHabits] = useState<boolean[]>([true, true, false, false]);

  const toggle = (index: number) =>
    setHabits((h) => h.map((v, i) => (i === index ? !v : v)));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Bien-être" subtitle="Prendre soin de son corps, en douceur" avatar="C" />

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statK}>Sommeil</Text>
          <Text style={styles.statV}>7h30 <Text style={styles.statSmall}>⭐</Text></Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statK}>Hydratation</Text>
          <Text style={styles.statV}>5 <Text style={styles.statSmall}>/8</Text></Text>
        </View>
      </View>

      <Text style={styles.section}>Habitudes du jour</Text>
      {habitsData.map((habit, index) => (
        <TouchableOpacity
          key={habit.name}
          style={[styles.habit, habits[index] && styles.habitDone]}
          activeOpacity={0.8}
          onPress={() => toggle(index)}
        >
          <View style={[styles.check, habits[index] && styles.checkDone]}>
            {habits[index] ? <Text style={styles.checkText}>✓</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.habitName}>{habit.name}</Text>
            <Text style={styles.habitMeta}>{habit.meta}</Text>
          </View>
          <Text style={styles.habitTime}>{habits[index] ? '✓' : habit.time}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.section}>Corps</Text>
      <View style={styles.weightCard}>
        <Text style={styles.weightK}>Poids</Text>
        <Text style={styles.weightV}>
          78,4 <Text style={styles.weightSmall}>kg · -0,6 ce mois</Text>
        </Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: '62%', backgroundColor: colors.blue }]} />
        </View>
      </View>
    </ScrollView>
  );
}

const habitsData = [
  { name: 'Eau dès le réveil', meta: '1 verre · 7h30', time: '✓' },
  { name: 'Étirements matin', meta: '5 min · 7h45', time: '✓' },
  { name: 'Marche après déjeuner', meta: '15 min · 13h00', time: '—' },
  { name: 'Dîner léger', meta: '20h00', time: '—' },
];

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: 40 },
  statRow: { flexDirection: 'row', gap: 11, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  statK: {
    ...typography.label,
    fontSize: 10.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  statV: { ...typography.display, fontSize: 21, color: colors.ink, marginTop: 4 },
  statSmall: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  section: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: spacing.md,
  },
  habit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: 11,
  },
  habitDone: { backgroundColor: colors.voltSoft, borderColor: '#CBE7A5' },
  check: {
    width: 27,
    height: 27,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D6DEEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.volt, borderColor: colors.volt },
  checkText: { ...typography.display, fontSize: 14, color: colors.white },
  habitName: { ...typography.label, fontSize: 15, color: colors.ink },
  habitMeta: { ...typography.body, fontSize: 12, color: colors.muted },
  habitTime: { ...typography.label, fontSize: 12, color: colors.muted },
  weightCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.xl,
  },
  weightK: {
    ...typography.label,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  weightV: { ...typography.display, fontSize: 20, color: colors.ink, marginTop: 6 },
  weightSmall: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  bar: {
    height: 8,
    backgroundColor: colors.line,
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  barFill: { height: '100%', borderRadius: radii.pill },
});
