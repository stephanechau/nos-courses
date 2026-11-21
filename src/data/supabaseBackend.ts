import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Backend } from './backend';
import { DEFAULT_PREFS } from './backend';
import type { Item, ListStore, Member, NewItem, NotificationPrefs } from './types';
import type { RayonId } from './rayons';
import { normalize } from './rayons';
import { subscribePush, unsubscribePush } from './push';

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
  const q = new URLSearchParams(location.search).get('invitation');
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
      if (!name || !familyId) return;
      remember([name]);
      const { data: existing } = await sb.from('items').select('id, name').eq('done', false);
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
      await sb.from('items').update({ done, done_by: done ? by : null }).eq('id', id);
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
        cb((data ?? []) as Member[]);
      };
      refresh();
      const channel = sb.channel('members').on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, refresh).subscribe();
      return () => {
        sb.removeChannel(channel);
      };
    },
    emailLogin: {
      async sendCode(email) {
        const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
        if (error) throw new Error('Impossible d’envoyer le code. Vérifiez l’adresse.');
      },
      async verifyCode(email, code) {
        const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
        if (error) throw new Error('Code incorrect ou expiré.');
        await loadMe();
        return me !== null;
      }
    },
    async join(name, color) {
      const { error } = await sb.rpc('join_family', { p_name: name, p_color: color, p_invite: invite ?? null });
      if (error) throw new Error(error.message);
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
    async inviterName() {
      if (!invite) return undefined;
      const { data } = await sb.rpc('invite_info', { p_invite: invite });
      return (data as string | null) ?? undefined;
    },
    inviteLink() {
      // Le code est chargé à la demande ; on renvoie le lien une fois connu.
      return inviteUrl ?? location.origin;
    },
    async voiceSetup() {
      const { data, error } = await sb.rpc('my_voice_token');
      if (error || !data) throw new Error('Jeton indisponible');
      return { endpoint: `${url}/functions/v1/ajout`, token: data as string };
    },
    getPrefs: async () => {
      const { data } = await sb.rpc('my_invite_code');
      inviteUrl = data ? `${location.origin}${location.pathname}?invitation=${data}` : null;
      return prefs;
    },
    async setPrefs(p) {
      prefs = p;
      if (!me) return;
      await sb.from('members').update({ prefs: p }).eq('id', me.id);
      if (p.onAdd || p.onShopping) await subscribePush(sb, me.id);
      else await unsubscribePush(sb);
    }
  };
}

let inviteUrl: string | null = null;
