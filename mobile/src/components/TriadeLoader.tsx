/**
 * SHEAZ — TriadeLoader
 * Logo Triade animé : les 3 pétales (sport · corps · mental) apparaissent
 * en séquence (bounce), puis le symbole « respire » (pulsation douce).
 * Remplace l'animation de chargement (décision Le Credo 2026-08-08).
 *
 * Le motif Triade est conçu pour être réutilisé : splash, pull-to-refresh,
 * chargements d'écran. Animé via Animated API (zéro config) — évolution
 * possible vers Reanimated 3 pour des animations 60fps plus complexes.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { colors } from '../theme';

const PETAL_PATH =
  'M0 -140 C 78 -140 98 -52 0 0 C -98 -52 -78 -140 0 -140 Z';

const PETAL_COLORS = [colors.sport, colors.blue, colors.purple];

interface TriadeLoaderProps {
  size?: number;
  style?: ViewStyle;
  /** Lance la boucle « respiration » après l'apparition (défaut: true) */
  breathe?: boolean;
  /** Durée de l'apparition séquentielle en ms (défaut: 1300) */
  introMs?: number;
}

export default function TriadeLoader({
  size = 132,
  style,
  breathe = true,
  introMs = 1300,
}: TriadeLoaderProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Apparition séquentielle des 3 pétales + centre
    Animated.timing(progress, {
      toValue: 1,
      duration: introMs,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    }).start();

    // 2. Pulsation « respiration » infinie
    if (breathe) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnim, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      // Démarre après l'intro
      const id = setTimeout(() => loop.start(), introMs + 150);
      return () => {
        clearTimeout(id);
        loop.stop();
      };
    }
    return undefined;
  }, [breathe, breatheAnim, introMs, progress]);

  // Interpolation par pétale : échelle + opacité en cascade
  const petalScale = (index: number) =>
    progress.interpolate({
      inputRange: [0, (index + 1) / 4, (index + 2) / 4, 1],
      outputRange: [0, 1.18, 0.94, 1],
      extrapolate: 'clamp',
    });
  const petalOpacity = (index: number) =>
    progress.interpolate({
      inputRange: [0, (index + 0.5) / 4, (index + 1) / 4],
      outputRange: [0, 0, 1],
      extrapolate: 'clamp',
    });
  const coreScale = progress.interpolate({
    inputRange: [0, 0.82, 1],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const breatheScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: breathe ? [{ scale: breatheScale }] : undefined,
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 512 512">
          <G transform="translate(256 256)">
            {PETAL_COLORS.map((color, index) => (
              <AnimatedG
                key={color}
                rotation={index * 120}
                scale={petalScale(index)}
                opacity={petalOpacity(index)}
              >
                <Path d={PETAL_PATH} fill={color} />
              </AnimatedG>
            ))}
            <AnimatedG rotation={0} scale={coreScale}>
              <Circle cx={0} cy={0} r={17} fill={colors.ink} />
            </AnimatedG>
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Groupe SVG animé (rotation + échelle + opacité) */
function AnimatedG({
  rotation,
  scale,
  opacity,
  children,
}: {
  rotation: number;
  scale: Animated.AnimatedInterpolation<number>;
  opacity?: Animated.AnimatedInterpolation<number>;
  children: React.ReactNode;
}) {
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        transform: [{ rotate: `${rotation}deg` }, { scale }],
        opacity: opacity ?? 1,
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 512 512">
        <G transform="translate(256 256)">{children}</G>
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
