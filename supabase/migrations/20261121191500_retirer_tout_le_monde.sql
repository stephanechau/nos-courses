-- Changement d'avis : tout membre de la famille peut en retirer un autre.
-- (On ne peut toujours pas se retirer soi-même : il y a « Quitter la liste » pour ça.)

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
