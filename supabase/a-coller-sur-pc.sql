-- Nos courses : ce qu'il reste à coller dans Supabase > SQL Editor (nouvel onglet +, coller, Run).
-- On peut le lancer plusieurs fois sans risque. (Tout le reste est déjà fait.)

-- Étapes de préparation des recettes
alter table public.recipes add column if not exists steps text;
