import { guessRayon, normalize } from './rayons';

export type CaveCat = 'boissons' | 'epicerie' | 'entretien' | 'divers';

export interface CaveCategory {
  id: CaveCat;
  label: string;
  emoji: string;
  tint: string;
  /** Objets qui ne se consomment pas : rien à racheter quand il n'y en a plus. */
  durable?: boolean;
}

export const CAVE_CATS: CaveCategory[] = [
  { id: 'boissons', label: 'Vins, alcools et boissons', emoji: '🍷', tint: '#F4E1E6' },
  { id: 'epicerie', label: 'Conserves et épicerie', emoji: '🥫', tint: '#FBEFCF' },
  { id: 'entretien', label: 'Entretien et ménage', emoji: '🧺', tint: '#DCF1F7' },
  { id: 'divers', label: 'Divers', emoji: '🧰', tint: '#E4F2DC', durable: true }
];

export interface StockItem {
  id: string;
  name: string;
  category: CaveCat;
  detail?: string;
  qty: number;
  updatedAt: number;
}

export type NewStock = Pick<StockItem, 'name' | 'category' | 'detail' | 'qty'>;

export interface CaveStore {
  /** onMissing est appelé si la cave n'est pas encore installée dans la base. */
  subscribe(cb: (items: StockItem[]) => void, onMissing?: () => void): () => void;
  /** Range un objet ; s'il existe déjà, ajoute la quantité. */
  add(item: NewStock, by: string): Promise<void>;
  update(id: string, patch: NewStock, by: string): Promise<void>;
  setQty(id: string, qty: number, by: string): Promise<void>;
  remove(id: string): Promise<void>;
}

const WINE = ['vin', 'rouge', 'blanc', 'rose', 'champagne', 'cremant', 'whisky', 'rhum', 'vodka', 'gin', 'pastis', 'cognac', 'porto', 'liqueur', 'aperitif', 'biere', 'bordeaux', 'bourgogne', 'chablis', 'saint', 'cotes', 'chateau', 'prosecco'];
const DIVERS = ['outil', 'perceuse', 'marteau', 'tournevis', 'sac de couchage', 'tente', 'climatis', 'ventilateur', 'petanque', 'velo', 'valise', 'decoration', 'sapin', 'echelle', 'chaise', 'matelas', 'jouet', 'ski', 'barbecue'];

/** Catégorie probable d'un objet rangé à la cave. */
export function guessCaveCat(name: string): CaveCat {
  const n = normalize(name);
  if (DIVERS.some((k) => n.includes(k))) return 'divers';
  if (WINE.some((k) => n.split(' ').includes(k) || n.startsWith(k))) return 'boissons';
  const r = guessRayon(name);
  if (r === 'boissons') return 'boissons';
  if (r === 'maison' || r === 'hygiene') return 'entretien';
  if (r === 'autre') return 'divers';
  return 'epicerie';
}

const KEY = 'nos-courses:cave';
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Mode test : la cave reste dans ce navigateur. */
export function createLocalCave(): CaveStore {
  const read = (): StockItem[] => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]');
    } catch {
      return [];
    }
  };
  let items = read();
  const listeners = new Set<(i: StockItem[]) => void>();
  const commit = (next: StockItem[]) => {
    items = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignoré */
    }
    listeners.forEach((cb) => cb(items));
  };
  return {
    subscribe(cb) {
      listeners.add(cb);
      cb(items);
      return () => listeners.delete(cb);
    },
    async add(it) {
      const dup = items.find((i) => normalize(i.name) === normalize(it.name));
      if (dup) return commit(items.map((i) => (i === dup ? { ...i, qty: i.qty + it.qty, updatedAt: Date.now() } : i)));
      commit([...items, { ...it, id: uid(), updatedAt: Date.now() }]);
    },
    async update(id, patch) {
      commit(items.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: Date.now() } : i)));
    },
    async setQty(id, qty) {
      commit(items.map((i) => (i.id === id ? { ...i, qty: Math.max(0, qty), updatedAt: Date.now() } : i)));
    },
    async remove(id) {
      commit(items.filter((i) => i.id !== id));
    }
  };
}
