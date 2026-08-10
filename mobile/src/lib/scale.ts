/**
 * SHEAZ — Scaling responsif (petits écrans)
 * 390 = largeur de référence (iPhone 14). Tout écran plus étroit
 * voit ses tailles réduites proportionnellement (min 0.75).
 */
import { Dimensions } from 'react-native';

export const SCREEN_W = Dimensions.get('window').width;
export const SCREEN_H = Dimensions.get('window').height;

/** Écran étroit (ex: Nokia bas de gamme, 320-360 px) */
export const isSmallScreen = SCREEN_W < 380;

/** Facteur global de scaling (jamais > 1) */
export const K = Math.min(1, Math.max(0.75, SCREEN_W / 390));

/** Scale une taille (px) selon la largeur d'écran */
export const s = (n: number): number => Math.round(n * K);
