/**
 * SHEAZ — Module Sport — connecté
 * Chrono réel → workout_sessions (start/stop persistés en base).
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import { useWorkoutSession } from '../hooks/useData';
import { colors, radii, spacing, typography } from '../theme';

export default function SportScreen() {
  const { running, seconds, loading, start, stop } = useWorkoutSession();

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Sport" subtitle={running ? 'Séance en cours 🔥' : 'Prêt pour la séance ?'} />

      <View style={styles.session}>
        <Text style={styles.sessionTtl}>{running ? 'Séance en cours' : 'Séance du jour'}</Text>
        <Text style={styles.time}>{mm}:{ss}</Text>
        <Text style={styles.sessionLbl}>Force · 6 exercices · 45 min</Text>
        <TouchableOpacity
          style={[styles.pause, running && styles.pauseStop]}
          onPress={running ? stop : start}
          disabled={loading}
        >
          <Text style={styles.pauseText}>{running ? 'Terminer' : 'Démarrer'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statK}>Séances/sem</Text>
          <Text style={styles.statV}>3 <Text style={styles.statSmall}>/4</Text></Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statK}>Streak</Text>
          <Text style={styles.statV}>12 <Text style={styles.statSmall}>🔥</Text></Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statK}>Calories</Text>
          <Text style={styles.statV}>{Math.round(seconds * 0.09)} <Text style={styles.statSmall}>kcal</Text></Text>
        </View>
      </View>

      <Text style={styles.section}>Plan de la semaine</Text>
      {week.map((day) => (
        <View key={day.name} style={[styles.weekRow, day.today && styles.weekToday]}>
          <View style={[styles.check, day.done && styles.checkDone]}>
            {day.done ? <Text style={styles.checkText}>✓</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.weekName}>{day.name}</Text>
            <Text style={styles.weekMeta}>{day.meta}</Text>
          </View>
          <Text style={styles.weekTime}>{day.time}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const week = [
  { name: 'Lundi · Force', meta: '45 min · Terminé', time: '✓', done: true, today: false },
  { name: 'Mardi · Cardio léger', meta: '30 min · Terminé', time: '✓', done: true, today: false },
  { name: 'Jeudi · Mobilité', meta: '20 min · Aujourd’hui', time: '▶', done: false, today: true },
  { name: 'Samedi · Endurance', meta: '60 min', time: '—', done: false, today: false },
];

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: 40 },
  session: {
    backgroundColor: colors.ink,
    borderRadius: radii.lg,
    paddingVertical: 34,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sessionTtl: { ...typography.body, fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  time: { ...typography.display, fontSize: 58, color: colors.sport, marginVertical: 12 },
  sessionLbl: { ...typography.body, fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  pause: {
    marginTop: 22,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.32)',
    borderRadius: radii.pill,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  pauseStop: { backgroundColor: colors.sport, borderColor: colors.sport },
  pauseText: { ...typography.label, fontSize: 15, color: colors.white },
  statRow: { flexDirection: 'row', gap: 11, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.lg,
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
  weekRow: {
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
  weekToday: { borderColor: colors.sport, backgroundColor: '#FFF7F2' },
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
  weekName: { ...typography.label, fontSize: 15, color: colors.ink },
  weekMeta: { ...typography.body, fontSize: 12, color: colors.muted },
  weekTime: { ...typography.label, fontSize: 12, color: colors.muted },
});
