/**
 * SHEAZ — PillarCard
 * Carte « pilier » du dashboard : anneau de progression + infos + chip.
 * Un pilier par carte (layout aérien validé).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import IconBadge from './IconBadge';
import type { IconName } from './IconBadge';
import { colors, radii, shadows, spacing, typography } from '../theme';

interface PillarCardProps {
  title: string;
  description: string;
  percent: number; // 0-100
  color: string;
  chip: string;
  chipColor: string;
  /** Icône affichée dans l'anneau (badge relief) */
  icon?: IconName;
}

export default function PillarCard({
  title,
  description,
  percent,
  color,
  chip,
  chipColor,
  icon,
}: PillarCardProps) {
  const size = 88;
  const stroke = 9;
  const r = (size - stroke) / 2 - 4;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - percent / 100);

  return (
    <View style={[styles.card, shadows.lift(color)]}>
      <View style={styles.top}>
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.line} strokeWidth={stroke} />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </Svg>
          <View style={styles.pctWrap}>
            {icon ? <IconBadge icon={icon} color={color} size={46} glow={false} /> : (
              <Text style={styles.pct}>{percent}%</Text>
            )}
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{description}</Text>
          <View style={[styles.chip, { borderColor: colors.line }]}>
            <View style={[styles.dot, { backgroundColor: chipColor }]} />
            <Text style={styles.chipText}>{chip}</Text>
          </View>
        </View>
      </View>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  pctWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: {
    ...typography.display,
    fontSize: 19,
    color: colors.ink,
  },
  info: {
    flex: 1,
  },
  title: {
    ...typography.display,
    fontSize: 17,
    color: colors.ink,
  },
  desc: {
    ...typography.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 9,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipText: {
    ...typography.label,
    fontSize: 12,
    color: colors.ink,
  },
  bar: {
    height: 8,
    backgroundColor: colors.line,
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  barFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
});
