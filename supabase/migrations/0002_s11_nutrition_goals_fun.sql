-- SHEAZ — S11 : Alimentation + Objectifs 2.0 + Fun/Gamification
-- ✅ APPLIQUÉE le 2026-08-09 via Management API (token renouvelé).
-- Les hooks client ont été basculés sur Supabase (useFood → food_logs,
-- useGamification → profiles.xp/level/streak + quiz_results + challenge_claims).
-- La couche locale AsyncStorage (lib/store.ts) reste pour données transitoires.

-- ═══════════════ 1. Alimentation (S11A) ═══════════════

-- Catalogue d'aliments statique (optionnel : embarqué côté client, mais
-- permet d'évoluer sans re-release de l'app)
create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,            -- fruit | legume | proteine | feculent | produit-laitier | boisson | sucrerie | gras | noix | cereale
  portion text not null,             -- ex: "1 banane (120 g)"
  kcal numeric not null,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  fiber_g numeric not null default 0,
  sugar_g numeric not null default 0,
  score integer not null default 2,  -- 0 (E) à 4 (A) — score santé Yuka-like
  created_at timestamptz not null default now()
);

-- Journal des repas
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  food_id uuid references public.foods (id) on delete set null,
  food_name text not null,           -- dénormalisé (nom au moment du log)
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  kcal numeric not null,
  protein_g numeric not null default 0,
  fiber_g numeric not null default 0,
  sugar_g numeric not null default 0,
  score integer not null default 2,
  logged_on date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.food_logs enable row level security;
create policy "food_logs owner all" on public.food_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ═══════════════ 2. Objectifs 2.0 (S11B) ═══════════════
-- La table `goals` existe déjà (S1) avec pillar/target/unit/period/ends_on.
-- Ajout : ordre d'affichage + archivage (sans supprimer l'historique).
alter table public.goals add column if not exists archived boolean not null default false;
alter table public.goals add column if not exists sort_order integer not null default 0;

-- ═══════════════ 3. Fun / Gamification (S11C) ═══════════════

-- XP / niveau / streak portés par le profil
alter table public.profiles add column if not exists xp integer not null default 0;
alter table public.profiles add column if not exists level integer not null default 1;
alter table public.profiles add column if not exists streak integer not null default 0;
alter table public.profiles add column if not exists last_active_day date;

-- Résultats de quiz (1 ligne par quiz complété / jour)
create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_key text not null,            -- nutrition | sommeil | stress | sport
  score integer not null,
  total integer not null,
  answered_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, quiz_key, answered_on)
);

alter table public.quiz_results enable row level security;
create policy "quiz_results owner all" on public.quiz_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Défis réclamés (anti double-réclamation quotidienne)
create table if not exists public.challenge_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  challenge_id text not null,
  claimed_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_id, claimed_on)
);

alter table public.challenge_claims enable row level security;
create policy "challenge_claims owner all" on public.challenge_claims
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ═══════════════ Index & helpers ═══════════════
create index if not exists food_logs_user_date_idx on public.food_logs (user_id, logged_on);
create index if not exists quiz_results_user_idx on public.quiz_results (user_id, answered_on);
create index if not exists challenge_claims_user_idx on public.challenge_claims (user_id, claimed_on);
