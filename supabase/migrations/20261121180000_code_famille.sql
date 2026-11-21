-- Connexion sans e-mail : chacun rejoint la famille avec un code court et lisible.
-- À exécuter une fois dans Supabase > SQL Editor, après le premier fichier.

-- Code de 6 caractères sans lettres ambiguës (pas de O/0, I/1).
create or replace function public.new_family_code() returns text
language sql volatile set search_path = public, extensions as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + (get_byte(b, i) % 32), 1), '')
  from (select gen_random_bytes(6) as b) x, generate_series(0, 5) as i
$$;

alter table public.families alter column invite_code set default public.new_family_code();
update public.families set invite_code = public.new_family_code() where char_length(invite_code) <> 6;

-- Le code peut être tapé en minuscules ou avec des espaces.
create or replace function public.join_family(p_name text, p_color text, p_invite text default null)
returns public.members
language plpgsql security definer set search_path = public as $$
declare
  v_family uuid;
  v_member public.members;
  v_code text := upper(regexp_replace(coalesce(p_invite, ''), '\s', '', 'g'));
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  select * into v_member from public.members where id = auth.uid();
  if found then return v_member; end if;

  if v_code <> '' then
    select id into v_family from public.families where invite_code = v_code;
    if v_family is null then raise exception 'Code d''invitation inconnu'; end if;
  else
    insert into public.families (created_by) values (auth.uid()) returning id into v_family;
  end if;

  insert into public.members (id, family_id, name, color)
  values (auth.uid(), v_family, p_name, p_color)
  returning * into v_member;
  return v_member;
end $$;

create or replace function public.invite_info(p_invite text) returns text
language sql stable security definer set search_path = public as $$
  select m.name from public.families f join public.members m on m.id = f.created_by
  where f.invite_code = upper(regexp_replace(coalesce(p_invite, ''), '\s', '', 'g'))
$$;
