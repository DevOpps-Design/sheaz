/**
 * SHEAZ — ScreenHeader
 * En-tête standard : titre (avec accent Playfair pour les moments clés),
 * sous-titre, bouton retour optionnel, avatar. Tailles scalées petits écrans.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';
import { s } from '../lib/scale';

interface ScreenHeaderProps {
  title: string;
  accent?: string; // mot en accent Playfair (ex: "équilibre")
  subtitle?: string;
  avatar?: string;
  right?: React.ReactNode;
}

export default function ScreenHeader({ title, accent, subtitle, avatar, right }: ScreenHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        {subtitle ? <Text style={styles.greet} numberOfLines={1}>{subtitle}</Text> : null}
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {title}
          {accent ? <Text style={styles.accent}> {accent}</Text> : null}
        </Text>
      </View>
      {right ?? (avatar ? (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatar}</Text>
        </View>
      ) : null)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: s(spacing.xl),
    gap: s(10),
  },
  top: {
    flexShrink: 1,
  },
  greet: {
    ...typography.body,
    fontSize: s(14),
    color: colors.muted,
  },
  title: {
    ...typography.display,
    fontSize: s(27),
    lineHeight: s(30),
    color: colors.ink,
  },
  accent: {
    ...typography.accent,
    color: colors.blue,
  },
  avatar: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    backgroundColor: colors.sport,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.display,
    fontSize: s(17),
    color: colors.white,
  },
});
