-- Étapes de préparation des recettes (une par ligne).
alter table public.recipes add column if not exists steps text;
