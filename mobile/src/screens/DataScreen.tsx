/**
 * SHEAZ — Données & RGPD (S13B)
 * Export JSON complet des données personnelles (promesse paywall)
 * + effacement total avec double confirmation inline (cross-platform).
 */
import { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import ScreenHeader from '../components/ScreenHeader';
import IconBadge from '../components/IconBadge';
import { supabase } from '../lib/supabase';
import { colors, radii, shadows, spacing, typography } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Tables possédées par l'utilisateur (RLS propriétaire) — triées pour les FK */
const USER_TABLES = [
  'food_logs',
  'quiz_results',
  'challenge_claims',
  'workout_sessions',
  'meditation_sessions',
  'mood_entries',
  'body_metrics',
  'sleep_entries',
  'hydration_entries',
  'subscriptions',
  'push_tokens',
  'habits', // habit_logs cascade
  'goals',
  'workouts',
] as const;

export default function DataScreen() {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<'export' | 'erase' | null>(null);
  const [confirmErase, setConfirmErase] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const exportData = useCallback(async () => {
    setBusy('export');
    setStatus(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus('Connectez-vous pour exporter vos données.');
        return;
      }

      const dump: Record<string, unknown> = { app: 'Sheaz', exported_at: new Date().toISOString(), user_id: user.id };
      for (const table of USER_TABLES) {
        const { data } = await supabase.from(table).select('*').eq('user_id', user.id);
        dump[table] = data ?? [];
      }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      dump.profile = profile ?? null;

      const json = JSON.stringify(dump, null, 2);
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sheaz-donnees-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ title: 'Mes données Sheaz', message: json });
      }
      setStatus('Export généré ✓ — fichier JSON contenant toutes vos données Sheaz.');
    } catch {
      setStatus('Échec de l’export. Réessayez dans un instant.');
    } finally {
      setBusy(null);
    }
  }, []);

  const eraseData = useCallback(async () => {
    setBusy('erase');
    setStatus(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus('Connectez-vous pour effacer vos données.');
        return;
      }
      for (const table of USER_TABLES) {
        await supabase.from(table).delete().eq('user_id', user.id);
      }
      // Le profil reste (lié au compte) mais est réinitialisé
      await supabase.from('profiles').update({ xp: 0, level: 1, streak: 0, last_active_day: null }).eq('id', user.id);
      setConfirmErase(false);
      setStatus('Toutes vos données ont été effacées ✓ (votre compte reste actif).');
    } catch {
      setStatus('Échec de l’effacement. Réessayez dans un instant.');
    } finally {
      setBusy(null);
    }
  }, []);

  const onErasePress = () => {
    if (!confirmErase) {
      setConfirmErase(true);
      return;
    }
    Alert.alert('Effacer toutes vos données ?', 'Cette action est définitive et irréversible.', [
      { text: 'Annuler', style: 'cancel', onPress: () => setConfirmErase(false) },
      { text: 'Tout effacer', style: 'destructive', onPress: () => void eraseData() },
    ]);
  };

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <ScreenHeader title="Vos" accent="données" subtitle="Export & effacement RGPD (art. 15-17)" />

      <View style={styles.hero}>
        <IconBadge icon="shield-lock-outline" color={colors.blue} size={46} />
        <Text style={styles.heroTitle}>Vos données vous appartiennent</Text>
        <Text style={styles.heroText}>
          Sheaz est conforme au RGPD : données hébergées en Europe, chiffrées, jamais revendues.
          Vous pouvez les exporter ou les effacer à tout moment.
        </Text>
      </View>

      <TouchableOpacity style={styles.action} activeOpacity={0.85} onPress={() => void exportData()} disabled={busy !== null}>
        <IconBadge icon="download-outline" color={colors.sport} size={38} />
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>{busy === 'export' ? 'Export en cours…' : 'Exporter mes données'}</Text>
          <Text style={styles.actionSub}>Fichier JSON complet (profil, repas, objectifs, quiz, métriques)</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.action, confirmErase && styles.actionDanger]}
        activeOpacity={0.85}
        onPress={onErasePress}
        disabled={busy !== null}
      >
        <IconBadge icon={confirmErase ? 'alert-outline' : 'delete-outline'} color={confirmErase ? colors.sport : colors.muted} size={38} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.actionTitle, confirmErase && styles.actionTitleDanger]}>
            {busy === 'erase' ? 'Effacement en cours…' : confirmErase ? 'Confirmer l’effacement total' : 'Effacer mes données'}
          </Text>
          <Text style={styles.actionSub}>
            {confirmErase ? 'Appuyez encore pour confirmer — irréversible' : 'Repas, objectifs, quiz, XP, métriques… tout'}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
      </TouchableOpacity>

      {status ? (
        <View style={styles.status}>
          <MaterialCommunityIcons name="information-outline" size={16} color={colors.blue} />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <Text style={styles.note}>
        L’effacement supprime vos données de nos serveurs (tables de suivi). Le compte et son profil minimal sont conservés,
        conformément à la finalité du service. Pour supprimer aussi le compte, contactez-nous.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: 40 },
  hero: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.lg,
    ...shadows.lift(colors.blue),
  },
  heroTitle: { ...typography.display, fontSize: 18, color: colors.ink, textAlign: 'center' },
  heroText: { ...typography.body, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.lift(colors.sport),
  },
  actionDanger: { borderColor: colors.sport, borderWidth: 2 },
  actionTitle: { ...typography.label, fontSize: 15, color: colors.ink },
  actionTitleDanger: { color: colors.sport },
  actionSub: { ...typography.caption, fontSize: 12, color: colors.muted, marginTop: 2 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.blueSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statusText: { ...typography.label, fontSize: 13, color: colors.ink, flex: 1 },
  note: { ...typography.caption, fontSize: 11, color: colors.muted, lineHeight: 16, marginTop: spacing.md },
});
