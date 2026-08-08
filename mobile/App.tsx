/**
 * SHEAZ — App racine (S7)
 * Splash → session ? (onboarding fait ? Navigation : Onboarding) : Auth
 */
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';

import TriadeLoader from './src/components/TriadeLoader';
import { supabase } from './src/lib/supabase';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { colors, typography } from './src/theme';

export default function App() {
  const [booted, setBooted] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  const checkOnboarding = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('pillars_active, consent_health_at')
      .eq('id', userId)
      .single();
    // Onboardé si piliers choisis + consentement santé donné
    const done = !!data && (data.pillars_active ?? []).length > 0 && !!data.consent_health_at;
    setOnboarded(done);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (mounted) setBooted(true);
        return;
      }
      // Valide le token côté serveur ; si la session est morte (403/expirée),
      // on déconnecte proprement au lieu de laisser l'utilisateur bloqué.
      const { error } = await supabase.auth.getUser();
      if (mounted) {
        if (error) {
          await supabase.auth.signOut();
          setSession(null);
        } else {
          setSession(session);
          await checkOnboarding(session.user.id);
        }
        setBooted(true);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) await checkOnboarding(session.user.id);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkOnboarding]);

  if (!booted) {
    return (
      <View style={styles.splash}>
        <StatusBar style="light" />
        <Text style={styles.wordmark}>Sheaz</Text>
        <Text style={styles.tagline}>Le bien-être en mouvement</Text>
        <TriadeLoader size={132} style={styles.loader} />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (onboarded === false) {
    return (
      <OnboardingScreen
        onDone={() => {
          setOnboarded(true);
        }}
      />
    );
  }

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <RootNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.paper },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  wordmark: { ...typography.accent, fontSize: 44, color: colors.white, marginBottom: 6 },
  tagline: { ...typography.body, fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 36 },
  loader: { marginTop: 0 },
});
