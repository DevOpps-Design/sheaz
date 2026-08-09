/**
 * SHEAZ — Dashboard « Jour » (connecté)
 * Les 3 piliers calculés depuis les vraies données Supabase + action du soir.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import PillarCard from '../components/PillarCard';
import ScreenHeader from '../components/ScreenHeader';
import IconBadge from '../components/IconBadge';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDashboard } from '../hooks/useData';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import { colors, radii, shadows, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dashboard = useDashboard();
  const { isPremium } = useSubscription();
  const [name, setName] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as Record<string, string> | undefined;
      setName(meta?.display_name || data.user?.email?.split('@')[0] || 'Credo');
    });
  }, []);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={dashboard.loading} onRefresh={dashboard.refresh} tintColor={colors.sport} />
      }
    >
      <ScreenHeader title="Votre" accent="équilibre" subtitle={`Bonjour, ${name}`} avatar={name.slice(0, 1).toUpperCase()} />

      {dashboard.loading ? (
        <ActivityIndicator color={colors.sport} style={{ marginTop: 30 }} />
      ) : (
        <>
          <PillarCard
            title="Sport"
            description={dashboard.sport.label}
            percent={dashboard.sport.percent}
            color={colors.sport}
            chip="Objectif hebdo"
            chipColor={colors.sport}
            icon="dumbbell"
          />
          <PillarCard
            title="Corps"
            description={dashboard.corps.label}
            percent={dashboard.corps.percent}
            color={colors.blue}
            chip="Aujourd'hui"
            chipColor={colors.blue}
            icon="water"
          />
          <PillarCard
            title="Mental"
            description={dashboard.mental.label}
            percent={dashboard.mental.percent}
            color={colors.purple}
            chip="Aujourd'hui"
            chipColor={colors.purple}
            icon="meditation"
          />
        </>
      )}

      <Text style={styles.section}>Vos espaces</Text>
      <View style={styles.spacesRow}>
        <TouchableOpacity style={styles.spaceCard} activeOpacity={0.85} onPress={() => navigation.navigate('Alimentation')}>
          <IconBadge icon="food-apple" color={colors.gold} size={38} />
          <Text style={styles.spaceTitle}>Assiette</Text>
          <Text style={styles.spaceSub}>Manger mieux</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.spaceCard} activeOpacity={0.85} onPress={() => navigation.navigate('Objectifs')}>
          <IconBadge icon="target" color={colors.sport} size={38} />
          <Text style={styles.spaceTitle}>Objectifs</Text>
          <Text style={styles.spaceSub}>Progresser</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.spaceCard} activeOpacity={0.85} onPress={() => navigation.navigate('Jouer')}>
          <IconBadge icon="gamepad-variant" color={colors.purple} size={38} />
          <Text style={styles.spaceTitle}>Jouer</Text>
          <Text style={styles.spaceSub}>Se divertir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.spaceCard} activeOpacity={0.85} onPress={() => navigation.navigate('Insights')}>
          <IconBadge icon="chart-line" color={colors.blue} size={38} />
          <Text style={styles.spaceTitle}>Insights</Text>
          <Text style={styles.spaceSub}>Comprendre</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>À faire ce soir</Text>

      {/* Bandeau Premium (gating S10) */}
      <TouchableOpacity
        style={[styles.premiumBanner, isPremium && styles.premiumBannerOn]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Premium')}
      >
        <View style={styles.premiumCrown}>
          <MaterialCommunityIcons name="crown" size={18} color={colors.white} />
        </View>
        {isPremium ? (
          <>
            <Text style={styles.premiumText}>Premium actif — merci 🙌</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gold} />
          </>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumText}>Passez Premium</Text>
              <Text style={styles.premiumSub}>Insights avancés · méditations complètes</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gold} />
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.ghost} activeOpacity={0.8} onPress={() => navigation.navigate('Mental')}>
        <IconBadge icon="meditation" color={colors.purple} size={40} />
        <Text style={styles.ghostText}>Méditation · 10 min</Text>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.rewardsLink} activeOpacity={0.8} onPress={() => navigation.navigate('Recompenses')}>
        <IconBadge icon="trophy-outline" color={colors.gold} size={40} />
        <Text style={styles.rewardsText}>Mes récompenses</Text>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, paddingBottom: 40 },
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
    gap: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.lift(colors.purple),
  },
  ghostText: { ...typography.label, fontSize: 15, color: colors.ink, flex: 1 },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.ink,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.lift(colors.gold),
  },
  premiumBannerOn: { borderWidth: 1, borderColor: colors.gold },
  premiumCrown: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.sport,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow(colors.sport),
  },
  premiumText: { ...typography.label, fontSize: 15, color: colors.white, flex: 1 },
  premiumSub: { ...typography.body, fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  spacesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  spaceCard: {
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 6,
    ...shadows.card,
  },
  spaceTitle: { ...typography.label, fontSize: 14, color: colors.ink },
  spaceSub: { ...typography.caption, fontSize: 10, color: colors.muted },
  rewardsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#F0DFB8',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadows.lift(colors.gold),
  },
  rewardsText: { ...typography.label, fontSize: 15, color: colors.ink, flex: 1 },
});
