/**
 * Test du seed Sheaz (S7) — même logique que mobile/src/lib/seed.ts
 * Utilise la session réelle d'un compte test via password grant.
 */
const { createClient } = require('../mobile/node_modules/@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const URL = 'https://bhnvnqscblqfhqrejurp.supabase.co';
// Clé anon lue depuis mobile/.env (jamais hardcodée dans le repo)
const env = fs.readFileSync(path.join(__dirname, '..', 'mobile', '.env'), 'utf8');
const ANON = env.match(/SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
if (!ANON) throw new Error('Clé anon introuvable dans mobile/.env');

async function main() {
  const sb = createClient(URL, ANON);
  const { data, error } = await sb.auth.signInWithPassword({
    email: 'test3@sheaz.app',
    password: 'Test1234!',
  });
  if (error) throw error;
  const uid = data.user.id;
  console.log('✅ session OK:', data.user.email, '|', uid.slice(0, 8));

  // 1. Profil
  const { error: pe } = await sb.from('profiles').upsert({
    id: uid, pillars_active: [1, 2, 3],
    consent_health_at: new Date().toISOString(),
    consent_analytics_at: new Date().toISOString(),
    daily_notification_time: '20:00', age_confirmed: true,
  });
  console.log('profil:', pe ? '❌ ' + pe.message : '✅');

  // 2. Objectifs (avec user_id — le fix S7)
  const goals = [
    { user_id: uid, pillar: 1, title: 'Séances de sport', target: 3, unit: 'séances', period: 'week' },
    { user_id: uid, pillar: 2, title: 'Verres d’eau', target: 8, unit: 'verres', period: 'day' },
    { user_id: uid, pillar: 2, title: 'Sommeil', target: 8, unit: 'heures', period: 'day' },
    { user_id: uid, pillar: 3, title: 'Méditations', target: 7, unit: 'séances', period: 'week' },
  ];
  const { error: ge } = await sb.from('goals').insert(goals);
  console.log('goals:', ge ? '❌ ' + ge.message : '✅ 4 objectifs');

  // 3. Habitudes (avec user_id)
  const habits = [
    { user_id: uid, name: 'Bouger 30 min', emoji: '🏃', pillar: 1, reminder_time: '18:00' },
    { user_id: uid, name: 'Boire un verre d’eau', emoji: '💧', pillar: 2, reminder_time: '09:00' },
    { user_id: uid, name: 'Manger équilibré', emoji: '🥗', pillar: 2, reminder_time: '12:30' },
    { user_id: uid, name: 'Méditer 5 min', emoji: '🧘', pillar: 3, reminder_time: '20:00' },
    { user_id: uid, name: 'Journal d’humeur', emoji: '📝', pillar: 3, reminder_time: '21:30' },
  ];
  const { error: he } = await sb.from('habits').insert(habits);
  console.log('habits:', he ? '❌ ' + he.message : '✅ 5 habitudes');

  // 4. Lecture retour (RLS : ne doit voir QUE ses données)
  const { data: g, error: g2 } = await sb.from('goals').select('id,pillar,title').eq('user_id', uid);
  const { data: h, error: h2 } = await sb.from('habits').select('id,name').eq('user_id', uid);
  console.log('lecture goals:', g2 ? '❌' : `✅ ${g.length}`, '| habits:', h2 ? '❌' : `✅ ${h.length}`);
}

main().catch((e) => {
  console.error('ÉCHEC:', e.message);
  process.exit(1);
});
