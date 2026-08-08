/**
 * SHEAZ — App racine
 * Splash avec loader Triade animé → navigation principale.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import TriadeLoader from './src/components/TriadeLoader';
import RootNavigator from './src/navigation/RootNavigator';
import { colors, typography } from './src/theme';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Durée du splash calée sur l'animation Triade (~1,6 s)
    const id = setTimeout(() => setReady(true), 1600);
    return () => clearTimeout(id);
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <StatusBar style="light" />
        <Text style={styles.wordmark}>Sheaz</Text>
        <Text style={styles.tagline}>Le bien-être en mouvement</Text>
        <TriadeLoader size={132} style={styles.loader} />
      </View>
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
