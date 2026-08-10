/**
 * SHEAZ — Objectifs 2.0 (S11B)
 * CRUD complet (créer / supprimer), objectifs SMART par pilier (sport / corps /
 * mental), progression automatique calculée depuis les vraies données,
 * célébration animée à l'atteinte.
 */
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ScreenHeader from '../components/ScreenHeader';
import IconBadge from '../components/IconBadge';
import { GOAL_PILLARS, GOAL_UNITS, useGoals2, type Goal } from '../hooks/useGoals2';
import { useFood } from '../hooks/useFood';
import { useHydration } from '../hooks/useBody';
import { colors, radii, shadows, spacing, typography } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ObjectifsScreen() {
  const insets = useSafeAreaInsets();
  const { goals, loading, createGoal, deleteGoal, progressOf } = useGoals2();
  const { mealCount } = useFood();
  const hydration = useHydration();

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [pillar, setPillar] = useState(1);
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState<string>('séances');
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const extra = useMemo(() => ({ meals: mealCount, water: hydration.glasses }), [mealCount, hydration.glasses]);

  const submit = async () => {
    if (!title.trim()) return;
    const ok = await createGoal({
      pillar,
      title: title.trim(),
      target: target ? parseFloat(target) : null,
      unit,
      period,
    });
    if (ok) {
      setTitle('');
      setTarget('');
      setShowCreate(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Mes"
          accent="objectifs"
          subtitle="Des cibles claires, un progrès mesuré"
          right={
            <TouchableOpacity style={styles.addTop} onPress={() => setShowCreate(true)}>
              <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
            </TouchableOpacity>
          }
        />

        {loading && <ActivityIndicator color={colors.sport} style={{ marginTop: 30 }} />}

        {goals.length === 0 && !loading && (
          <View style={styles.empty}>
            <IconBadge icon="target" color={colors.sport} size={56} />
            <Text style={styles.emptyTitle}>Aucun objectif</Text>
            <Text style={styles.emptyText}>Créez votre premier objectif sport, santé ou mental — la progression se calcule toute seule.</Text>
            <TouchableOpacity style={styles.emptyCta} onPress={() => setShowCreate(true)}>
              <Text style={styles.emptyCtaText}>Créer un objectif</Text>
            </TouchableOpacity>
          </View>
        )}

        {goals.map((g: Goal) => {
          const prog = progressOf(g, extra);
          const meta = GOAL_PILLARS.find((p) => p.pillar === g.pillar) ?? GOAL_PILLARS[0];
          return (
            <View key={g.id} style={[styles.goalCard, prog.done && styles.goalCardDone]}>
              <View style={styles.goalHead}>
                <IconBadge icon={meta.icon as never} color={meta.color} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalTitle}>{g.title}</Text>
                  <Text style={styles.goalMeta}>
                    {meta.label} · {g.period === 'day' ? 'quotidien' : g.period === 'week' ? 'hebdo' : 'mensuel'}
                    {g.unit ? ` · ${g.unit}` : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => deleteGoal(g.id)} hitSlop={10}>
                  <MaterialCommunityIcons name="delete-outline" size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.progressRow}>
                <Text style={styles.progressText}>
                  {prog.current} / {prog.target} {g.unit ?? ''}
                </Text>
                <Text style={[styles.progressPct, prog.done && { color: colors.volt }]}>{prog.percent}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${prog.percent}%`, backgroundColor: meta.color }]} />
              </View>

              {prog.done && (
                <View style={styles.doneBanner}>
                  <MaterialCommunityIcons name="party-popper" size={15} color={colors.ink} />
                  <Text style={styles.doneText}>Objectif atteint — bravo !</Text>
                </View>
              )}
            </View>
          );
        })}

        {goals.length > 0 && (
          <TouchableOpacity style={styles.addCard} onPress={() => setShowCreate(true)}>
            <MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.blue} />
            <Text style={styles.addCardText}>Nouvel objectif</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal création */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nouvel objectif</Text>

            <TextInput
              style={styles.input}
              placeholder="Ex : Courir 3 fois par semaine"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.fieldLabel}>Pilier</Text>
            <View style={styles.pillarRow}>
              {GOAL_PILLARS.map((p) => (
                <TouchableOpacity
                  key={p.pillar}
                  style={[styles.pillarChip, pillar === p.pillar && { backgroundColor: p.color }]}
                  onPress={() => setPillar(p.pillar)}
                >
                  <MaterialCommunityIcons name={p.icon as never} size={16} color={pillar === p.pillar ? colors.white : p.color} />
                  <Text style={[styles.pillarText, pillar === p.pillar && styles.pillarTextOn]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Cible</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex : 3"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  value={target}
                  onChangeText={setTarget}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Unité</Text>
                <View style={styles.unitRow}>
                  {GOAL_UNITS.slice(0, 4).map((u) => (
                    <TouchableOpacity key={u} style={[styles.unitChip, unit === u && styles.unitChipOn]} onPress={() => setUnit(u)}>
                      <Text style={[styles.unitText, unit === u && styles.unitTextOn]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Période</Text>
            <View style={styles.periodRow}>
              {(['day', 'week', 'month'] as const).map((p) => (
                <TouchableOpacity key={p} style={[styles.periodChip, period === p && styles.periodChipOn]} onPress={() => setPeriod(p)}>
                  <Text style={[styles.periodText, period === p && styles.periodTextOn]}>
                    {p === 'day' ? 'Quotidien' : p === 'week' ? 'Hebdo' : 'Mensuel'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submit} onPress={submit} disabled={!title.trim()}>
              <Text style={styles.submitText}>Créer l'objectif</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancel} onPress={() => setShowCreate(false)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: 60 },
  addTop: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.sport,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lift(colors.sport),
  },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { ...typography.display, fontSize: 18, color: colors.ink },
  emptyText: { ...typography.body, fontSize: 13, color: colors.muted, textAlign: 'center', maxWidth: 260 },
  emptyCta: { backgroundColor: colors.sport, borderRadius: radii.lg, paddingVertical: 13, paddingHorizontal: 26, marginTop: 8 },
  emptyCtaText: { ...typography.display, fontSize: 14, color: colors.white },
  goalCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  goalCardDone: { borderColor: colors.volt, borderWidth: 1.5 },
  goalHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalTitle: { ...typography.label, fontSize: 15, color: colors.ink },
  goalMeta: { ...typography.caption, fontSize: 11, color: colors.muted, marginTop: 2 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 6 },
  progressText: { ...typography.body, fontSize: 12, color: colors.muted },
  progressPct: { ...typography.display, fontSize: 13, color: colors.ink },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: '#EDF1F7', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2FCD8',
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  doneText: { ...typography.label, fontSize: 12, color: colors.ink },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.blue,
    borderRadius: radii.lg,
    paddingVertical: 16,
  },
  addCardText: { ...typography.label, fontSize: 14, color: colors.blue },
  modalWrap: { flex: 1, backgroundColor: 'rgba(14,27,44,0.55)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 34 },
  modalTitle: { ...typography.display, fontSize: 18, color: colors.ink, marginBottom: spacing.md },
  input: {
    backgroundColor: '#F0F3F8',
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  fieldLabel: { ...typography.caption, fontSize: 11, color: colors.muted, marginTop: 8, marginBottom: 6, letterSpacing: 0.6, textTransform: 'uppercase' },
  pillarRow: { flexDirection: 'row', gap: 8 },
  pillarChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F3F8', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 13 },
  pillarText: { ...typography.label, fontSize: 12, color: colors.muted },
  pillarTextOn: { color: colors.white },
  twoCol: { flexDirection: 'row', gap: 10 },
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  unitChip: { backgroundColor: '#F0F3F8', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 10 },
  unitChipOn: { backgroundColor: colors.blue },
  unitText: { ...typography.label, fontSize: 11, color: colors.muted },
  unitTextOn: { color: colors.white },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodChip: { backgroundColor: '#F0F3F8', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  periodChipOn: { backgroundColor: colors.ink },
  periodText: { ...typography.label, fontSize: 12, color: colors.muted },
  periodTextOn: { color: colors.white },
  submit: { backgroundColor: colors.sport, borderRadius: radii.lg, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  submitText: { ...typography.display, fontSize: 15, color: colors.white },
  cancel: { alignItems: 'center', paddingVertical: 10, marginTop: 4 },
  cancelText: { ...typography.label, fontSize: 13, color: colors.muted },
});
