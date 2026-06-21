create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cloud_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_type text not null default 'manual-sync',
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.refresh_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'triggered', 'error')),
  reason text,
  github_run_url text,
  workflow_file text,
  response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists cloud_settings_user_id_idx on public.cloud_settings (user_id);
create index if not exists lab_snapshots_user_created_idx on public.lab_snapshots (user_id, created_at desc);
create index if not exists refresh_jobs_user_created_idx on public.refresh_jobs (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.cloud_settings enable row level security;
alter table public.lab_snapshots enable row level security;
alter table public.refresh_jobs enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "cloud_settings_all_own" on public.cloud_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "lab_snapshots_all_own" on public.lab_snapshots
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "refresh_jobs_select_own" on public.refresh_jobs
  for select to authenticated
  using ((select auth.uid()) = user_id);
