-- Idées de plats : recettes de la famille, avec leurs ingrédients.
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  emoji text not null default '🍽️',
  ingredients jsonb not null default '[]'::jsonb,
  url text,
  upcoming boolean not null default true,
  position double precision not null default 0,
  updated_by uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recipes_family_idx on public.recipes (family_id);

alter table public.recipes enable row level security;
drop policy if exists "lire les recettes" on public.recipes;
drop policy if exists "ajouter une recette" on public.recipes;
drop policy if exists "modifier une recette" on public.recipes;
drop policy if exists "supprimer une recette" on public.recipes;
create policy "lire les recettes" on public.recipes for select using (family_id = public.my_family());
create policy "ajouter une recette" on public.recipes for insert with check (family_id = public.my_family());
create policy "modifier une recette" on public.recipes for update using (family_id = public.my_family()) with check (family_id = public.my_family());
create policy "supprimer une recette" on public.recipes for delete using (family_id = public.my_family());

grant select, insert, update, delete on public.recipes to authenticated;
grant all on public.recipes to service_role;

do $$ begin
  alter publication supabase_realtime add table public.recipes;
exception when duplicate_object then null;
end $$;
