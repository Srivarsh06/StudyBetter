-- Study Efficiency Tracker – Supabase schema
-- Run in Supabase SQL Editor or via migrations.

-- Enable UUID extension if not already
create extension if not exists "uuid-ossp";

-- Users (synced from Supabase Auth; optional denormalized for extension sync)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

-- Sessions from the Chrome extension
create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  total_time int not null default 0,
  effective_time int not null default 0,
  focus_score float not null default 0,
  burnout_score float not null default 0,
  subject_label text,
  created_at timestamptz default now()
);

create index if not exists idx_sessions_user_id on public.sessions(user_id);
create index if not exists idx_sessions_start_time on public.sessions(start_time);

-- Tab logs per session
create table if not exists public.tab_logs (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  domain text not null,
  category text not null,
  time_spent int not null default 0,
  is_important boolean not null default false,
  timestamp timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists idx_tab_logs_session_id on public.tab_logs(session_id);

-- Grades (manual or future integration)
create table if not exists public.grades (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  subject text not null,
  score float not null,
  date_recorded timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists idx_grades_user_id on public.grades(user_id);

-- Sync auth.users to public.users on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: allow authenticated users to read/write their own data
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.tab_logs enable row level security;
alter table public.grades enable row level security;

-- Users: user can read/update own row
create policy "Users select own" on public.users for select using (auth.uid() = id);
create policy "Users insert own" on public.users for insert with check (auth.uid() = id);
create policy "Users update own" on public.users for update using (auth.uid() = id);

-- Sessions: user can CRUD own sessions (or sessions with their user_id)
create policy "Sessions select own" on public.sessions for select using (auth.uid() = user_id or user_id is null);
create policy "Sessions insert own" on public.sessions for insert with check (auth.uid() = user_id or user_id is null);
create policy "Sessions update own" on public.sessions for update using (auth.uid() = user_id);
create policy "Sessions delete own" on public.sessions for delete using (auth.uid() = user_id);

-- Tab logs: via session ownership
create policy "Tab_logs select via session" on public.tab_logs for select using (
  exists (select 1 from public.sessions s where s.id = tab_logs.session_id and (s.user_id = auth.uid() or s.user_id is null))
);
create policy "Tab_logs insert via session" on public.tab_logs for insert with check (
  exists (select 1 from public.sessions s where s.id = tab_logs.session_id and (s.user_id = auth.uid() or s.user_id is null))
);

-- Grades: user can CRUD own
create policy "Grades select own" on public.grades for select using (auth.uid() = user_id);
create policy "Grades insert own" on public.grades for insert with check (auth.uid() = user_id);
create policy "Grades update own" on public.grades for update using (auth.uid() = user_id);
create policy "Grades delete own" on public.grades for delete using (auth.uid() = user_id);

-- Service role can insert sessions/tab_logs for extension (API uses service key or anon with user_id from extension)
-- If extension sends user_id from Supabase auth, we need to allow insert when JWT has that user.
-- For anonymous sync (extension not logged in), we can allow insert with user_id null.
create policy "Sessions insert anon null user" on public.sessions for insert with check (user_id is null);
