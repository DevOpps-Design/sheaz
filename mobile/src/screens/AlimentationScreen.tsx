/**
 * SHEAZ — Alimentation « Votre assiette » (S11A)
 * Journal des repas (4 moments), catalogue d'aliments avec score santé A-E,
 * totaux du jour (kcal, protéines, fibres, sucres) + conseil personnalisé.
 */
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ScreenHeader from '../components/ScreenHeader';
import IconBadge from '../components/IconBadge';
import { FOODS, FOOD_CATEGORIES, SCORE_LABEL, mealAdvice, type Food, type FoodCategory } from '../data/foods';
import { MEALS, useFood, type MealType } from '../hooks/useFood';
import { colors, radii, shadows, spacing, typography } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const KCAL_TARGET = 2200;

function ScoreBadge({ score, size = 24 }: { score: number; size?: number }) {
  const meta = SCORE_LABEL[score];
  return (
    <View style={[styles.scoreBadge, { backgroundColor: meta.color, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.scoreBadgeText}>{meta.letter}</Text>
    </View>
  );
}

export default function AlimentationScreen() {
  const insets = useSafeAreaInsets();
  const { meals, totals, avgScore, mealCount, addLog, removeLog } = useFood();
  const [pickerMeal, setPickerMeal] = useState<MealType | null>(null);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<FoodCategory | 'all'>('all');
  const [added, setAdded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FOODS.filter((f) => (cat === 'all' || f.cat === cat) && (q === '' || f.name.toLowerCase().includes(q)));
  }, [query, cat]);

  const advice = avgScore === null ? null : mealAdvice(avgScore);
  const kcalPercent = Math.min(100, Math.round((totals.kcal / KCAL_TARGET) * 100));

  const pick = (f: Food) => {
    if (!pickerMeal) return;
    addLog(f, pickerMeal);
    setAdded(f.name);
    setTimeout(() => setAdded(null), 1400);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Votre" accent="assiette" subtitle="Ce que vous mangez, noté honnêtement" />

        {/* Résumé du jour */}
        <View style={styles.summary}>
          <View style={styles.kcalRow}>
            <Text style={styles.kcalValue}>{totals.kcal}</Text>
            <Text style={styles.kcalUnit}>kcal / {KCAL_TARGET}</Text>
          </View>
          <View style={styles.kcalBar}>
            <View style={[styles.kcalFill, { width: `${kcalPercent}%` }]} />
          </View>
          <View style={styles.macroRow}>
            <View style={styles.macro}>
              <Text style={styles.macroValue}>{Math.round(totals.proteinG)}g</Text>
              <Text style={styles.macroLabel}>Protéines</Text>
            </View>
            <View style={styles.macro}>
              <Text style={styles.macroValue}>{Math.round(totals.fiberG)}g</Text>
              <Text style={styles.macroLabel}>Fibres</Text>
            </View>
            <View style={styles.macro}>
              <Text style={styles.macroValue}>{Math.round(totals.sugarG)}g</Text>
              <Text style={styles.macroLabel}>Sucres</Text>
            </View>
            <View style={styles.macro}>
              <Text style={styles.macroValue}>{mealCount}</Text>
              <Text style={styles.macroLabel}>Repas</Text>
            </View>
          </View>
          {avgScore !== null && (
            <View style={styles.scoreRow}>
              <ScoreBadge score={Math.round(avgScore)} size={30} />
              <Text style={styles.scoreText}>
                Score santé du jour : <Text style={{ fontWeight: '700' }}>{SCORE_LABEL[Math.round(avgScore)].label}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Conseil */}
        {advice && (
          <View style={styles.advice}>
            <IconBadge icon="lightbulb-on-outline" color={colors.gold} size={34} />
            <View style={{ flex: 1 }}>
              <Text style={styles.adviceTitle}>{advice.title}</Text>
              <Text style={styles.adviceText}>{advice.text}</Text>
            </View>
          </View>
        )}

        {/* Repas */}
        {MEALS.map((m) => {
          const items = meals[m.key];
          return (
            <View key={m.key} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <IconBadge icon={m.icon as never} color={colors.blue} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealTitle}>{m.label}</Text>
                  <Text style={styles.mealHint}>
                    {items.length === 0 ? m.hint : `${items.reduce((s, l) => s + l.kcal, 0)} kcal`}
                  </Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setPickerMeal(m.key)}>
                  <MaterialCommunityIcons name="plus" size={18} color={colors.white} />
                  <Text style={styles.addBtnText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
              {items.map((l) => (
                <View key={l.id} style={styles.logRow}>
                  <ScoreBadge score={l.score} size={20} />
                  <Text style={styles.logName}>{l.name}</Text>
                  <Text style={styles.logKcal}>{l.kcal} kcal</Text>
                  <TouchableOpacity onPress={() => removeLog(l.id)} hitSlop={8}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={colors.muted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>

      {/* Picker catalogue */}
      <Modal visible={pickerMeal !== null} transparent animationType="fade" onRequestClose={() => setPickerMeal(null)}>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter à {MEALS.find((m) => m.key === pickerMeal)?.label}</Text>
              <TouchableOpacity onPress={() => setPickerMeal(null)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={22} color={colors.ink} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.search}
              placeholder="Rechercher un aliment…"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              <TouchableOpacity style={[styles.catChip, cat === 'all' && styles.catChipOn]} onPress={() => setCat('all')}>
                <Text style={[styles.catText, cat === 'all' && styles.catTextOn]}>Tout</Text>
              </TouchableOpacity>
              {FOOD_CATEGORIES.map((c) => (
                <TouchableOpacity key={c.key} style={[styles.catChip, cat === c.key && styles.catChipOn]} onPress={() => setCat(c.key)}>
                  <Text style={[styles.catText, cat === c.key && styles.catTextOn]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={{ maxHeight: 380 }}>
              {filtered.map((f) => (
                <TouchableOpacity key={f.id} style={styles.foodRow} onPress={() => pick(f)}>
                  <ScoreBadge score={healthScoreOf(f)} size={22} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodName}>{f.name}</Text>
                    <Text style={styles.foodMeta}>
                      {f.portion} · {f.kcal} kcal · P {f.proteinG}g
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.blue} />
                </TouchableOpacity>
              ))}
              {filtered.length === 0 && <Text style={styles.noResult}>Aucun aliment trouvé</Text>}
            </ScrollView>

            {added && (
              <View style={styles.addedToast}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.white} />
                <Text style={styles.addedText}>{added} ajouté</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

import { healthScore as healthScoreOf } from '../data/foods';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: 60 },
  summary: {
    backgroundColor: colors.ink,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.lift(colors.blue),
  },
  kcalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  kcalValue: { ...typography.display, fontSize: 34, color: colors.white },
  kcalUnit: { ...typography.body, fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  kcalBar: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 10, overflow: 'hidden' },
  kcalFill: { height: '100%', borderRadius: 4, backgroundColor: colors.sport },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  macro: { alignItems: 'center' },
  macroValue: { ...typography.display, fontSize: 16, color: colors.white },
  macroLabel: { ...typography.caption, fontSize: 10, color: 'rgba(255,255,255,0.55)' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radii.md, padding: 10 },
  scoreText: { ...typography.body, fontSize: 13, color: colors.white, flex: 1 },
  advice: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#F0DFB8',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.lift(colors.gold),
  },
  adviceTitle: { ...typography.label, fontSize: 14, color: colors.ink },
  adviceText: { ...typography.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  mealCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  mealHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  mealTitle: { ...typography.label, fontSize: 15, color: colors.ink },
  mealHint: { ...typography.caption, fontSize: 11, color: colors.muted },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.blue,
    borderRadius: radii.md,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  addBtnText: { ...typography.label, fontSize: 12, color: colors.white },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderTopWidth: 1, borderTopColor: '#F0F3F8' },
  logName: { ...typography.body, fontSize: 13, color: colors.ink, flex: 1 },
  logKcal: { ...typography.caption, fontSize: 12, color: colors.muted },
  scoreBadge: { alignItems: 'center', justifyContent: 'center' },
  scoreBadgeText: { color: colors.white, fontWeight: '800', fontSize: 11 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(14,27,44,0.55)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: 34,
    maxHeight: '88%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  modalTitle: { ...typography.display, fontSize: 17, color: colors.ink },
  search: {
    backgroundColor: '#F0F3F8',
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  catRow: { gap: 8, paddingBottom: spacing.sm },
  catChip: { backgroundColor: '#F0F3F8', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13 },
  catChipOn: { backgroundColor: colors.blue },
  catText: { ...typography.label, fontSize: 12, color: colors.muted },
  catTextOn: { color: colors.white },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F3F8' },
  foodName: { ...typography.body, fontSize: 14, color: colors.ink },
  foodMeta: { ...typography.caption, fontSize: 11, color: colors.muted },
  noResult: { ...typography.body, fontSize: 13, color: colors.muted, textAlign: 'center', padding: 20 },
  addedToast: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  addedText: { ...typography.label, fontSize: 13, color: colors.white },
});
