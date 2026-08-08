/**
 * SHEAZ — App racine
 * Splash (loader Triade) → session ? Navigation : Auth.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';

import TriadeLoader from './src/components/TriadeLoader';
import { supabase } from './src/lib/supabase';
import AuthScreen from './src/screens/AuthScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { colors, typography } from './src/theme';

export default function App() {
  const [booted, setBooted] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Session restaurée depuis le stockage local
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setBooted(true);
    });

    // Réagit aux changements d'auth (connexion, déconnexion, refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Splash pendant le boot + durée de l'animation Triade
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

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <RootNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  wordmark: {
    ...typography.accent,
    fontSize: 44,
    color: colors.white,
    marginBottom: 6,
  },
  tagline: {
    ...typography.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 36,
  },
  loader: {
    marginTop: 0,
  },
});
