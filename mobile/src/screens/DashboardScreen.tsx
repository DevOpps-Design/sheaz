/**
 * SHEAZ — Dashboard « Jour »
 * Les 3 piliers (Sport · Bien-être · Mental) en cartes aérées + action du soir.
 * Squelette S5 — données fictives de démonstration.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import PillarCard from '../components/PillarCard';
import ScreenHeader from '../components/ScreenHeader';
import { colors, radii, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Votre"
        accent="équilibre"
        subtitle="Bonjour, Credo 🌞"
        avatar="C"
      />

      <PillarCard
        title="Sport"
        description="Séance de ce matin · 45 min"
        percent={70}
        color={colors.sport}
        chip="Objectif : 3/4 séances"
        chipColor={colors.sport}
      />
      <PillarCard
        title="Bien-être"
        description="3 habitudes sur 5 accomplies"
        percent={60}
        color={colors.blue}
        chip="Sommeil : 7 h 30 ⭐"
        chipColor={colors.blue}
      />
      <PillarCard
        title="Mental"
        description="Méditation du soir planifiée"
        percent={40}
        color={colors.purple}
        chip="Humeur : Serein 😌"
        chipColor={colors.purple}
      />

      <Text style={styles.section}>À faire ce soir</Text>
      <TouchableOpacity
        style={styles.ghost}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Mental')}
      >
        <Text style={styles.ghostText}>🧘 Méditation · 10 min</Text>
        <Text style={styles.ghostArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.rewardsLink}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Recompenses')}
      >
        <Text style={styles.rewardsText}>🏆 Mes récompenses</Text>
        <Text style={styles.ghostArrow}>→</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  section: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  ghostText: {
    ...typography.label,
    fontSize: 15,
    color: colors.ink,
    flex: 1,
  },
  ghostArrow: {
    ...typography.display,
    fontSize: 16,
    color: colors.muted,
  },
  rewardsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: '#F0DFB8',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  rewardsText: {
    ...typography.label,
    fontSize: 15,
    color: colors.ink,
    flex: 1,
  },
});
