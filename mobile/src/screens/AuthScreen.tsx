/**
 * SHEAZ — Authentification (email + mot de passe)
 * Inscription / connexion via Supabase Auth.
 * Design : palette SPORT sur fond encre — cohérent avec le splash.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import TriadeLoader from '../components/TriadeLoader';
import { supabase } from '../lib/supabase';
import { colors, radii, spacing, typography } from '../theme';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      setError('Email requis et mot de passe d’au moins 6 caractères.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <TriadeLoader size={96} />
        <Text style={styles.wordmark}>Sheaz</Text>
        <Text style={styles.tagline}>Le bien-être en mouvement</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>
          {mode === 'signin' ? 'Ravi de vous revoir' : 'Créez votre compte'}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'signin'
            ? 'Connectez-vous pour retrouver votre équilibre.'
            : 'Vos données restent privées et sécurisées (RGPD).'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={submit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.ctaText}>
              {mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          <Text style={styles.switch}>
            {mode === 'signin' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
            <Text style={styles.switchAccent}>
              {mode === 'signin' ? 'Inscrivez-vous' : 'Connectez-vous'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  hero: {
    flex: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
  },
  wordmark: {
    ...typography.accent,
    fontSize: 40,
    color: colors.white,
    marginTop: spacing.lg,
  },
  tagline: {
    ...typography.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },
  form: {
    flex: 1,
    backgroundColor: colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  title: {
    ...typography.display,
    fontSize: 22,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 12,
  },
  error: {
    ...typography.body,
    fontSize: 12,
    color: colors.sport,
    marginBottom: 10,
  },
  cta: {
    backgroundColor: colors.sport,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  ctaText: {
    ...typography.display,
    fontSize: 16,
    color: colors.white,
  },
  switch: {
    ...typography.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 18,
  },
  switchAccent: {
    ...typography.label,
    color: colors.blue,
  },
});
