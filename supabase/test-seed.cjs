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
  const email = process.argv[2] || 'test3@sheaz.app';
  const password = process.argv[3] || 'Test1234!';
  const sb = createClient(URL, ANON);
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
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

  // Nettoyage avant re-seed (le script est réutilisable sur le même compte)
  await sb.from('goals').delete().eq('user_id', uid);
  await sb.from('habits').delete().eq('user_id', uid);
  await sb.from('sleep_entries').delete().eq('user_id', uid);
  await sb.from('hydration_entries').delete().eq('user_id', uid);
  await sb.from('body_metrics').delete().eq('user_id', uid);

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

  // 5. S8 — Corps : sommeil, hydratation, poids (inserts + lectures RLS)
  const today = new Date().toISOString().slice(0, 10);
  const { error: se } = await sb.from('sleep_entries').upsert(
    { user_id: uid, sleep_date: today, duration_min: 450, quality: 4 },
    { onConflict: 'user_id,sleep_date' },
  );
  const { error: we } = await sb.from('hydration_entries').upsert(
    { user_id: uid, entry_date: today, glasses: 5 },
    { onConflict: 'user_id,entry_date' },
  );
  const { error: me } = await sb.from('body_metrics').insert({
    user_id: uid, metric_type: 'weight', value: 72.5, unit: 'kg', measured_on: today,
  });
  console.log('S8 corps — sommeil:', se ? '❌ ' + se.message : '✅ 7h30 · qualité 4');
  console.log('S8 corps — hydratation:', we ? '❌ ' + we.message : '✅ 5 verres');
  console.log('S8 corps — poids:', me ? '❌ ' + me.message : '✅ 72,5 kg');

  const { data: sleep, error: se2 } = await sb.from('sleep_entries').select('duration_min,quality').eq('user_id', uid);
  const { data: hydra, error: we2 } = await sb.from('hydration_entries').select('glasses').eq('user_id', uid);
  const { data: weights, error: me2 } = await sb.from('body_metrics').select('value,unit').eq('user_id', uid);
  console.log(
    'lecture S8 — sommeil:', se2 ? '❌' : `✅ ${sleep.length}`,
    '| hydratation:', we2 ? '❌' : `✅ ${hydra.length}`,
    '| poids:', me2 ? '❌' : `✅ ${weights.length}`,
  );
}

main().catch((e) => {
  console.error('ÉCHEC:', e.message);
  process.exit(1);
});
