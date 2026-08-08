-- ============================================================
-- SHEAZ — Migration initiale (S5)
-- Schéma PostgreSQL + Row Level Security (RLS)
-- Base : Supabase (région UE). Chaque table est scopée au user.
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- users (hérité de auth.users) + consentements RGPD horodatés
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  pillars_active integer[] default '{1,2,3}',        -- sport / corps / mental
  daily_notification_time time default '20:00',
  max_push_per_day int default 3,
  age_confirmed boolean default false,               -- refus < 16 ans
  consent_health_at timestamptz,                     -- consentement données santé
  consent_analytics_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Objectifs
-- ------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pillar int not null check (pillar between 1 and 3),
  title text not null,
  target numeric,
  unit text,                                          -- kg / séances / min / %
  period text default 'week',                        -- day / week / month
  starts_on date default current_date,
  ends_on date,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Habitudes + logs
-- ------------------------------------------------------------
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text,
  pillar int not null check (pillar between 1 and 3),
  reminder_time time,
  created_at timestamptz default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  done_on date not null default current_date,
  done_at timestamptz default now(),
  unique (habit_id, done_on)
);

-- ------------------------------------------------------------
-- Sport : plans / séances / historique
-- ------------------------------------------------------------
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,                            -- force / cardio / mobilite
  duration_min int,
  exercises jsonb default '[]',
  scheduled_on date,
  created_at timestamptz default now()
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references public.workouts(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_sec int,
  calories int
);

-- ------------------------------------------------------------
-- Mental : humeur + méditations
-- ------------------------------------------------------------
create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood int not null check (mood between 1 and 6),    -- 😣 → 🤩
  note text,
  tags text[] default '{}',
  logged_at timestamptz default now()
);

create table if not exists public.meditation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  duration_sec int not null,
  completed_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Corps : poids / mensurations / sommeil / hydratation
-- ------------------------------------------------------------
create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_type text not null,                         -- weight / bmi / waist
  value numeric not null,
  unit text not null,
  measured_on date default current_date,
  created_at timestamptz default now()
);

create table if not exists public.sleep_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sleep_date date not null default current_date,
  duration_min int,
  quality int check (quality between 1 and 5),
  source text default 'manual',                      -- manual / healthkit / healthconnect
  unique (user_id, sleep_date)
);

create table if not exists public.hydration_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  glasses int not null default 0,
  unique (user_id, entry_date)
);

-- ------------------------------------------------------------
-- Freemium : abonnements (entitlements server-side)
-- ------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free', 'monthly', 'yearly')),
  source text not null,                              -- appstore / playstore
  store_product_id text,
  status text not null default 'active',             -- active / expired / cancelled / grace
  current_period_end timestamptz,
  auto_renew boolean default true,
  updated_at timestamptz default now(),
  unique (user_id, source)
);

-- ------------------------------------------------------------
-- Push tokens
-- ------------------------------------------------------------
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,                            -- ios / android
  token text not null unique,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY — chaque user ne voit que ses données
-- ============================================================
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.mood_entries enable row level security;
alter table public.meditation_sessions enable row level security;
alter table public.body_metrics enable row level security;
alter table public.sleep_entries enable row level security;
alter table public.hydration_entries enable row level security;
alter table public.subscriptions enable row level security;
alter table public.push_tokens enable row level security;

-- Helper : le user authentifié est le propriétaire
create or replace function public.current_user_id()
returns uuid language sql stable as $$
  select auth.uid();
$$;

-- Policies génériques (sauf profiles : insert via trigger signup)
do $$
declare
  t text;
begin
  foreach t in array array[
    'goals', 'habits', 'habit_logs', 'workouts', 'workout_sessions',
    'mood_entries', 'meditation_sessions', 'body_metrics', 'sleep_entries',
    'hydration_entries', 'subscriptions', 'push_tokens'
  ] loop
    execute format('create policy "own_select_%s" on public.%I for select using (user_id = auth.uid())', t, t);
    execute format('create policy "own_insert_%s" on public.%I for insert with check (user_id = auth.uid())', t, t);
    execute format('create policy "own_update_%s" on public.%I for update using (user_id = auth.uid())', t, t);
    execute format('create policy "own_delete_%s" on public.%I for delete using (user_id = auth.uid())', t, t);
  end loop;
end $$;

-- profiles : select/update par le propriétaire, insert au signup
create policy "profile_select" on public.profiles for select using (id = auth.uid());
create policy "profile_insert" on public.profiles for insert with check (id = auth.uid());
create policy "profile_update" on public.profiles for update using (id = auth.uid());

-- Trigger : profil créé automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, age_confirmed)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), true)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Index de performance
-- ============================================================
create index if not exists idx_goals_user on public.goals(user_id);
create index if not exists idx_habit_logs_habit on public.habit_logs(habit_id, done_on desc);
create index if not exists idx_mood_user_date on public.mood_entries(user_id, logged_at desc);
create index if not exists idx_metrics_user_date on public.body_metrics(user_id, measured_on desc);
create index if not exists idx_sleep_user_date on public.sleep_entries(user_id, sleep_date desc);
