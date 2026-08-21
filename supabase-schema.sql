-- Shadowdark Manager — Etap 1B
-- Uruchom CAŁY skrypt w Supabase SQL Editor w nowym projekcie.
-- Jeśli uruchamiasz go po wersji Etap 1, polecenia są napisane tak,
-- aby możliwie bezpiecznie zaktualizować istniejący schemat.

create extension if not exists pgcrypto;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  description text,
  created_by uuid not null references auth.users(id) on delete cascade,
  invite_code text,
  created_at timestamptz not null default now()
);

alter table public.campaigns add column if not exists invite_code text;
update public.campaigns
set invite_code = upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10))
where invite_code is null;
alter table public.campaigns alter column invite_code set not null;
create unique index if not exists campaigns_invite_code_key on public.campaigns(invite_code);

create or replace function public.make_campaign_invite_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.invite_code is null then
    loop
      new.invite_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10));
      exit when not exists (select 1 from public.campaigns where invite_code = new.invite_code);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_campaign_invite_code on public.campaigns;
create trigger trg_campaign_invite_code
before insert on public.campaigns
for each row execute function public.make_campaign_invite_code();

create table if not exists public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'player' check (role in ('owner','gm','player')),
  created_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

-- SECURITY DEFINER helpers zapobiegają rekurencji polityk RLS.
create or replace function public.is_campaign_member(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.campaign_members
    where campaign_id = p_campaign_id and user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_campaign(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.campaigns c
    where c.id = p_campaign_id and c.created_by = auth.uid()
  ) or exists (
    select 1 from public.campaign_members cm
    where cm.campaign_id = p_campaign_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','gm')
  );
$$;

create or replace function public.join_campaign_by_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select id into v_campaign_id
  from public.campaigns
  where invite_code = upper(trim(p_invite_code));

  if v_campaign_id is null then
    return null;
  end if;

  insert into public.campaign_members(campaign_id, user_id, role)
  values(v_campaign_id, auth.uid(), 'player')
  on conflict (campaign_id, user_id) do nothing;

  return v_campaign_id;
end;
$$;

revoke all on function public.join_campaign_by_code(text) from public;
revoke all on function public.is_campaign_member(uuid) from public;
revoke all on function public.can_manage_campaign(uuid) from public;
grant execute on function public.join_campaign_by_code(text) to authenticated;
grant execute on function public.is_campaign_member(uuid) to authenticated;
grant execute on function public.can_manage_campaign(uuid) to authenticated;

alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;

grant select, insert, update, delete on public.campaigns to authenticated;
grant select, insert, update, delete on public.campaign_members to authenticated;

-- Usuń polityki z Etapu 1, jeśli istnieją.
drop policy if exists "members can read campaigns" on public.campaigns;
drop policy if exists "users can create campaigns" on public.campaigns;
drop policy if exists "owners can update campaigns" on public.campaigns;
drop policy if exists "owners can delete campaigns" on public.campaigns;
drop policy if exists "members can read membership" on public.campaign_members;
drop policy if exists "campaign creator can add membership" on public.campaign_members;

drop policy if exists "campaign select" on public.campaigns;
drop policy if exists "campaign insert" on public.campaigns;
drop policy if exists "campaign update" on public.campaigns;
drop policy if exists "campaign delete" on public.campaigns;
drop policy if exists "membership select" on public.campaign_members;
drop policy if exists "membership insert" on public.campaign_members;
drop policy if exists "membership update" on public.campaign_members;
drop policy if exists "membership delete" on public.campaign_members;

create policy "campaign select" on public.campaigns
for select to authenticated
using (created_by = (select auth.uid()) or public.is_campaign_member(id));

create policy "campaign insert" on public.campaigns
for insert to authenticated
with check (created_by = (select auth.uid()));

create policy "campaign update" on public.campaigns
for update to authenticated
using (public.can_manage_campaign(id))
with check (public.can_manage_campaign(id));

create policy "campaign delete" on public.campaigns
for delete to authenticated
using (created_by = (select auth.uid()));

create policy "membership select" on public.campaign_members
for select to authenticated
using (user_id = (select auth.uid()) or public.is_campaign_member(campaign_id));

create policy "membership insert" on public.campaign_members
for insert to authenticated
with check (
  user_id = (select auth.uid()) and (
    public.can_manage_campaign(campaign_id)
    or exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.created_by = (select auth.uid())
    )
  )
);

create policy "membership update" on public.campaign_members
for update to authenticated
using (public.can_manage_campaign(campaign_id))
with check (public.can_manage_campaign(campaign_id));

create policy "membership delete" on public.campaign_members
for delete to authenticated
using (user_id = (select auth.uid()) or public.can_manage_campaign(campaign_id));

-- Włącz tabelę członkostwa i kampanii dla Postgres Changes.
-- Blok ignoruje błąd, jeżeli tabela jest już w publikacji.
do $$
begin
  begin
    alter publication supabase_realtime add table public.campaigns;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.campaign_members;
  exception when duplicate_object then null;
  end;
end $$;
