import type { Item, ListStore, NewItem } from './types';
import { normalize } from './rayons';

const HISTORY_KEY = 'nos-courses:history';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible : on garde en mémoire */
  }
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Stockage local au navigateur, synchronisé entre onglets. Pour tester sans serveur. */
export function createLocalStore(KEY = 'nos-courses:items'): ListStore {
  let items: Item[] = read<Item[]>(KEY, []);
  let history: string[] = read<string[]>(HISTORY_KEY, []);
  const listeners = new Set<(items: Item[]) => void>();
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(KEY) : null;

  const emit = () => listeners.forEach((cb) => cb(items));
  const commit = (next: Item[]) => {
    items = next;
    write(KEY, items);
    channel?.postMessage('changed');
    emit();
  };
  channel?.addEventListener('message', () => {
    items = read<Item[]>(KEY, []);
    history = read<string[]>(HISTORY_KEY, []);
    emit();
  });

  const remember = (name: string) => {
    const n = normalize(name);
    history = [name, ...history.filter((h) => normalize(h) !== n)].slice(0, 300);
    write(HISTORY_KEY, history);
  };

  return {
    subscribe(cb) {
      listeners.add(cb);
      cb(items);
      return () => listeners.delete(cb);
    },
    async add(input: NewItem, by: string) {
      const name = input.name.trim();
      if (!name) return;
      // Pas de doublon : un article déjà sur la liste est simplement mis à jour.
      const existing = items.find((i) => !i.done && normalize(i.name) === normalize(name));
      remember(name);
      if (existing) {
        commit(items.map((i) => (i === existing ? { ...i, qty: input.qty ?? i.qty, note: input.note ?? i.note } : i)));
        return;
      }
      commit([...items, { ...input, name, id: uid(), addedBy: by, done: false, createdAt: Date.now() }]);
    },
    async setDone(id, done, by) {
      commit(items.map((i) => (i.id === id ? { ...i, done, doneBy: done ? by : undefined } : i)));
    },
    async update(id, patch) {
      commit(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    },
    async remove(id) {
      commit(items.filter((i) => i.id !== id));
    },
    async clearDone() {
      commit(items.filter((i) => !i.done));
    },
    history: () => history
  };
}
