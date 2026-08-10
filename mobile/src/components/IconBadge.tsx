/**
 * SHEAZ — IconBadge
 * Badge plat : fond coloré uni + icône blanche (variante soft = fond teinté + icône colorée).
 * Zéro ombre, zéro dégradé (feedback design 2026-08-10).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, shadows } from '../theme';

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface IconBadgeProps {
  icon: IconName;
  /** Couleur forte du pilier (fond du badge) */
  color: string;
  size?: number;
  /** Icône blanche (fond plein) ou couleur forte (fond soft) */
  variant?: 'solid' | 'soft';
  /** Halo coloré autour du badge (désactivé par défaut — zéro ombre) */
  glow?: boolean;
}

export default function IconBadge({
  icon,
  color,
  size = 44,
  variant = 'solid',
  glow = false,
}: IconBadgeProps) {
  const iconSize = Math.round(size * 0.5);
  const soft = variant === 'soft';

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size * 0.32 },
        glow && shadows.glow(color),
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor: soft ? `${color}1A` : color,
            borderRadius: size * 0.32,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={iconSize} color={soft ? color : colors.white} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...shadows.card,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
