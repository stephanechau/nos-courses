-- Nos courses : schéma de la base Supabase.
-- À coller une seule fois dans Supabase > SQL Editor (ou `supabase db push`).

create extension if not exists pgcrypto;

-- Une famille = une liste partagée.
create table public.families (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique default encode(gen_random_bytes(6), 'hex'),
  created_by uuid,
  shopping_notified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Un membre = un compte (auth.users) dans une famille.
create table public.members (
  id uuid primary key references auth.users (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  color text not null default '#2F5FA8',
  prefs jsonb not null default '{"onAdd":true,"grouped":true,"quietNight":true,"onShopping":false}',
  -- jeton personnel utilisé par les raccourcis Siri / Android
  voice_token uuid not null unique default gen_random_uuid(),
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  rayon text not null default 'autre',
  qty text,
  note text,
  added_by uuid references public.members (id) on delete set null,
  voice boolean not null default false,
  done boolean not null default false,
  done_by uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now()
);
create index items_family_idx on public.items (family_id);

-- Abonnements aux notifications (un par téléphone).
create table public.push_subscriptions (
  endpoint text primary key,
  member_id uuid not null references public.members (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Famille de l'utilisateur connecté.
create or replace function public.my_family() returns uuid
language sql stable security definer set search_path = public as $$
  select family_id from public.members where id = auth.uid()
$$;

alter table public.families enable row level security;
alter table public.members enable row level security;
alter table public.items enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "voir sa famille" on public.families for select using (id = public.my_family());
create policy "voir les membres de sa famille" on public.members for select using (family_id = public.my_family());
create policy "modifier son profil" on public.members for update using (id = auth.uid()) with check (id = auth.uid() and family_id = public.my_family());
create policy "lire la liste" on public.items for select using (family_id = public.my_family());
create policy "ajouter à la liste" on public.items for insert with check (family_id = public.my_family() and added_by = auth.uid());
create policy "modifier la liste" on public.items for update using (family_id = public.my_family()) with check (family_id = public.my_family());
create policy "retirer de la liste" on public.items for delete using (family_id = public.my_family());
create policy "gérer ses abonnements" on public.push_subscriptions for all using (member_id = auth.uid()) with check (member_id = auth.uid());

-- Le jeton vocal ne doit être lisible que par son propriétaire.
revoke select on public.members from anon, authenticated;
grant select (id, family_id, name, color, prefs, last_notified_at, created_at) on public.members to authenticated;
revoke update on public.members from anon, authenticated;
grant update (name, color, prefs) on public.members to authenticated;
create or replace function public.my_voice_token() returns uuid
language sql stable security definer set search_path = public as $$
  select voice_token from public.members where id = auth.uid()
$$;

-- Rejoindre une famille avec un code d'invitation, ou en créer une.
create or replace function public.join_family(p_name text, p_color text, p_invite text default null)
returns public.members
language plpgsql security definer set search_path = public as $$
declare
  v_family uuid;
  v_member public.members;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  select * into v_member from public.members where id = auth.uid();
  if found then return v_member; end if;

  if p_invite is not null and p_invite <> '' then
    select id into v_family from public.families where invite_code = p_invite;
    if v_family is null then raise exception 'Lien d''invitation invalide'; end if;
  else
    insert into public.families (created_by) values (auth.uid()) returning id into v_family;
  end if;

  insert into public.members (id, family_id, name, color)
  values (auth.uid(), v_family, p_name, p_color)
  returning * into v_member;
  return v_member;
end $$;

-- Nom de la personne qui invite (affiché avant connexion).
create or replace function public.invite_info(p_invite text) returns text
language sql stable security definer set search_path = public as $$
  select m.name from public.families f join public.members m on m.id = f.created_by where f.invite_code = p_invite
$$;
grant execute on function public.invite_info(text) to anon, authenticated;

-- Code d'invitation de sa famille.
create or replace function public.my_invite_code() returns text
language sql stable security definer set search_path = public as $$
  select invite_code from public.families where id = public.my_family()
$$;

-- Petite table pour la requête anti-veille (voir .github/workflows/keepalive.yml).
create table public.keepalive (id int primary key, pinged_at timestamptz not null default now());
insert into public.keepalive (id) values (1);
alter table public.keepalive enable row level security;
create policy "ping public" on public.keepalive for select using (true);

-- Temps réel sur la liste.
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.members;
