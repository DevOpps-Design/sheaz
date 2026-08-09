/**
 * SHEAZ — Notifications — implémentation NATIVE (iOS/Android)
 * Utilisée automatiquement par Metro sur natif (fichier .native.ts).
 * Rappels locaux programmés (habitudes + rappel quotidien) + SecureStore pour l'état.
 *
 * ⚠️ Expo Go (SDK 53+) : expo-notifications THROW au chargement sur Android
 * (les push distantes ont été retirées d'Expo Go — voir warnOfExpoGoPushUsage).
 * Le module s'auto-enregistre au `require()` (DevicePushTokenAutoRegistration.fx),
 * donc on ne le charge JAMAIS dans Expo Go : toutes les fonctions passent en no-op.
 * Les notifications locales fonctionneront sur les builds natifs (dev build EAS, stores).
 */
import { isRunningInExpoGo } from 'expo';
import * as SecureStore from 'expo-secure-store';
import type * as NotificationsNS from 'expo-notifications';

const REMINDERS_KEY = 'sheaz.reminders.enabled';
const RUNNING_IN_EXPO_GO = isRunningInExpoGo();

type NotificationsModule = typeof NotificationsNS;

let notifCache: NotificationsModule | null = null;
let handlerRegistered = false;

/**
 * Charge expo-notifications UNIQUEMENT hors Expo Go.
 * Dans Expo Go, le require() déclenche un crash (push retirées) → null.
 */
function getNotifications(): NotificationsModule | null {
  if (RUNNING_IN_EXPO_GO) return null;
  if (notifCache) return notifCache;
  try {
    // Require dynamique : le side-effect d'auto-enregistrement push ne s'exécute
    // que si le module est réellement chargé (jamais dans Expo Go).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-notifications') as NotificationsModule & {
      default?: NotificationsModule;
    };
    notifCache = mod.default ?? mod;
    if (notifCache && typeof notifCache.setNotificationHandler === 'function' && !handlerRegistered) {
      handlerRegistered = true;
      notifCache.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    }
  } catch {
    notifCache = null; // module indisponible → mode dégradé silencieux
  }
  return notifCache;
}

export async function requestPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === 'granted';
  } catch {
    return false;
  }
}

export function isWebNotificationSupported(): boolean {
  return false;
}

/** Notif immédiate (test) */
export async function sendTestNotification(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  const ok = await requestPermission();
  if (!ok) return false;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Sheaz', body: 'Vos rappels de bien-être sont activés !' },
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}

/** Programme les rappels locaux récurrents (natif uniquement) */
export async function scheduleReminders(options: {
  dailyTime?: string | null;
  habitTimes?: (string | null)[];
}): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const daily = options.dailyTime ?? '20:00';
    const [h, m] = daily.split(':').map(Number);
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Sheaz', body: 'C’est l’heure de votre routine de bien-être 🧘' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m },
      });
    }

    for (const t of options.habitTimes ?? []) {
      if (!t) continue;
      const [hh, mm] = t.split(':').map(Number);
      if (Number.isNaN(hh) || Number.isNaN(mm)) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Rappel d’habitude', body: 'Un petit pas pour votre équilibre 💪' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: hh, minute: mm },
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function cancelReminders(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // silencieux
  }
}

/* ------------------------- État persisté (SecureStore) ------------------------- */

export async function isRemindersEnabled(): Promise<boolean> {
  try {
    const v = await SecureStore.getItemAsync(REMINDERS_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function setRemindersEnabled(on: boolean): Promise<void> {
  try {
    if (on) await SecureStore.setItemAsync(REMINDERS_KEY, '1');
    else await SecureStore.deleteItemAsync(REMINDERS_KEY);
  } catch {
    // silencieux
  }
}
