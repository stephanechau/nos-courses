// Ajout d'articles par les raccourcis vocaux (Siri, Android).
// Appel : POST https://<projet>.supabase.co/functions/v1/ajout
//   corps JSON : { "jeton": "<jeton personnel>", "texte": "farine et pâtes" }
// ou GET ...?jeton=...&texte=...
// La fonction est publique (pas de connexion) : le jeton personnel fait office de clé.
import { createClient } from 'npm:@supabase/supabase-js@2.119.2';
import { guessRayon, normalize, parseSpoken } from '../_shared/texte.ts';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const UUID = /^[0-9a-f-]{36}$/i;

const reply = (texte: string, status = 200) =>
  new Response(JSON.stringify({ message: texte }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' }
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' } });

  let jeton = '';
  let texte = '';
  const url = new URL(req.url);
  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    jeton = String(body.jeton ?? '');
    texte = String(body.texte ?? '');
  } else {
    jeton = url.searchParams.get('jeton') ?? '';
    texte = url.searchParams.get('texte') ?? '';
  }

  if (!UUID.test(jeton)) return reply('Jeton manquant ou invalide.', 401);
  const { data: member } = await sb.from('members').select('id, family_id').eq('voice_token', jeton).maybeSingle();
  if (!member) return reply('Jeton inconnu. Recopiez-le depuis les réglages de l’app.', 401);

  const names = parseSpoken(texte).slice(0, 15);
  if (names.length === 0) return reply('Je n’ai pas compris quoi ajouter.', 400);

  const { data: current } = await sb.from('items').select('name').eq('family_id', member.family_id).eq('done', false);
  const already = new Set((current ?? []).map((i) => normalize(i.name)));
  const fresh = names.filter((n) => !already.has(normalize(n)));

  if (fresh.length > 0) {
    const { error } = await sb.from('items').insert(
      fresh.map((name) => ({ family_id: member.family_id, name, rayon: guessRayon(name), voice: true, added_by: member.id }))
    );
    if (error) return reply('Impossible d’ajouter pour le moment.', 500);
  }

  const list = (xs: string[]) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(', ')} et ${xs[xs.length - 1]}`).toLowerCase();
  if (fresh.length === 0) return reply(`C’est déjà sur la liste : ${list(names)}.`);
  return reply(`C’est noté : ${list(fresh)}.`);
});
