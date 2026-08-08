/**
 * SHEAZ — IconBadge
 * Badge « relief 3D » : dégradé coloré + icône blanche + halo.
 * Utilisé pour les piliers, récompenses, habitudes et actions.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radii, shadows } from '../theme';

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface IconBadgeProps {
  icon: IconName;
  /** Couleur forte du pilier (le dégradé part de cette couleur vers une teinte claire) */
  color: string;
  size?: number;
  /** Icône blanche (dégradé plein) ou couleur forte (fond soft) */
  variant?: 'solid' | 'soft';
  /** Halo coloré autour du badge */
  glow?: boolean;
}

export default function IconBadge({
  icon,
  color,
  size = 44,
  variant = 'solid',
  glow = true,
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
      {soft ? (
        <View
          style={[
            styles.inner,
            {
              backgroundColor: `${color}1A`,
              borderRadius: size * 0.32,
            },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={iconSize} color={color} />
        </View>
      ) : (
        <LinearGradient
          colors={[color, `${color}B3`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.inner, { borderRadius: size * 0.32 }]}
        >
          <MaterialCommunityIcons name={icon} size={iconSize} color={colors.white} />
        </LinearGradient>
      )}
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
