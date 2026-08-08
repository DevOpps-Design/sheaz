/**
 * SHEAZ — icons helper
 * Mapping emoji → icônes MaterialCommunityIcons.
 * Permet d'afficher de vraies icônes même pour les données legacy
 * (habitudes seedées avec emojis avant le passage aux icônes).
 */
import type { IconName } from '../components/IconBadge';

/** Emoji → icône (fallback : icône neutre) */
const EMOJI_MAP: Record<string, IconName> = {
  '🏃': 'run',
  '💧': 'water',
  '🥗': 'food-apple',
  '🧘': 'meditation',
  '📝': 'clipboard-text-outline',
  '🌅': 'weather-sunset-up',
  '💪': 'arm-flex',
  '🌟': 'star',
  '🔥': 'fire',
  '🏆': 'trophy',
  '👑': 'crown',
  '🌙': 'weather-night',
  '📵': 'cellphone-off',
  '😣': 'emoticon-sad-outline',
  '😕': 'emoticon-neutral-outline',
  '😐': 'emoticon-neutral',
  '🙂': 'emoticon-happy-outline',
  '😌': 'emoticon-happy',
  '🤩': 'emoticon-excited',
  '🧠': 'brain',
  '🏋️': 'dumbbell',
};

/** Emoji → icône avec fallback */
export function emojiToIcon(emoji: string | null | undefined): IconName {
  if (!emoji) return 'star-outline';
  const key = emoji.replace(/\uFE0F/g, '').trim();
  return EMOJI_MAP[key] ?? 'star-outline';
}

/** Icône par nom d'habitude (fallback sur l'emoji si présent) */
export function habitIcon(name: string, emoji?: string | null): IconName {
  const normalized = name.toLowerCase();
  if (normalized.includes('bouger') || normalized.includes('sport') || normalized.includes('courir')) {
    return 'run';
  }
  if (normalized.includes('eau') || normalized.includes('boire')) {
    return 'water';
  }
  if (normalized.includes('manger') || normalized.includes('équilibr')) {
    return 'food-apple';
  }
  if (normalized.includes('médit') || normalized.includes('medit')) {
    return 'meditation';
  }
  if (normalized.includes('humeur') || normalized.includes('journal')) {
    return 'clipboard-text-outline';
  }
  if (normalized.includes('dormir') || normalized.includes('sommeil')) {
    return 'weather-night';
  }
  return emojiToIcon(emoji);
}
