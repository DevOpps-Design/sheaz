/**
 * SHEAZ — Module Mental — connecté
 * Humeur réelle (insert mood_entries) + méditations (démo).
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { IconName } from '../components/IconBadge';

import ScreenHeader from '../components/ScreenHeader';
import { useMood } from '../hooks/useData';
import { colors, radii, shadows, spacing, typography } from '../theme';

const MOODS: { icon: IconName; color: string }[] = [
  { icon: 'emoticon-sad-outline', color: colors.sport },
  { icon: 'emoticon-neutral-outline', color: colors.sport },
  { icon: 'emoticon-neutral', color: colors.gold },
  { icon: 'emoticon-happy-outline', color: colors.volt },
  { icon: 'emoticon-happy', color: colors.volt },
  { icon: 'emoticon-excited', color: colors.blue },
];

export default function MentalScreen() {
  const { mood, setMood } = useMood();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Mental" subtitle="Comment vous sentez-vous ?" />

      <View style={styles.moodCard}>
        {MOODS.map((m, index) => (
          <TouchableOpacity key={m.icon} style={[styles.mood, mood === index && { ...styles.moodSel, ...shadows.glow(m.color) }]} onPress={() => setMood(index)}>
            <MaterialCommunityIcons
              name={m.icon}
              size={mood === index ? 34 : 30}
              color={mood === index ? m.color : colors.muted}
            />
          </TouchableOpacity>
        ))}
      </View>
      {mood !== null ? (
        <Text style={styles.saved}><MaterialCommunityIcons name="check-circle" size={14} color={colors.volt} /> Humeur notée</Text>
      ) : null}

      <Text style={styles.section}>Méditations guidées</Text>
      {meditations.map((med) => (
        <TouchableOpacity key={med.name} style={styles.med} activeOpacity={0.8}>
          <View style={styles.play}>
            <MaterialCommunityIcons name="play" size={22} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.medName}>{med.name}</Text>
            <Text style={styles.medMeta}>{med.meta}</Text>
          </View>
          <Text style={styles.medDur}>{med.dur}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.section}>Routine du soir</Text>
      <View style={styles.routineCard}>
        <View style={styles.routineRow}>
          <MaterialCommunityIcons name="weather-night" size={18} color={colors.purple} />
          <Text style={styles.routineText}>Journal d'humeur · 21h30</Text>
        </View>
        <View style={styles.routineRow}>
          <MaterialCommunityIcons name="cellphone-off" size={18} color={colors.purple} />
          <Text style={styles.routineText}>Écrans off · 22h00</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const meditations = [
  { name: 'Respiration du soir', meta: 'Sérénité · Calme l’esprit', dur: '10 min' },
  { name: 'Pause de midi', meta: 'Focus · Retrouver de l’énergie', dur: '5 min' },
  { name: 'Avant de dormir', meta: 'Sommeil · Lâcher prise', dur: '15 min' },
];

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: 40 },
  moodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  mood: { padding: 7, borderRadius: radii.md },
  moodSel: { backgroundColor: colors.paper, transform: [{ scale: 1.12 }] },
  saved: {
    ...typography.label,
    fontSize: 12,
    color: colors.volt,
    textAlign: 'center',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  section: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  med: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: 12,
    ...shadows.card,
  },
  play: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow(colors.purple),
  },
  medName: { ...typography.label, fontSize: 15, color: colors.ink },
  medMeta: { ...typography.body, fontSize: 12, color: colors.muted },
  medDur: { ...typography.label, fontSize: 12, color: colors.muted },
  routineCard: {
    backgroundColor: colors.purpleSoft,
    borderWidth: 1,
    borderColor: '#D9CCF7',
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  routineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routineText: { ...typography.label, fontSize: 14, color: colors.ink },
});
