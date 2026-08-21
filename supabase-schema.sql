-- Shadowdark Manager — Etap 1
-- Uruchom w Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  description text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'player' check (role in ('owner','gm','player')),
  created_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;

grant select, insert, update, delete on public.campaigns to authenticated;
grant select, insert, update, delete on public.campaign_members to authenticated;

create policy "members can read campaigns" on public.campaigns
for select to authenticated
using (
  created_by = auth.uid() or exists (
    select 1 from public.campaign_members cm
    where cm.campaign_id = campaigns.id and cm.user_id = auth.uid()
  )
);

create policy "users can create campaigns" on public.campaigns
for insert to authenticated
with check (created_by = auth.uid());

create policy "owners can update campaigns" on public.campaigns
for update to authenticated
using (
  created_by = auth.uid() or exists (
    select 1 from public.campaign_members cm
    where cm.campaign_id = campaigns.id and cm.user_id = auth.uid() and cm.role in ('owner','gm')
  )
);

create policy "owners can delete campaigns" on public.campaigns
for delete to authenticated
using (created_by = auth.uid());

create policy "members can read membership" on public.campaign_members
for select to authenticated
using (
  user_id = auth.uid() or exists (
    select 1 from public.campaign_members mine
    where mine.campaign_id = campaign_members.campaign_id
      and mine.user_id = auth.uid()
  )
);

create policy "campaign creator can add membership" on public.campaign_members
for insert to authenticated
with check (
  user_id = auth.uid() or exists (
    select 1 from public.campaigns c
    where c.id = campaign_id and c.created_by = auth.uid()
  )
);

-- Realtime będzie włączany dla kolejnych tabel podczas implementacji synchronizacji.
