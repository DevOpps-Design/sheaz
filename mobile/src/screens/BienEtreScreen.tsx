/**
 * SHEAZ — Module Corps (Bien-être) — connecté
 * Habitudes réelles (toggle → habit_logs), sommeil & eau fictifs pour l'instant.
 */
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ScreenHeader from '../components/ScreenHeader';
import IconBadge from '../components/IconBadge';
import { habitIcon } from '../lib/icons';
import { useHabits } from '../hooks/useData';
import { colors, radii, shadows, spacing, typography } from '../theme';

export default function BienEtreScreen() {
  const { habits, logs, toggle, loading } = useHabits();
  const corps = habits.filter((h) => h.pillar === 2);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Corps" subtitle="Prendre soin de son corps, en douceur" />

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statK}>Sommeil</Text>
          <Text style={styles.statV}>7h30 <MaterialCommunityIcons name="star" size={14} color={colors.gold} /></Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statK}>Hydratation</Text>
          <Text style={styles.statV}>{corps.filter((h) => h.name.includes('eau')).length > 0 && logs[corps.find((h) => h.name.includes('eau'))!.id] ? 1 : 0} <Text style={styles.statSmall}>/8</Text></Text>
        </View>
      </View>

      <Text style={styles.section}>Habitudes du jour</Text>
      {loading ? (
        <ActivityIndicator color={colors.blue} style={{ marginTop: 20 }} />
      ) : corps.length === 0 ? (
        <Text style={styles.empty}>Aucune habitude — activez le pilier Corps dans les réglages.</Text>
      ) : (
        corps.map((habit) => {
          const done = !!logs[habit.id];
          return (
            <TouchableOpacity
              key={habit.id}
              style={[styles.habit, done && styles.habitDone]}
              activeOpacity={0.8}
              onPress={() => toggle(habit.id)}
            >
              <IconBadge icon={habitIcon(habit.name, habit.emoji)} color={colors.blue} size={38} variant={done ? 'solid' : 'soft'} glow={done} />
              <View style={{ flex: 1 }}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitMeta}>{done ? 'Fait aujourd’hui' : `Rappel ${habit.reminder_time ?? '—'}`}</Text>
              </View>
              <MaterialCommunityIcons
                name={done ? 'check-circle' : 'circle-outline'}
                size={24}
                color={done ? colors.volt : colors.line}
              />
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

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
    ...shadows.card,
  },
  statK: { ...typography.label, fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.muted },
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
    ...shadows.card,
  },
  habitDone: { backgroundColor: colors.voltSoft, borderColor: '#CBE7A5', ...shadows.lift(colors.volt) },
  habitName: { ...typography.label, fontSize: 15, color: colors.ink },
  habitMeta: { ...typography.body, fontSize: 12, color: colors.muted },
  empty: { ...typography.body, fontSize: 13, color: colors.muted },
});
