-- La cave : stock partagé par toute la famille (vins, épicerie, entretien, divers).

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
