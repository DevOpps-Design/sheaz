/**
 * SHEAZ — Design System tokens (charte graphique v2 — palette SPORT)
 * Validé par Le Credo le 2026-08-08.
 * Source: 05-charte-graphique.md
 */
import type { ViewStyle } from 'react-native';

export const colors = {
  // Base
  ink: '#0E1B2C',
  ink2: '#16263C',
  paper: '#F7F9FC',
  line: '#E3E9F2',
  muted: '#5B6B84',

  // Piliers (identité couleur par module)
  sport: '#FF5A1F',
  sportDeep: '#E8450C',
  blue: '#2E6BFF',
  blueLight: '#5B8CFF',
  purple: '#8B5CF6',
  volt: '#84CC16',
  gold: '#FFC53D',

  // Neutres
  white: '#FFFFFF',
  black: '#000000',

  // Fonds légers par pilier
  sportSoft: '#FFE8DB',
  blueSoft: '#E3ECFF',
  purpleSoft: '#EDE4FF',
  voltSoft: '#F4FAE9',
  goldSoft: '#FFF6E0',
} as const;

export const gradients = {
  cta: [colors.sport, colors.sportDeep] as const,
  avatar: [colors.sport, colors.blue] as const,
  meditation: [colors.purple, colors.blue] as const,
  sportRing: [colors.sport, '#FF8A4C'] as const,
  blueRing: [colors.blue, colors.blueLight] as const,
  purpleRing: [colors.purple, '#A78BFA'] as const,
  reward: [colors.gold, colors.sport] as const,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 26,
} as const;

export const typography = {
  // Polices cibles (à brancher via expo-font + assets dédiés)
  // display: 'Poppins_700Bold', accent: 'PlayfairDisplay_700Bold', body: 'Inter_400Regular'
  display: {
    fontFamily: 'System',
    fontWeight: '700' as const,
  },
  accent: {
    fontFamily: 'System',
    fontStyle: 'italic' as const,
    fontWeight: '700' as const,
  },
  body: {
    fontFamily: 'System',
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'System',
    fontWeight: '600' as const,
  },
  caption: {
    fontFamily: 'System',
    fontWeight: '500' as const,
  },
  // Échelle mobile (charte section 3)
  scale: {
    title: 27,
    subtitle: 18,
    body: 15,
    label: 13,
    caption: 11,
  },
} as const;

export const shadows = {
  card: {},
  cta: {},
  /** Relief 3D : ombre portée colorée par pilier (effet « carte qui flotte ») — désactivé (feedback design : zéro ombre) */
  lift: (_color: string): ViewStyle => ({}),
  /** Halo coloré (badges, icônes actives) — désactivé (feedback design : zéro ombre) */
  glow: (_color: string): ViewStyle => ({}),
} as const;

export const theme = { colors, gradients, radii, spacing, typography, shadows };
export default theme;
