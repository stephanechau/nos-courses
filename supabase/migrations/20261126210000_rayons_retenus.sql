-- Rayons retenus : quand quelqu'un change le rayon d'un article à la main,
-- toute la famille le retrouve dans ce rayon aux ajouts suivants.
create table if not exists public.rayon_memo (
  family_id uuid not null references public.families (id) on delete cascade,
  list text not null default 'courses' check (list in ('courses', 'chinois')),
  name text not null check (char_length(name) between 1 and 120),
  rayon text not null check (char_length(rayon) between 1 and 40),
  updated_at timestamptz not null default now(),
  primary key (family_id, list, name)
);

alter table public.rayon_memo enable row level security;
drop policy if exists "lire les rayons retenus" on public.rayon_memo;
drop policy if exists "retenir un rayon" on public.rayon_memo;
drop policy if exists "changer un rayon retenu" on public.rayon_memo;
drop policy if exists "oublier un rayon" on public.rayon_memo;
create policy "lire les rayons retenus" on public.rayon_memo for select using (family_id = public.my_family());
create policy "retenir un rayon" on public.rayon_memo for insert with check (family_id = public.my_family());
create policy "changer un rayon retenu" on public.rayon_memo for update using (family_id = public.my_family()) with check (family_id = public.my_family());
create policy "oublier un rayon" on public.rayon_memo for delete using (family_id = public.my_family());

grant select, insert, update, delete on public.rayon_memo to authenticated;
grant all on public.rayon_memo to service_role;

do $$ begin
  alter publication supabase_realtime add table public.rayon_memo;
exception when duplicate_object then null;
end $$;
