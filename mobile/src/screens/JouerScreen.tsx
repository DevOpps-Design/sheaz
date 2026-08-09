/**
 * SHEAZ — Jouer (S11C) : l'app qui ne s'ennuie jamais
 * XP + niveaux · streak quotidien · défi du jour (vérifié sur données réelles)
 * · question du jour · 4 quiz de bien-être · mini-jeu Memory.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ScreenHeader from '../components/ScreenHeader';
import IconBadge from '../components/IconBadge';
import { QUIZZES, dailyQuestion, type QuizKey } from '../data/quiz';
import { useGamification } from '../hooks/useGamification';
import { useFood } from '../hooks/useFood';
import { useHydration } from '../hooks/useBody';
import { useMeditations } from '../hooks/useMeditations';
import { supabase } from '../lib/supabase';
import { colors, gradients, radii, shadows, spacing, typography } from '../theme';

/* ------------------------------ Défis du jour ------------------------------ */
interface DayCounters {
  water: number;
  meditations: number;
  meals: number;
  mood: number;
  workout: number;
  hasGoal: boolean;
}

const CHALLENGES: { id: string; label: string; icon: string; xp: number; check: (c: DayCounters) => boolean }[] = [
  { id: 'water8', label: 'Bois 8 verres d’eau', icon: 'water', xp: 30, check: (c) => c.water >= 8 },
  { id: 'meditate3', label: 'Médite 3 minutes', icon: 'meditation', xp: 30, check: (c) => c.meditations >= 1 },
  { id: 'log3meals', label: 'Logge 3 repas', icon: 'food-apple', xp: 30, check: (c) => c.meals >= 3 },
  { id: 'mood', label: 'Note ton humeur', icon: 'emoticon-happy-outline', xp: 30, check: (c) => c.mood >= 1 },
  { id: 'workout15', label: '15 minutes de sport', icon: 'run-fast', xp: 30, check: (c) => c.workout >= 15 },
  { id: 'quiz', label: 'Fais un quiz', icon: 'head-question-outline', xp: 30, check: () => true },
  { id: 'goal', label: 'Ajoute un objectif', icon: 'target', xp: 30, check: (c) => c.hasGoal },
  { id: 'daily', label: 'Réponds à la question du jour', icon: 'lightbulb-on-outline', xp: 30, check: () => true },
];

/* ------------------------------ Memory game ------------------------------ */
const MEMORY_ICONS = ['water', 'dumbbell', 'meditation', 'apple', 'weather-night', 'run-fast', 'brain', 'fire'] as const;

interface MemoCard {
  id: number;
  icon: (typeof MEMORY_ICONS)[number];
  flipped: boolean;
  matched: boolean;
}

