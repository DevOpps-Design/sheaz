/**
 * SHEAZ — Seed des données par défaut (première connexion)
 * Crée des objectifs + habitudes par défaut adaptés aux piliers choisis.
 */
import { supabase } from './supabase';

export interface OnboardingChoice {
  pillars: number[]; // 1 sport · 2 corps · 3 mental
  consentHealth: boolean;
  consentAnalytics: boolean;
  dailyTime: string; // HH:MM
}

/** Applique le profil + crée les données par défaut */
export async function seedDefaults(choice: OnboardingChoice) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non connecté');

  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      pillars_active: choice.pillars,
      consent_health_at: choice.consentHealth ? new Date().toISOString() : null,
      consent_analytics_at: choice.consentAnalytics ? new Date().toISOString() : null,
      daily_notification_time: choice.dailyTime,
      age_confirmed: true,
    });
  if (profileErr) throw profileErr;

  // Objectifs par défaut par pilier actif
  const goals: { user_id: string; pillar: number; title: string; target: number; unit: string; period: string }[] = [];
  if (choice.pillars.includes(1)) {
    goals.push({ user_id: user.id, pillar: 1, title: 'Séances de sport', target: 3, unit: 'séances', period: 'week' });
  }
  if (choice.pillars.includes(2)) {
    goals.push({ user_id: user.id, pillar: 2, title: 'Verres d’eau', target: 8, unit: 'verres', period: 'day' });
    goals.push({ user_id: user.id, pillar: 2, title: 'Sommeil', target: 8, unit: 'heures', period: 'day' });
  }
  if (choice.pillars.includes(3)) {
    goals.push({ user_id: user.id, pillar: 3, title: 'Méditations', target: 7, unit: 'séances', period: 'week' });
  }

  const { error: goalsErr } = await supabase.from('goals').insert(goals);
  if (goalsErr) throw goalsErr;

  // Habitudes par défaut
  const habits: { user_id: string; name: string; emoji: string; pillar: number; reminder_time: string }[] = [];
  if (choice.pillars.includes(1)) {
    habits.push({ user_id: user.id, name: 'Bouger 30 min', emoji: '🏃', pillar: 1, reminder_time: '18:00' });
  }
  if (choice.pillars.includes(2)) {
    habits.push({ user_id: user.id, name: 'Boire un verre d’eau', emoji: '💧', pillar: 2, reminder_time: '09:00' });
    habits.push({ user_id: user.id, name: 'Manger équilibré', emoji: '🥗', pillar: 2, reminder_time: '12:30' });
  }
  if (choice.pillars.includes(3)) {
    habits.push({ user_id: user.id, name: 'Méditer 5 min', emoji: '🧘', pillar: 3, reminder_time: '20:00' });
    habits.push({ user_id: user.id, name: 'Journal d’humeur', emoji: '📝', pillar: 3, reminder_time: '21:30' });
  }

  const { error: habitsErr } = await supabase.from('habits').insert(habits);
  if (habitsErr) throw habitsErr;

  return true;
}
