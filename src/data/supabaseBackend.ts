import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Backend } from './backend';
import { DEFAULT_PREFS } from './backend';
import type { Item, ListStore, Member, NewItem, NotificationPrefs } from './types';
import type { RayonId } from './rayons';
import { normalize } from './rayons';
import { pushStatus, subscribePush, unsubscribePush } from './push';

interface ItemRow {
  id: string;
  family_id: string;
  name: string;
  rayon: string;
  qty: string | null;
  note: string | null;
  added_by: string | null;
  voice: boolean;
  done: boolean;
  done_by: string | null;
  created_at: string;
}

const toItem = (r: ItemRow): Item => ({
  id: r.id,
  name: r.name,
  rayon: r.rayon as RayonId,
  qty: r.qty ?? undefined,
  note: r.note ?? undefined,
  addedBy: r.added_by ?? '',
  voice: r.voice,
  done: r.done,
  doneBy: r.done_by ?? undefined,
  createdAt: Date.parse(r.created_at)
});

const INVITE_KEY = 'nos-courses:invite';
const HISTORY_KEY = 'nos-courses:history';

function readInvite(): string | undefined {
  const q = new URLSearchParams(location.search).get('invitation')?.toUpperCase() ?? null;
  try {
    if (q) localStorage.setItem(INVITE_KEY, q);
    return q ?? localStorage.getItem(INVITE_KEY) ?? undefined;
  } catch {
    return q ?? undefined;
  }
}

export function createSupabaseBackend(url: string, anonKey: string): Backend {
  const sb: SupabaseClient = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  const invite = readInvite();
  let me: Member | null = null;
  let prefs: NotificationPrefs = DEFAULT_PREFS;
  let familyId: string | null = null;
  let history: string[] = [];
  try {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    /* ignoré */
  }
  const remember = (names: string[]) => {
    for (const name of names) {
      const n = normalize(name);
      history = [name, ...history.filter((h) => normalize(h) !== n)].slice(0, 300);
    }
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      /* ignoré */
    }
  };

  const sessionCbs = new Set<(m: Member | null) => void>();
  const emitSession = () => sessionCbs.forEach((cb) => cb(me));

  async function loadMe() {
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) {
      me = null;
      familyId = null;
      return emitSession();
    }
    const { data } = await sb.from('members').select('id, family_id, name, color, prefs').eq('id', auth.user.id).maybeSingle();
    if (data) {
      me = { id: data.id, name: data.name, color: data.color };
      familyId = data.family_id;
      prefs = { ...DEFAULT_PREFS, ...(data.prefs ?? {}) };
    } else me = null;
    emitSession();
  }

  sb.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') loadMe();
  });

  const store: ListStore = {
    subscribe(cb) {
      let items: Item[] = [];
      const refresh = async () => {
        const { data } = await sb.from('items').select('*').order('created_at');
        items = (data ?? []).map(toItem);
        remember(items.map((i) => i.name));
        cb(items);
      };
      refresh();
      const channel = sb
        .channel('items')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `family_id=eq.${familyId}` }, refresh)
        .subscribe();
      // Rattrapage quand l'app revient au premier plan (le temps réel peut être coupé en veille).
      const onVisible = () => document.visibilityState === 'visible' && refresh();
      document.addEventListener('visibilitychange', onVisible);
      return () => {
        sb.removeChannel(channel);
        document.removeEventListener('visibilitychange', onVisible);
      };
    },
    async add(input: NewItem, by: string) {
      const name = input.name.trim();
      if (!name) return;
      if (!familyId) throw new Error('famille introuvable, rechargez la page');
      remember([name]);
      const { data: existing, error: readError } = await sb.from('items').select('id, name').eq('done', false);
      if (readError) throw new Error(readError.message);
      const dup = existing?.find((i) => normalize(i.name) === normalize(name));
      if (dup) {
        const patch: Record<string, string> = {};
        if (input.qty) patch.qty = input.qty;
        if (input.note) patch.note = input.note;
        if (Object.keys(patch).length) await sb.from('items').update(patch).eq('id', dup.id);
        return;
      }
      const { error } = await sb.from('items').insert({
        family_id: familyId,
        name,
        rayon: input.rayon,
        qty: input.qty ?? null,
        note: input.note ?? null,
        voice: !!input.voice,
        added_by: by
      });
      if (error) throw error;
    },
    async setDone(id, done, by) {
      const { error } = await sb.from('items').update({ done, done_by: done ? by : null }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    async update(id, patch) {
      await sb
        .from('items')
        .update({ name: patch.name, rayon: patch.rayon, qty: patch.qty ?? null, note: patch.note ?? null })
        .eq('id', id);
    },
    async remove(id) {
      await sb.from('items').delete().eq('id', id);
    },
    async clearDone() {
      await sb.from('items').delete().eq('done', true).eq('family_id', familyId);
    },
    history: () => history
  };

  return {
    store,
    onSession(cb) {
      sessionCbs.add(cb);
      loadMe();
      return () => sessionCbs.delete(cb);
    },
    onMembers(cb) {
      const refresh = async () => {
        const { data } = await sb.from('members').select('id, name, color').order('created_at');
        const list = (data ?? []) as Member[];
        // Si ce téléphone a été retiré de la famille, on revient à l'écran d'accueil.
        if (me && !list.some((m) => m.id === me!.id)) return loadMe();
        cb(list);
      };
      refresh();
      const channel = sb.channel('members').on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, refresh).subscribe();
      return () => {
        sb.removeChannel(channel);
      };
    },
    online: true,
    pendingCode: () => invite,
    async join(name, color, familyCode) {
      const { data: session } = await sb.auth.getSession();
      if (!session.session) {
        const { error } = await sb.auth.signInAnonymously();
        if (error) throw new Error('Connexion impossible. Vérifiez votre connexion internet.');
      }
      const code = familyCode?.trim().toUpperCase() || null;
      const { error } = await sb.rpc('join_family', { p_name: name, p_color: color, p_invite: code });
      if (error) throw new Error(/invitation/i.test(error.message) ? 'Code famille inconnu. Vérifiez-le auprès de la famille.' : error.message);
      try {
        localStorage.removeItem(INVITE_KEY);
      } catch {
        /* ignoré */
      }
      await loadMe();
    },
    async logout() {
      await unsubscribePush(sb).catch(() => {});
      await sb.auth.signOut();
    },
    async inviterName(familyCode) {
      const { data } = await sb.rpc('invite_info', { p_invite: familyCode.trim().toUpperCase() });
      return (data as string | null) ?? undefined;
    },
    async invitation() {
      const { data } = await sb.rpc('my_invite_code');
      if (!data) return undefined;
      return { code: data as string, link: `${location.origin}${location.pathname}?invitation=${data}` };
    },
    async voiceSetup() {
      const { data, error } = await sb.rpc('my_voice_token');
      if (error || !data) throw new Error('Jeton indisponible');
      return { endpoint: `${url}/functions/v1/ajout`, token: data as string };
    },
    pushStatus,
    async removeMember(id) {
      const { error } = await sb.rpc('remove_member', { p_member: id });
      if (error) throw new Error(error.message);
    },
    getPrefs: async () => prefs,
    async setPrefs(p) {
      prefs = p;
      if (!me) return;
      await sb.from('members').update({ prefs: p }).eq('id', me.id);
      if (p.onAdd || p.onShopping) await subscribePush(sb, me.id);
      else await unsubscribePush(sb);
    }
  };
}

