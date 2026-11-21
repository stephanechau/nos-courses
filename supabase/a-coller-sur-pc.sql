-- Nos courses : tout ce qu'il reste à coller dans Supabase > SQL Editor (nouvel onglet +, coller, Run).
-- On peut le lancer plusieurs fois sans risque.

-- 1. Tout membre peut retirer un autre membre

create or replace function public.remove_member(p_member uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_family() is null then
    raise exception 'Vous ne faites partie d''aucune famille';
  end if;
  if p_member = auth.uid() then
    raise exception 'Vous ne pouvez pas vous retirer vous-même';
  end if;
  delete from public.members where id = p_member and family_id = public.my_family();
end;
$$;

-- 2. La cave

create table if not exists public.stock (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  category text not null default 'divers' check (category in ('boissons', 'epicerie', 'entretien', 'divers')),
  detail text,
  qty integer not null default 1 check (qty >= 0),
  updated_by uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stock_family_idx on public.stock (family_id);

alter table public.stock enable row level security;
drop policy if exists "lire la cave" on public.stock;
drop policy if exists "ranger à la cave" on public.stock;
drop policy if exists "modifier la cave" on public.stock;
drop policy if exists "retirer de la cave" on public.stock;
create policy "lire la cave" on public.stock for select using (family_id = public.my_family());
create policy "ranger à la cave" on public.stock for insert with check (family_id = public.my_family());
create policy "modifier la cave" on public.stock for update using (family_id = public.my_family()) with check (family_id = public.my_family());
create policy "retirer de la cave" on public.stock for delete using (family_id = public.my_family());

grant select, insert, update, delete on public.stock to authenticated;
grant all on public.stock to service_role;

do $$ begin
  alter publication supabase_realtime add table public.stock;
exception when duplicate_object then null;
end $$;

-- 3. Le magasin chinois
alter table public.items add column if not exists list text not null default 'courses';
alter table public.items drop constraint if exists items_list_check;
alter table public.items add constraint items_list_check check (list in ('courses', 'chinois'));
