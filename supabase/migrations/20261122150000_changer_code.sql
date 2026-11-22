-- Changer le code famille. Personne n'est déconnecté : le code ne sert qu'à rejoindre.
create or replace function public.set_family_code(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
begin
  if public.my_family() is null then raise exception 'Vous n''êtes dans aucune famille'; end if;
  if v_code !~ '^[A-Z0-9]{6,20}$' then
    raise exception 'Le code doit avoir de 6 à 20 lettres ou chiffres, sans accent ni signe';
  end if;
  if exists (select 1 from public.families where invite_code = v_code and id <> public.my_family()) then
    raise exception 'Ce code est déjà pris, choisissez-en un autre';
  end if;
  update public.families set invite_code = v_code where id = public.my_family();
  return v_code;
end;
$$;

revoke execute on function public.set_family_code(text) from public, anon;
grant execute on function public.set_family_code(text) to authenticated;
