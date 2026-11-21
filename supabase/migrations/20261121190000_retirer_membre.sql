-- Retirer un membre de la famille : réservé à la personne qui a créé la famille.
-- Les articles ajoutés par ce membre restent dans la liste (sans pastille).
-- La personne retirée peut revenir en retapant le code famille.

create or replace function public.i_created_family() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.families where id = public.my_family() and created_by = auth.uid())
$$;

create or replace function public.remove_member(p_member uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.i_created_family() then
    raise exception 'Seule la personne qui a créé la famille peut retirer un membre';
  end if;
  if p_member = auth.uid() then
    raise exception 'Vous ne pouvez pas vous retirer vous-même';
  end if;
  delete from public.members where id = p_member and family_id = public.my_family();
end;
$$;

revoke execute on function public.i_created_family() from public, anon;
revoke execute on function public.remove_member(uuid) from public, anon;
grant execute on function public.i_created_family() to authenticated;
grant execute on function public.remove_member(uuid) to authenticated;
