/**
 * SHEAZ — Module Mental (S9 : complet + connecté)
 * Humeur (mood_entries) · Méditations guidées (lecteur + sessions persistées) · Rappels.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { IconName } from '../components/IconBadge';

import ScreenHeader from '../components/ScreenHeader';
import IconBadge from '../components/IconBadge';
import MeditationPlayer from '../components/MeditationPlayer';
import { useMood } from '../hooks/useData';
import { useMeditations } from '../hooks/useMeditations';
import { useHabits } from '../hooks/useData';
import {
  isRemindersEnabled,
  requestPermission,
  scheduleReminders,
  sendTestNotification,
  cancelReminders,
  setRemindersEnabled,
} from '../lib/notifications';
import { colors, radii, shadows, spacing, typography } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MOODS: { icon: IconName; color: string }[] = [
  { icon: 'emoticon-sad-outline', color: colors.sport },
  { icon: 'emoticon-neutral-outline', color: colors.sport },
  { icon: 'emoticon-neutral', color: colors.gold },
  { icon: 'emoticon-happy-outline', color: colors.volt },
  { icon: 'emoticon-happy', color: colors.volt },
  { icon: 'emoticon-excited', color: colors.blue },
];

const MEDITATIONS: { title: string; meta: string; dur: string; sec: number; gradient: 'meditation' | 'purpleRing' }[] = [
  { title: 'Respiration du soir', meta: 'Sérénité · Calme l’esprit', dur: '5 min', sec: 5 * 60, gradient: 'meditation' },
  { title: 'Pause de midi', meta: 'Focus · Retrouver de l’énergie', dur: '3 min', sec: 3 * 60, gradient: 'purpleRing' },
  { title: 'Avant de dormir', meta: 'Sommeil · Lâcher prise', dur: '10 min', sec: 10 * 60, gradient: 'meditation' },
];

export default function MentalScreen() {
  const insets = useSafeAreaInsets();
  const { mood, setMood } = useMood();
  const med = useMeditations();
  const { habits } = useHabits();
  const [player, setPlayer] = useState<(typeof MEDITATIONS)[number] | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // État initial des rappels
  useEffect(() => {
    (async () => {
      const enabled = await isRemindersEnabled();
      setNotifEnabled(enabled);
    })();
  }, []);

  const habitTimes = habits.map((h) => h.reminder_time);

  const toggleReminders = async (on: boolean) => {
    setBusy(true);
    setMsg('');
    if (on) {
      const granted = await requestPermission();
      setNotifGranted(granted);
      if (!granted) {
        setMsg('Notifications refusées — activez-les dans les réglages du navigateur/téléphone.');
        setBusy(false);
        return;
      }
      const ok = await scheduleReminders({ dailyTime: '20:00', habitTimes });
      if (ok) {
        await setRemindersEnabled(true);
        setNotifEnabled(true);
        setMsg('Rappels programmés ✅ (20h00 + vos habitudes)');
      } else {
        setMsg('Impossible de programmer les rappels sur ce support.');
      }
    } else {
      await cancelReminders();
      await setRemindersEnabled(false);
      setNotifEnabled(false);
      setMsg('Rappels désactivés.');
    }
    setBusy(false);
  };

  const testNotif = async () => {
    setBusy(true);
    const ok = await sendTestNotification();
    setMsg(ok ? 'Notification de test envoyée ✅' : 'Test indisponible ici (autorisez les notifications).');
    setBusy(false);
  };

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Mental" subtitle="Comment vous sentez-vous ?" />

      {/* ---------------------------------- Humeur ---------------------------------- */}
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

      {/* ---------------------------------- Stats ---------------------------------- */}
      {!med.loading ? (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{med.countToday}</Text>
            <Text style={styles.statLabel}>aujourd’hui</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{med.totalMinutes}</Text>
            <Text style={styles.statLabel}>min au total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{med.sessions.length}</Text>
            <Text style={styles.statLabel}>sessions</Text>
          </View>
        </View>
      ) : (
        <ActivityIndicator color={colors.purple} style={{ marginTop: 16 }} />
      )}

      {/* ---------------------------------- Méditations ---------------------------------- */}
      <Text style={styles.section}>Méditations guidées</Text>
      {MEDITATIONS.map((medItem) => (
        <TouchableOpacity key={medItem.title} style={styles.med} activeOpacity={0.8} onPress={() => setPlayer(medItem)}>
          <IconBadge icon="meditation" color={colors.purple} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.medName}>{medItem.title}</Text>
            <Text style={styles.medMeta}>{medItem.meta}</Text>
          </View>
          <View style={styles.playSmall}>
            <MaterialCommunityIcons name="play" size={18} color={colors.white} />
          </View>
          <Text style={styles.medDur}>{medItem.dur}</Text>
        </TouchableOpacity>
      ))}

      {/* ---------------------------------- Rappels ---------------------------------- */}
      <Text style={styles.section}>Rappels & notifications</Text>
      <View style={styles.notifCard}>
        <View style={styles.notifRow}>
          <IconBadge icon="bell-ring" color={colors.gold} size={38} />
          <View style={{ flex: 1 }}>
            <Text style={styles.notifTitle}>Rappel quotidien</Text>
            <Text style={styles.notifSub}>20h00 · routine du soir + habitudes</Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={toggleReminders}
            disabled={busy}
            trackColor={{ false: colors.line, true: colors.gold }}
            thumbColor={colors.white}
          />
        </View>
        {msg ? <Text style={styles.notifMsg}>{msg}</Text> : null}
        <TouchableOpacity style={styles.testBtn} onPress={testNotif} disabled={busy}>
          <MaterialCommunityIcons name="bell-outline" size={15} color={colors.purple} />
          <Text style={styles.testBtnText}>Envoyer une notification de test</Text>
        </TouchableOpacity>
      </View>

      {/* ---------------------------------- Routine du soir ---------------------------------- */}
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
        <View style={styles.routineRow}>
          <MaterialCommunityIcons name="meditation" size={18} color={colors.purple} />
          <Text style={styles.routineText}>Méditation · avant de dormir</Text>
        </View>
      </View>

      <MeditationPlayer
        visible={!!player}
        title={player?.title ?? ''}
        durationSec={player?.sec ?? 0}
        onClose={() => setPlayer(null)}
        onComplete={async (t, s) => {
          await med.logSession(t, s);
        }}
      />
    </ScrollView>
  );
}

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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.lift(colors.purple),
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { ...typography.display, fontSize: 22, color: colors.white },
  statLabel: { ...typography.body, fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },
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
    gap: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: 12,
    ...shadows.card,
  },
  playSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: { ...typography.label, fontSize: 15, color: colors.ink },
  medMeta: { ...typography.body, fontSize: 12, color: colors.muted },
  medDur: { ...typography.label, fontSize: 12, color: colors.muted },
  notifCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  notifTitle: { ...typography.label, fontSize: 15, color: colors.ink },
  notifSub: { ...typography.body, fontSize: 12, color: colors.muted },
  notifMsg: { ...typography.body, fontSize: 12, color: colors.purple, marginTop: 10 },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: colors.purple,
    borderRadius: radii.pill,
    paddingVertical: 9,
  },
  testBtnText: { ...typography.label, fontSize: 13, color: colors.purple },
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
