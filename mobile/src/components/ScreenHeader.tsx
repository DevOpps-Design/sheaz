/**
 * SHEAZ — ScreenHeader
 * En-tête standard : titre (avec accent Playfair pour les moments clés),
 * sous-titre, bouton retour optionnel, avatar.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

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
        {subtitle ? <Text style={styles.greet}>{subtitle}</Text> : null}
        <Text style={styles.title}>
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
    marginBottom: spacing.xl,
  },
  top: {
    flexShrink: 1,
  },
  greet: {
    ...typography.body,
    fontSize: 14,
    color: colors.muted,
  },
  title: {
    ...typography.display,
    fontSize: typography.scale.title,
    lineHeight: 30,
    color: colors.ink,
  },
  accent: {
    ...typography.accent,
    color: colors.blue,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sport,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.display,
    fontSize: 17,
    color: colors.white,
  },
});
