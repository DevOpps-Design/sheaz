/**
 * SHEAZ — Notifications — implémentation WEB (navigateur)
 * Utilisée automatiquement par Metro sur web (fichier .web.ts).
 * API Notification standard du navigateur (rappel de test immédiat) + localStorage.
 * Le scheduling local nécessite un Service Worker — hors périmètre MVP web (natif gère).
 */

const REMINDERS_KEY = 'sheaz.reminders.enabled';

export async function requestPermission(): Promise<boolean> {
  try {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    if ('requestPermission' in Notification) {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
    return false;
  } catch {
    return false;
  }
}

export function isWebNotificationSupported(): boolean {
  return typeof Notification !== 'undefined';
}

/** Notif immédiate (test) — web */
export async function sendTestNotification(): Promise<boolean> {
  const ok = await requestPermission();
  if (!ok) return false;
  try {
    if (Notification.permission === 'granted') {
      new Notification('Sheaz 🧘', { body: 'Vos rappels de bien-être sont activés !' });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Scheduling local : non supporté sans Service Worker — no-op sur web */
export async function scheduleReminders(_options: {
  dailyTime?: string | null;
  habitTimes?: (string | null)[];
}): Promise<boolean> {
  return true;
}

export async function cancelReminders(): Promise<void> {
  // rien à annuler côté web
}

/* ------------------------- État persisté (localStorage) ------------------------- */

export async function isRemindersEnabled(): Promise<boolean> {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(REMINDERS_KEY) === '1' : false;
  } catch {
    return false;
  }
}

export async function setRemindersEnabled(on: boolean): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      if (on) localStorage.setItem(REMINDERS_KEY, '1');
      else localStorage.removeItem(REMINDERS_KEY);
    }
  } catch {
    // silencieux
  }
}
