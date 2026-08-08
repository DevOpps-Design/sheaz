/**
 * SHEAZ — Lecteur de méditation (S9)
 * Compte à rebours + guide respiratoire 4-7-8 + enregistrement de la session en base.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, radii, shadows, spacing, typography } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  durationSec: number;
  onClose: () => void;
  onComplete: (title: string, durationSec: number) => Promise<void>;
}

function fmt(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function MeditationPlayer({ visible, title, durationSec, onClose, onComplete }: Props) {
  const [remaining, setRemaining] = useState(durationSec);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'inspire' | 'hold' | 'expire'>('inspire');
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) {
      setRemaining(durationSec);
      setRunning(false);
      setPhase('inspire');
      setFinished(false);
      setSaving(false);
    }
  }, [visible, durationSec]);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!running || finished) return;
    timer.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (timer.current) clearInterval(timer.current);
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running, finished]);

  // Guide respiratoire : cycle 4-7-8 → inspire 4s, hold 7s, expire 8s
  useEffect(() => {
    if (!running || finished) return;
    const cycle = [
      { p: 'inspire' as const, ms: 4000 },
      { p: 'hold' as const, ms: 7000 },
      { p: 'expire' as const, ms: 8000 },
    ];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % cycle.length;
      setPhase(cycle[i].p);
    }, cycle[i].ms);
    return () => clearInterval(id);
  }, [running, finished]);

  const complete = async () => {
    if (saving) return;
    setSaving(true);
    await onComplete(title, durationSec);
    setSaving(false);
    onClose();
  };

  const phaseMeta = {
    inspire: { label: 'Inspirez…', icon: 'chevron-up' as const, color: colors.blue },
    hold: { label: 'Retenez…', icon: 'pause' as const, color: colors.gold },
    expire: { label: 'Expirez…', icon: 'chevron-down' as const, color: colors.purple },
  }[phase];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={[styles.timer, { borderColor: phaseMeta.color }]}>
            <Text style={[styles.phase, { color: phaseMeta.color }]}>
              <MaterialCommunityIcons name={phaseMeta.icon} size={16} color={phaseMeta.color} /> {phaseMeta.label}
            </Text>
            <Text style={styles.time}>{fmt(remaining)}</Text>
            <Text style={styles.dur}>sur {fmt(durationSec)}</Text>
          </View>

          {finished ? (
            <TouchableOpacity style={[styles.doneBtn, shadows.lift(colors.volt)]} onPress={complete} disabled={saving}>
              <MaterialCommunityIcons name={saving ? 'timer-sand' : 'check-circle'} size={18} color={colors.white} />
              <Text style={styles.doneBtnText}>{saving ? 'Enregistrement…' : 'Terminer & enregistrer'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.controls}>
              <TouchableOpacity style={styles.controlBtn} onPress={() => setRunning((r) => !r)}>
                <MaterialCommunityIcons
                  name={running ? 'pause-circle' : 'play-circle'}
                  size={58}
                  color={colors.purple}
                />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.tip}>Respiration 4-7-8 · inspiration, rétention, expiration</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 27, 44, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...shadows.lift(colors.purple),
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { ...typography.label, fontSize: 18, color: colors.ink, flex: 1, marginRight: 10 },
  timer: {
    borderWidth: 2,
    borderRadius: radii.lg,
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingVertical: 26,
    marginBottom: spacing.lg,
  },
  phase: { ...typography.label, fontSize: 14, flexDirection: 'row', alignItems: 'center', gap: 5 },
  time: { ...typography.display, fontSize: 46, color: colors.ink, marginVertical: 6 },
  dur: { ...typography.body, fontSize: 12, color: colors.muted },
  controls: { alignItems: 'center', marginBottom: spacing.md },
  controlBtn: { padding: 4 },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.volt,
    borderRadius: radii.pill,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  doneBtnText: { ...typography.label, fontSize: 15, color: colors.white },
  tip: { ...typography.body, fontSize: 11, color: colors.muted, textAlign: 'center' },
});
