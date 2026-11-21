-- Droits d'accès explicites aux tables (les nouveaux projets Supabase ne les donnent plus automatiquement).
-- Les règles de sécurité (RLS) restent appliquées : chacun ne voit que sa famille.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on public.items to authenticated;
grant select on public.families to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select on public.keepalive to anon, authenticated;

-- Les fonctions du serveur (ajout vocal, notifications) ont accès à tout.
grant all on all tables in schema public to service_role;

grant execute on function public.join_family(text, text, text) to authenticated;
grant execute on function public.my_family() to authenticated;
grant execute on function public.my_invite_code() to authenticated;
grant execute on function public.my_voice_token() to authenticated;
grant execute on function public.invite_info(text) to anon, authenticated;
