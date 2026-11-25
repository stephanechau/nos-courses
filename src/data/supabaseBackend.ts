import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Backend } from './backend';
import { DEFAULT_PREFS } from './backend';
import type { Item, ListStore, Member, NewItem, NotificationPrefs } from './types';
import type { ListId } from './lists';
import { normalize } from './rayons';
import { pushStatus, subscribePush, unsubscribePush } from './push';
import type { CaveCat, CaveStore, StockItem } from './cave';
import type { ImportedRecipe, Ingredient, Recipe, RecipeStore } from './recettes';

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
  list?: string;
}

const toItem = (r: ItemRow): Item => ({
  id: r.id,
  name: r.name,
  rayon: r.rayon,
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

  // Rafraîchit l'écran juste après une modification faite sur ce téléphone
  // (le temps réel ne prévient pas toujours des suppressions).
  const itemRefreshers = new Set<() => void>();
  const refreshItems = () => itemRefreshers.forEach((f) => f());
  const stockRefreshers = new Set<() => void>();
  const refreshStock = () => stockRefreshers.forEach((f) => f());
  const recipeRefreshers = new Set<() => void>();
  const refreshRecipes = () => recipeRefreshers.forEach((f) => f());

  const makeStore = (list: ListId): ListStore => {
    // Avant l'installation du magasin chinois, la colonne « list » n'existe pas : tout est « courses ».
    const inList = (r: ItemRow) => (r.list ?? 'courses') === list;
    return {
      subscribe(cb, onMissing) {
        let items: Item[] = [];
        const refresh = async () => {
          if (list !== 'courses') {
            const { error: probe } = await sb.from('items').select('list').limit(1);
            if (probe) return onMissing?.();
          }
          const { data } = await sb.from('items').select('*').order('created_at');
          items = ((data ?? []) as ItemRow[]).filter(inList).map(toItem);
          remember(items.map((i) => i.name));
          cb(items);
        };
        refresh();
        const channel = sb
          .channel(`items-${list}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `family_id=eq.${familyId}` }, refresh)
          // Les suppressions ne passent pas par le filtre famille : on les écoute à part.
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' }, refresh)
          .subscribe();
        itemRefreshers.add(refresh);
        // Rattrapage quand l'app revient au premier plan (le temps réel peut être coupé en veille).
        const onVisible = () => document.visibilityState === 'visible' && refresh();
        document.addEventListener('visibilitychange', onVisible);
        return () => {
          itemRefreshers.delete(refresh);
          sb.removeChannel(channel);
          document.removeEventListener('visibilitychange', onVisible);
        };
      },
      async add(input: NewItem, by: string) {
        const name = input.name.trim();
        if (!name) return;
        if (!familyId) throw new Error('famille introuvable, rechargez la page');
        remember([name]);
        const { data: existing, error: readError } = await sb.from('items').select('*').eq('done', false);
        if (readError) throw new Error(readError.message);
        const dup = ((existing ?? []) as ItemRow[]).filter(inList).find((i) => normalize(i.name) === normalize(name));
        if (dup) {
          const patch: Record<string, string> = {};
          if (input.qty) patch.qty = input.qty;
          if (input.note) patch.note = input.note;
          if (Object.keys(patch).length) await sb.from('items').update(patch).eq('id', dup.id);
          refreshItems();
          return;
        }
        const row: Record<string, unknown> = {
          family_id: familyId,
          name,
          rayon: input.rayon,
          qty: input.qty ?? null,
          note: input.note ?? null,
          voice: !!input.voice,
          added_by: by
        };
        if (list !== 'courses') row.list = list;
        const { error } = await sb.from('items').insert(row);
        if (error) throw new Error(error.message);
        refreshItems();
      },
      async setDone(id, done, by) {
        const { error } = await sb.from('items').update({ done, done_by: done ? by : null }).eq('id', id);
        if (error) throw new Error(error.message);
        refreshItems();
      },
      async update(id, patch) {
        const { error } = await sb
          .from('items')
          .update({ name: patch.name, rayon: patch.rayon, qty: patch.qty ?? null, note: patch.note ?? null })
          .eq('id', id);
        if (error) throw new Error(error.message);
        refreshItems();
      },
      async moveTo(id, to, patch) {
        const { error } = await sb
          .from('items')
          .update({ list: to, name: patch.name, rayon: patch.rayon, qty: patch.qty ?? null, note: patch.note ?? null })
          .eq('id', id);
        if (error) throw new Error(error.message);
        refreshItems();
      },
      async remove(id) {
        const { error } = await sb.from('items').delete().eq('id', id);
        if (error) throw new Error(error.message);
        refreshItems();
      },
      async clearDone() {
        if (!familyId) throw new Error('famille introuvable, rechargez la page');
        const { data, error: readError } = await sb.from('items').select('*').eq('done', true);
        if (readError) throw new Error(readError.message);
        const ids = ((data ?? []) as ItemRow[]).filter(inList).map((r) => r.id);
        if (!ids.length) return;
        const { error } = await sb.from('items').delete().in('id', ids);
        if (error) throw new Error(error.message);
        refreshItems();
      },
      history: () => history
    };
  };
  const store = makeStore('courses');
  const chinois = makeStore('chinois');

  interface StockRow {
    id: string;
    name: string;
    category: string;
    detail: string | null;
    qty: number;
    updated_at: string;
  }
  const toStock = (r: StockRow): StockItem => ({
    id: r.id,
    name: r.name,
    category: r.category as CaveCat,
    detail: r.detail ?? undefined,
    qty: r.qty,
    updatedAt: Date.parse(r.updated_at)
  });
  const now = () => new Date().toISOString();
  const cave: CaveStore = {
    subscribe(cb, onMissing) {
      const refresh = async () => {
        const { data, error } = await sb.from('stock').select('id, name, category, detail, qty, updated_at').order('name');
        if (error) {
          // Table absente : la cave n'a pas encore été installée dans Supabase.
          if (/stock|relation|schema cache/i.test(error.message)) onMissing?.();
          return;
        }
        cb((data ?? []).map((r) => toStock(r as StockRow)));
      };
      refresh();
      const channel = sb
        .channel('stock')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stock', filter: `family_id=eq.${familyId}` }, refresh)
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stock' }, refresh)
        .subscribe();
      stockRefreshers.add(refresh);
      const onVisible = () => document.visibilityState === 'visible' && refresh();
      document.addEventListener('visibilitychange', onVisible);
      return () => {
        stockRefreshers.delete(refresh);
        sb.removeChannel(channel);
        document.removeEventListener('visibilitychange', onVisible);
      };
    },
    async add(it, by) {
      const name = it.name.trim();
      if (!name) return;
      if (!familyId) throw new Error('famille introuvable, rechargez la page');
      const { data: existing, error: readError } = await sb.from('stock').select('id, name, qty');
      if (readError) throw new Error(readError.message);
      const dup = existing?.find((i) => normalize(i.name) === normalize(name));
      if (dup) {
        const { error } = await sb.from('stock').update({ qty: dup.qty + it.qty, updated_by: by, updated_at: now() }).eq('id', dup.id);
        if (error) throw new Error(error.message);
        refreshStock();
        return;
      }
      const { error } = await sb
        .from('stock')
        .insert({ family_id: familyId, name, category: it.category, detail: it.detail ?? null, qty: it.qty, updated_by: by });
      if (error) throw new Error(error.message);
      refreshStock();
    },
    async update(id, p, by) {
      const { error } = await sb
        .from('stock')
        .update({ name: p.name.trim(), category: p.category, detail: p.detail ?? null, qty: p.qty, updated_by: by, updated_at: now() })
        .eq('id', id);
      if (error) throw new Error(error.message);
      refreshStock();
    },
    async setQty(id, qty, by) {
      const { error } = await sb.from('stock').update({ qty: Math.max(0, qty), updated_by: by, updated_at: now() }).eq('id', id);
      if (error) throw new Error(error.message);
      refreshStock();
    },
    async remove(id) {
      const { error } = await sb.from('stock').delete().eq('id', id);
      if (error) throw new Error(error.message);
      refreshStock();
    }
  };

  interface RecipeRow {
    id: string;
    name: string;
    emoji: string;
    ingredients: Ingredient[] | null;
    url: string | null;
    steps?: string | null;
    upcoming: boolean;
    position: number;
    updated_at: string;
  }
  // La colonne « steps » arrive avec un petit SQL : tant qu'elle manque, on fait sans.
  let hasSteps = true;
  const toRecipe = (r: RecipeRow): Recipe => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    url: r.url ?? undefined,
    steps: r.steps ? r.steps.split('\n').filter(Boolean) : undefined,
    upcoming: r.upcoming,
    position: r.position,
    updatedAt: Date.parse(r.updated_at)
  });
  const topOf = async (upcoming: boolean) => {
    const { data } = await sb.from('recipes').select('position').eq('upcoming', upcoming).order('position').limit(1);
    return data?.length ? (data[0].position as number) - 1 : 0;
  };
  const recettes: RecipeStore = {
    subscribe(cb, onMissing) {
      const refresh = async () => {
        const cols = 'id, name, emoji, ingredients, url, upcoming, position, updated_at';
        let { data, error } = await sb.from('recipes').select(hasSteps ? `${cols}, steps` : cols as string);
        if (error && hasSteps && /steps/i.test(error.message)) {
          hasSteps = false;
          ({ data, error } = await sb.from('recipes').select(cols));
        }
        if (error) {
          // Table absente : les idées de plats n'ont pas encore été installées dans Supabase.
          if (/recipes|relation|schema cache/i.test(error.message)) onMissing?.();
          return;
        }
        cb(((data ?? []) as unknown as RecipeRow[]).map(toRecipe));
      };
      refresh();
      const channel = sb
        .channel('recipes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes', filter: `family_id=eq.${familyId}` }, refresh)
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'recipes' }, refresh)
        .subscribe();
      recipeRefreshers.add(refresh);
      const onVisible = () => document.visibilityState === 'visible' && refresh();
      document.addEventListener('visibilitychange', onVisible);
      return () => {
        recipeRefreshers.delete(refresh);
        sb.removeChannel(channel);
        document.removeEventListener('visibilitychange', onVisible);
      };
    },
    async add(r, by) {
      if (!familyId) throw new Error('famille introuvable, rechargez la page');
      const { error } = await sb.from('recipes').insert({
        family_id: familyId,
        name: r.name.trim(),
        emoji: r.emoji,
        ingredients: r.ingredients,
        url: r.url ?? null,
        ...(hasSteps ? { steps: r.steps?.length ? r.steps.join('\n') : null } : {}),
        upcoming: r.upcoming,
        position: await topOf(r.upcoming),
        updated_by: by
      });
      if (error) throw new Error(error.message);
      refreshRecipes();
    },
    async update(id, p, by) {
      const patch: Record<string, unknown> = { updated_by: by, updated_at: now() };
      if (p.name !== undefined) patch.name = p.name.trim();
      if (p.emoji !== undefined) patch.emoji = p.emoji;
      if (p.ingredients !== undefined) patch.ingredients = p.ingredients;
      if (p.url !== undefined) patch.url = p.url || null;
      if (p.steps !== undefined && hasSteps) patch.steps = p.steps.length ? p.steps.join('\n') : null;
      if (p.upcoming !== undefined) {
        patch.upcoming = p.upcoming;
        if (p.position === undefined) patch.position = await topOf(p.upcoming);
      }
      if (p.position !== undefined) patch.position = p.position;
      const { error } = await sb.from('recipes').update(patch).eq('id', id);
      if (error) throw new Error(error.message);
      refreshRecipes();
    },
    async remove(id) {
      const { error } = await sb.from('recipes').delete().eq('id', id);
      if (error) throw new Error(error.message);
      refreshRecipes();
    }
  };

  return {
    store,
    chinois,
    cave,
    recettes,
    async importRecipe(link: string): Promise<ImportedRecipe> {
      const { data, error } = await sb.functions.invoke('recette', { body: { url: link } });
      if (error) {
        let msg = '';
        try {
          msg = (await (error as { context?: Response }).context?.json())?.error ?? '';
        } catch {
          /* ignoré */
        }
        if (/not found|404/i.test(error.message) && !msg) throw new Error('la lecture des liens n’est pas encore installée');
        throw new Error(msg || error.message);
      }
      return data as ImportedRecipe;
    },
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

