-- Plusieurs listes de courses : « courses » (supermarché) et « chinois » (magasin chinois).
alter table public.items add column if not exists list text not null default 'courses';
alter table public.items drop constraint if exists items_list_check;
alter table public.items add constraint items_list_check check (list in ('courses', 'chinois'));