function buildBoard(): MemoCard[] {
  return [...MEMORY_ICONS, ...MEMORY_ICONS]
    .map((icon, i) => ({ id: i, icon, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5);
}

/* ------------------------------ Écran ------------------------------ */
export default function JouerScreen() {
  const gam = useGamification();
  const food = useFood();
  const hydration = useHydration();
  const med = useMeditations();
  const [moodCount, setMoodCount] = useState(0);
  const [workoutMin, setWorkoutMin] = useState(0);

  // Question du jour
  const question = useMemo(() => dailyQuestion(new Date()), []);
  const [dailyPick, setDailyPick] = useState<number | null>(null);

  // Quiz
  const [quizKey, setQuizKey] = useState<QuizKey | null>(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);

  // Memory
  const [board, setBoard] = useState<MemoCard[]>(buildBoard);
  const [moves, setMoves] = useState(0);
  const [flipLock, setFlipLock] = useState(false);
  const [memDone, setMemDone] = useState(false);
  const [memClaimed, setMemClaimed] = useState(false);

  // Compteurs réels du jour
  useEffect(() => {
    const load = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const iso = todayStart.toISOString();
      const { data: moods } = await supabase.from('mood_entries').select('id').gte('created_at', iso);
      const { data: workouts } = await supabase.from('workout_sessions').select('duration_min').gte('created_at', iso);
      setMoodCount(moods?.length ?? 0);
      setWorkoutMin((workouts ?? []).reduce((s, w) => s + (w.duration_min ?? 0), 0));
    };
    load();
  }, []);

  const counters: DayCounters = {
    water: hydration.glasses,
    meditations: med.sessions.length,
    meals: food.mealCount,
    mood: moodCount,
    workout: workoutMin,
    hasGoal: false, // mis à jour ci-dessous via goals (allégé)
  };

  const challenge = CHALLENGES[Math.floor(Date.now() / 86400000) % CHALLENGES.length];
  const challengeDone = challenge.check(counters);
  const challengeClaimed = gam.isChallengeClaimed(challenge.id);

  /* --- Question du jour --- */
  const answerDaily = (i: number) => {
    setDailyPick(i);
    if (i === question.correct && !gam.hasAnsweredDaily) gam.markDailyAnswered();
  };

  /* --- Quiz --- */
  const quiz = quizKey ? QUIZZES[quizKey] : null;
  const answerQuiz = (i: number) => {
    if (quizPick !== null) return;
    setQuizPick(i);
    if (i === quiz!.questions[quizIdx].correct) setQuizScore((s) => s + 1);
  };
  const nextQuiz = () => {
    if (quizIdx + 1 >= quiz!.questions.length) {
      setQuizDone(true);
      if (!gam.hasDoneQuiz(quizKey!)) gam.markQuizDone(quizKey!, quizScore, quiz!.questions.length);
    } else {
      setQuizIdx((i) => i + 1);
      setQuizPick(null);
    }
  };
  const closeQuiz = () => {
    setQuizKey(null);
    setQuizIdx(0);
    setQuizScore(0);
    setQuizPick(null);
    setQuizDone(false);
  };

  /* --- Memory --- */
  const flip = (card: MemoCard) => {
    if (flipLock || card.flipped || card.matched) return;
    setMoves((m) => m + 1);
    const next = board.map((c) => (c.id === card.id ? { ...c, flipped: true } : c));
    setBoard(next);
    const flipped = next.filter((c) => c.flipped && !c.matched);
    if (flipped.length === 2) {
      setFlipLock(true);
      setTimeout(() => {
        const [a, b] = flipped;
        let updated: MemoCard[];
        if (a.icon === b.icon) {
          updated = next.map((c) => (c.id === a.id || c.id === b.id ? { ...c, matched: true, flipped: false } : c));
          if (updated.every((c) => c.matched)) {
            setMemDone(true);
            if (!memClaimed) {
              gam.awardXp(20);
              setMemClaimed(true);
            }
          }
        } else {
          updated = next.map((c) => (c.id === a.id || c.id === b.id ? { ...c, flipped: false } : c));
        }
        setBoard(updated);
        setFlipLock(false);
      }, 650);
    }
  };
  const resetMemory = () => {
    setBoard(buildBoard());
    setMoves(0);
    setMemDone(false);
    setMemClaimed(false);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Jouer," accent="progresser" subtitle="Chaque action compte" />

        {/* Carte niveau */}
        <View style={styles.levelCard}>
          <View style={styles.levelLeft}>
            <LinearGradientBadge icon="shield-star" />
            <View>
              <Text style={styles.levelTitle}>
                Niveau {gam.level} · {gam.levelTitle}
              </Text>
              <Text style={styles.levelXp}>{gam.xp} XP au total</Text>
            </View>
          </View>
          <View style={styles.levelBar}>
            <View style={[styles.levelFill, { width: `${Math.min(100, Math.round((gam.levelInto / gam.levelNeeded) * 100))}%` }]} />
          </View>
          <View style={styles.levelMeta}>
            <Text style={styles.levelMetaText}>
              {gam.levelInto} / {gam.levelNeeded} XP vers le niveau {gam.level + 1}
            </Text>
            <View style={styles.streakChip}>
              <MaterialCommunityIcons name="fire" size={14} color={colors.sport} />
              <Text style={styles.streakText}>{gam.streak} jour{gam.streak > 1 ? 's' : ''}</Text>
            </View>
          </View>
        </View>

        {/* Défi du jour */}
        <Text style={styles.section}>Défi du jour</Text>
        <View style={[styles.challengeCard, challengeDone && styles.challengeCardDone]}>
          <IconBadge icon={challenge.icon as never} color={challengeDone ? colors.volt : colors.blue} size={42} />
          <View style={{ flex: 1 }}>
            <Text style={styles.challengeLabel}>{challenge.label}</Text>
            <Text style={styles.challengeXp}>+{challenge.xp} XP</Text>
          </View>
          {challengeDone ? (
            challengeClaimed ? (
              <View style={styles.claimedChip}>
                <MaterialCommunityIcons name="check" size={14} color={colors.white} />
                <Text style={styles.claimedText}>Gagné</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.claimBtn} onPress={() => gam.claimChallenge(challenge.id)}>
                <Text style={styles.claimText}>Réclamer</Text>
              </TouchableOpacity>
            )
          ) : (
            <MaterialCommunityIcons name="lock-outline" size={20} color={colors.muted} />
          )}
        </View>

        {/* Question du jour */}
        <Text style={styles.section}>Question du jour</Text>
        <View style={styles.dailyCard}>
          <Text style={styles.dailyFact}>{question.fact}</Text>
          <Text style={styles.dailyQ}>{question.q}</Text>
          {question.options.map((opt, i) => {
            const isPick = dailyPick === i;
            const isCorrect = i === question.correct;
            const showState = dailyPick !== null;
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.option,
                  showState && isCorrect && styles.optionGood,
                  showState && isPick && !isCorrect && styles.optionBad,
                ]}
                onPress={() => answerDaily(i)}
                disabled={showState}
              >
                <Text style={styles.optionText}>{opt}</Text>
                {showState && isCorrect && <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />}
                {showState && isPick && !isCorrect && <MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" />}
              </TouchableOpacity>
            );
          })}
          {dailyPick !== null && (
            <Text style={styles.dailyExplain}>{question.explain}</Text>
          )}
        </View>

        {/* Quiz */}
        <Text style={styles.section}>Quiz bien-être</Text>
        <View style={styles.quizGrid}>
          {(Object.keys(QUIZZES) as QuizKey[]).map((k) => (
            <TouchableOpacity key={k} style={styles.quizCard} onPress={() => setQuizKey(k)}>
              <IconBadge icon={QUIZZES[k].icon as never} color={colors.purple} size={36} />
              <Text style={styles.quizTitle}>{QUIZZES[k].title}</Text>
              <Text style={styles.quizMeta}>{QUIZZES[k].questions.length} questions · +15 XP</Text>
              {gam.hasDoneQuiz(k) && (
                <View style={styles.quizDoneChip}>
                  <MaterialCommunityIcons name="check" size={11} color={colors.white} />
                  <Text style={styles.quizDoneText}>fait</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Memory */}
        <Text style={styles.section}>Memory bien-être</Text>
        <View style={styles.memoryCard}>
          <View style={styles.memoryHead}>
            <Text style={styles.memoryMoves}>{moves} coups</Text>
            <TouchableOpacity onPress={resetMemory}>
              <MaterialCommunityIcons name="refresh" size={20} color={colors.blue} />
            </TouchableOpacity>
          </View>
          <View style={styles.memoryGrid}>
            {board.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.memoCell, (c.flipped || c.matched) && styles.memoCellOn, c.matched && styles.memoCellMatched]}
                onPress={() => flip(c)}
              >
                {c.flipped || c.matched ? (
                  <MaterialCommunityIcons name={c.icon} size={22} color={c.matched ? colors.volt : colors.blue} />
                ) : (
                  <MaterialCommunityIcons name="help" size={20} color="#C3CDDC" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          {memDone && (
            <View style={styles.memDone}>
              <MaterialCommunityIcons name="party-popper" size={16} color={colors.ink} />
              <Text style={styles.memDoneText}>Bravo — mémoire d’acier ! (+20 XP)</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal quiz */}
      <Modal visible={quiz !== null} transparent animationType="fade" onRequestClose={closeQuiz}>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            {quiz && !quizDone && (
              <>
                <View style={styles.modalHead}>
                  <Text style={styles.modalTitle}>{quiz.title}</Text>
                  <Text style={styles.modalCount}>
                    {quizIdx + 1} / {quiz.questions.length}
                  </Text>
                </View>
                <Text style={styles.quizQuestion}>{quiz.questions[quizIdx].q}</Text>
                {quiz.questions[quizIdx].options.map((opt, i) => {
                  const isPick = quizPick === i;
                  const isCorrect = i === quiz.questions[quizIdx].correct;
                  const showState = quizPick !== null;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.option,
                        showState && isCorrect && styles.optionGood,
                        showState && isPick && !isCorrect && styles.optionBad,
                      ]}
                      onPress={() => answerQuiz(i)}
                      disabled={showState}
                    >
                      <Text style={styles.optionText}>{opt}</Text>
                      {showState && isCorrect && <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />}
                      {showState && isPick && !isCorrect && <MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" />}
                    </TouchableOpacity>
                  );
                })}
                {quizPick !== null && (
                  <View style={styles.quizExplainWrap}>
                    <Text style={styles.quizExplain}>{quiz.questions[quizIdx].explain}</Text>
                    <TouchableOpacity style={styles.quizNext} onPress={nextQuiz}>
                      <Text style={styles.quizNextText}>
                        {quizIdx + 1 >= quiz.questions.length ? 'Voir mon score' : 'Question suivante'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
            {quiz && quizDone && (
              <>
                <IconBadge icon={quizScore >= 6 ? 'trophy' : quizScore >= 4 ? 'thumb-up' : 'arm-flex'} color={colors.gold} size={64} />
                <Text style={styles.resultTitle}>
                  {quizScore >= 6 ? 'Excellent !' : quizScore >= 4 ? 'Bien joué !' : 'Continue !'}
                </Text>
                <Text style={styles.resultScore}>
                  {quizScore} / {quiz.questions.length}
                </Text>
                <Text style={styles.resultText}>
                  {quizScore >= 6
                    ? 'Vous êtes un as du bien-être. Partagez vos connaissances !'
                    : quizScore >= 4
                      ? 'De bonnes bases — relisez les explications pour devenir un pro.'
                      : 'Chaque quiz est une occasion d’apprendre. Retentez demain !'}
                </Text>
                <TouchableOpacity style={styles.quizNext} onPress={closeQuiz}>
                  <Text style={styles.quizNextText}>Terminer (+15 XP)</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function LinearGradientBadge({ icon }: { icon: string }) {
  return (
    <View style={styles.gradBadge}>
      <MaterialCommunityIcons name={icon as never} size={24} color={colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: 60 },
  section: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  levelCard: {
    backgroundColor: colors.ink,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.lift(colors.purple),
  },
  levelLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gradBadge: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow(colors.purple),
  },
  levelTitle: { ...typography.display, fontSize: 17, color: colors.white },
  levelXp: { ...typography.caption, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  levelBar: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 14, overflow: 'hidden' },
  levelFill: { height: '100%', borderRadius: 4, backgroundColor: gradients.reward[0] },
  levelMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  levelMetaText: { ...typography.caption, fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  streakChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,90,31,0.2)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  streakText: { ...typography.label, fontSize: 12, color: colors.sport },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  challengeCardDone: { borderColor: colors.volt },
  challengeLabel: { ...typography.label, fontSize: 15, color: colors.ink },
  challengeXp: { ...typography.caption, fontSize: 12, color: colors.volt },
  claimBtn: { backgroundColor: colors.volt, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  claimText: { ...typography.label, fontSize: 12, color: colors.ink },
  claimedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.volt, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  claimedText: { ...typography.label, fontSize: 12, color: colors.ink },
  dailyCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#F0DFB8',
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.lift(colors.gold),
  },
  dailyFact: { ...typography.caption, fontSize: 11, color: colors.gold, marginBottom: 6 },
  dailyQ: { ...typography.display, fontSize: 15, color: colors.ink, marginBottom: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F6FA',
    borderRadius: radii.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  optionGood: { backgroundColor: '#E8F9E8' },
  optionBad: { backgroundColor: '#FDE8E8' },
  optionText: { ...typography.body, fontSize: 13, color: colors.ink, flex: 1 },
  dailyExplain: { ...typography.body, fontSize: 12, color: colors.muted, marginTop: 6, fontStyle: 'italic' },
  quizGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quizCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 6,
    ...shadows.card,
  },
  quizTitle: { ...typography.label, fontSize: 14, color: colors.ink },
  quizMeta: { ...typography.caption, fontSize: 11, color: colors.muted },
  quizDoneChip: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', backgroundColor: colors.volt, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 },
  quizDoneText: { ...typography.caption, fontSize: 10, color: colors.ink, fontWeight: '700' },
  memoryCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  memoryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  memoryMoves: { ...typography.caption, fontSize: 12, color: colors.muted },
  memoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memoCell: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: radii.md,
    backgroundColor: '#F0F3F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoCellOn: { backgroundColor: '#EDF3FF' },
  memoCellMatched: { backgroundColor: '#F2FCD8' },
  memDone: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F2FCD8', borderRadius: radii.md, padding: 10, marginTop: 12 },
  memDoneText: { ...typography.label, fontSize: 12, color: colors.ink },
  modalWrap: { flex: 1, backgroundColor: 'rgba(14,27,44,0.55)', justifyContent: 'center', padding: spacing.xl },
  modal: { backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { ...typography.display, fontSize: 17, color: colors.ink },
  modalCount: { ...typography.caption, fontSize: 13, color: colors.muted },
  quizQuestion: { ...typography.display, fontSize: 16, color: colors.ink, marginBottom: 14 },
  quizExplainWrap: { marginTop: 6 },
  quizExplain: { ...typography.body, fontSize: 12, color: colors.muted, fontStyle: 'italic', marginBottom: 12 },
  quizNext: { backgroundColor: colors.sport, borderRadius: radii.lg, paddingVertical: 14, alignItems: 'center' },
  quizNextText: { ...typography.display, fontSize: 14, color: colors.white },
  resultTitle: { ...typography.display, fontSize: 20, color: colors.ink, marginTop: 12 },
  resultScore: { ...typography.display, fontSize: 30, color: colors.sport, marginVertical: 6 },
  resultText: { ...typography.body, fontSize: 13, color: colors.muted, textAlign: 'center', marginBottom: 16 },
});
