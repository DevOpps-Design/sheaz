/**
 * SHEAZ — Notifications — implémentation NATIVE (iOS/Android)
 * Utilisée automatiquement par Metro sur natif (fichier .native.ts).
 * Rappels locaux programmés (habitudes + rappel quotidien) + SecureStore pour l'état.
 */
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

const REMINDERS_KEY = 'sheaz.reminders.enabled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestPermission(): Promise<boolean> {
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
