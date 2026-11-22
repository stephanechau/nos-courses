// Version à coller dans l'éditeur de fonctions Supabase (copie de supabase/functions/notify/index.ts).

// Envoie les notifications quand la liste change.
// Déclenchée par un « Database Webhook » Supabase sur la table items (INSERT et UPDATE).
import { createClient } from 'npm:@supabase/supabase-js@2.119.2';
import webpush from 'npm:web-push@3.6.7';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@example.invalid',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);
const SECRET = Deno.env.get('NOTIFY_SECRET');
const GROUP_MINUTES = 3;

interface Item {
  id: string;
  family_id: string;
  name: string;
  added_by: string | null;
  qty?: string | null;
  note?: string | null;
  list?: string | null;
  done: boolean;
  done_by: string | null;
}
interface Payload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  record: Item;
  old_record: Item | null;
}

const LISTES: Record<string, string> = { courses: '🛒 Courses', chinois: '🥢 Magasin chinois' };
type Ligne = Pick<Item, 'name' | 'qty' | 'note' | 'list'>;
/** « pommes (2 kg, bien mûres) » */
const detail = (i: Ligne) => {
  const extra = [i.qty, i.note].map((x) => x?.trim()).filter(Boolean).join(', ');
  return `${i.name.toLowerCase()}${extra ? ` (${extra})` : ''}`;
};
/** Une ligne par liste : « 🛒 Courses : pommes (2 kg), lait » */
const parListe = (lignes: Ligne[]) => {
  const groups = new Map<string, string[]>();
  for (const l of lignes) {
    const k = l.list ?? 'courses';
    groups.set(k, [...(groups.get(k) ?? []), detail(l)]);
  }
  return [...groups].map(([k, v]) => `${LISTES[k] ?? k} : ${v.join(', ')}`).join('\n');
};

const parisHour = () => Number(new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Paris' }).format(new Date()));

Deno.serve(async (req) => {
  if (SECRET && req.headers.get('x-notify-secret') !== SECRET) return new Response('interdit', { status: 401 });
  const p = (await req.json()) as Payload;
  const it = p.record;

  let kind: 'onAdd' | 'onShopping';
  let actorId: string | null;
  if (p.type === 'INSERT') {
    kind = 'onAdd';
    actorId = it.added_by;
  } else if (p.type === 'UPDATE' && it.done && !p.old_record?.done) {
    kind = 'onShopping';
    actorId = it.done_by;
    // Seulement au premier article coché d'une session de courses (une fois par heure maximum).
    const { data: fam } = await sb.from('families').select('shopping_notified_at').eq('id', it.family_id).single();
    if (fam?.shopping_notified_at && Date.now() - Date.parse(fam.shopping_notified_at) < 60 * 60_000) return new Response('déjà prévenu');
    await sb.from('families').update({ shopping_notified_at: new Date().toISOString() }).eq('id', it.family_id);
  } else return new Response('rien à faire');

  const { data: members } = await sb.from('members').select('id, name, prefs, last_notified_at').eq('family_id', it.family_id);
  const actor = members?.find((m) => m.id === actorId);
  const hour = parisHour();

  for (const m of members ?? []) {
    if (m.id === actorId) continue; // jamais pour ses propres actions
    const prefs = m.prefs ?? {};
    if (!prefs[kind]) continue;
    if (prefs.quietNight && (hour >= 22 || hour < 7)) continue;

    let body: string;
    let title = 'Nos courses';
    const who = actor?.name ?? 'Quelqu’un';
    if (kind === 'onShopping') body = `${who} fait les courses.`;
    else if (prefs.grouped && m.last_notified_at && Date.now() - Date.parse(m.last_notified_at) < GROUP_MINUTES * 60_000) {
      // Regroupement : on remplace la notification précédente par un résumé.
      const since = new Date(Date.parse(m.last_notified_at) - 1000).toISOString();
      const { data: batch } = await sb.from('items').select('*').eq('family_id', it.family_id).eq('done', false).neq('added_by', m.id).gte('created_at', since);
      const lignes = (batch ?? []) as Ligne[];
      title = `${who} a ajouté ${lignes.length} article${lignes.length > 1 ? 's' : ''}`;
      body = parListe(lignes.length ? lignes : [it]);
    } else {
      title = `${who} a ajouté`;
      body = parListe([it]);
    }

    const { data: subs } = await sb.from('push_subscriptions').select('endpoint, p256dh, auth').eq('member_id', m.id);
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ title, body, tag: kind }));
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      }
    }
    if (kind === 'onAdd' && !(prefs.grouped && m.last_notified_at && Date.now() - Date.parse(m.last_notified_at) < GROUP_MINUTES * 60_000)) {
      await sb.from('members').update({ last_notified_at: new Date().toISOString() }).eq('id', m.id);
    }
  }
  return new Response('ok');
});
