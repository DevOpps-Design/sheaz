/**
 * SHEAZ — Module Corps (Bien-être) — S8 : module complet connecté
 * Sommeil, hydratation, poids réels (Supabase) + habitudes du jour.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ScreenHeader from '../components/ScreenHeader';
import IconBadge from '../components/IconBadge';
import { habitIcon } from '../lib/icons';
import { useHabits } from '../hooks/useData';
import { useHydration, useSleep, useWeight } from '../hooks/useBody';
import { colors, radii, shadows, spacing, typography } from '../theme';

export default function BienEtreScreen() {
  const { habits, logs, toggle, loading } = useHabits();
  const corps = habits.filter((h) => h.pillar === 2);

  const sleep = useSleep();
  const water = useHydration();
  const weight = useWeight();

  const [weightInput, setWeightInput] = useState('');
  const [showWeightInput, setShowWeightInput] = useState(false);

  const sleepDate = sleep.entry?.sleep_date ?? 'hier soir';

  const submitWeight = () => {
    const kg = parseFloat(weightInput.replace(',', '.'));
    if (!kg || kg < 20 || kg > 400) return;
    weight.addWeight(kg);
    setWeightInput('');
    setShowWeightInput(false);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Corps" subtitle="Prendre soin de son corps, en douceur" />

      {/* ---------------------------------- Sommeil ---------------------------------- */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <IconBadge icon="weather-night" color={colors.purple} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Sommeil</Text>
            <Text style={styles.cardSub}>{sleepDate}</Text>
          </View>
          <Text style={styles.cardValue}>{sleep.durationLabel(sleep.entry?.duration_min)}</Text>
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={styles.miniBtn} onPress={() => sleep.adjustDuration(-15)}>
            <MaterialCommunityIcons name="minus" size={18} color={colors.purple} />
          </TouchableOpacity>
          <Text style={styles.rowLabel}>Ajuster la durée</Text>
          <TouchableOpacity style={styles.miniBtn} onPress={() => sleep.adjustDuration(15)}>
            <MaterialCommunityIcons name="plus" size={18} color={colors.purple} />
          </TouchableOpacity>
        </View>

        <View style={styles.qualityRow}>
          <Text style={styles.qualityLabel}>Qualité</Text>
          {[1, 2, 3, 4, 5].map((q) => (
            <TouchableOpacity key={q} onPress={() => sleep.setQuality(q)} style={styles.starBtn}>
              <MaterialCommunityIcons
                name={q <= (sleep.entry?.quality ?? 0) ? 'star' : 'star-outline'}
                size={26}
                color={q <= (sleep.entry?.quality ?? 0) ? colors.gold : colors.line}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ---------------------------------- Hydratation ---------------------------------- */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <IconBadge icon="water" color={colors.blue} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Hydratation</Text>
            <Text style={styles.cardSub}>Objectif {water.goal} verres</Text>
          </View>
          <Text style={styles.cardValue}>{water.glasses}/{water.goal}</Text>
        </View>

        <View style={styles.waterBar}>
          <View style={[styles.waterFill, { width: `${Math.min(100, (water.glasses / water.goal) * 100)}%` }]} />
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={styles.miniBtn} onPress={water.removeGlass} disabled={water.glasses <= 0}>
            <MaterialCommunityIcons name="minus" size={18} color={water.glasses > 0 ? colors.blue : colors.line} />
          </TouchableOpacity>
          <Text style={styles.rowLabel}>Verres du jour</Text>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.blue }]} onPress={water.addGlass}>
            <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
            <Text style={styles.addBtnText}>1 verre</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ---------------------------------- Poids ---------------------------------- */}
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <IconBadge icon="scale-bathroom" color={colors.sport} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Poids</Text>
            <Text style={styles.cardSub}>
              {weight.latest
                ? `Dernière mesure · ${weight.latest.measured_on.slice(5)}`
                : 'Aucune mesure pour l’instant'}
            </Text>
          </View>
          {weight.latest ? (
            <View style={styles.weightValue}>
              <Text style={styles.cardValue}>{weight.latest.value}</Text>
              <Text style={styles.weightUnit}>kg</Text>
            </View>
          ) : null}
        </View>

        {weight.delta !== null && weight.delta !== 0 ? (
          <Text style={[styles.delta, { color: weight.delta > 0 ? colors.sport : colors.volt }]}>
            <MaterialCommunityIcons
              name={weight.delta > 0 ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={weight.delta > 0 ? colors.sport : colors.volt}
            />{' '}
            {Math.abs(weight.delta)} kg vs mesure précédente
          </Text>
        ) : null}

        {showWeightInput ? (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ex : 72,5"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={setWeightInput}
              onSubmitEditing={submitWeight}
              autoFocus
            />
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.sport }]} onPress={submitWeight}>
              <Text style={styles.addBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.ghostBtn} onPress={() => setShowWeightInput(true)}>
            <MaterialCommunityIcons name="plus" size={16} color={colors.sport} />
            <Text style={styles.ghostBtnText}>Ajouter une mesure</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ---------------------------------- Habitudes ---------------------------------- */}
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
              <IconBadge
                icon={habitIcon(habit.name, habit.emoji)}
                color={colors.blue}
                size={38}
                variant={done ? 'solid' : 'soft'}
                glow={done}
              />
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
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  cardTitle: { ...typography.label, fontSize: 16, color: colors.ink },
  cardSub: { ...typography.body, fontSize: 12, color: colors.muted },
  cardValue: { ...typography.display, fontSize: 22, color: colors.ink },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  rowLabel: { ...typography.body, fontSize: 13, color: colors.muted },
  miniBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  addBtnText: { ...typography.label, fontSize: 13, color: colors.white },
  qualityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  qualityLabel: { ...typography.body, fontSize: 13, color: colors.muted, marginRight: 6 },
  starBtn: { padding: 2 },
  waterBar: {
    height: 10,
    backgroundColor: colors.line,
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginTop: 14,
  },
  waterFill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.blue },
  weightValue: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  weightUnit: { ...typography.body, fontSize: 12, color: colors.muted },
  delta: {
    ...typography.label,
    fontSize: 12,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: colors.sport,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    paddingVertical: 10,
  },
  ghostBtnText: { ...typography.label, fontSize: 13, color: colors.sport },
  inputRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.paper,
  },
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
