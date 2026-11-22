import { CARNET, type CarnetRecette } from './carnet';
import { normalize } from './rayons';

export interface Ingredient {
  name: string;
  qty?: string;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  ingredients: Ingredient[];
  /** Lien vers la recette complète, s'il y en a un. */
  url?: string;
  /** Dans « Prochaines recettes » (sinon dans la bibliothèque). */
  upcoming: boolean;
  /** Ordre dans sa rubrique : le plus petit en haut. */
  position: number;
  updatedAt: number;
}

export type NewRecipe = Pick<Recipe, 'name' | 'emoji' | 'ingredients' | 'url' | 'upcoming'>;

export interface RecipeStore {
  /** onMissing est appelé si les recettes ne sont pas encore installées dans la base. */
  subscribe(cb: (recipes: Recipe[]) => void, onMissing?: () => void): () => void;
  add(r: NewRecipe, by: string): Promise<void>;
  update(id: string, patch: Partial<NewRecipe> & { position?: number }, by: string): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Ingrédients lus sur une page de recette (Marmiton, 750g…). */
export interface ImportedRecipe {
  name: string;
  ingredients: string[];
}

const keys = (r: CarnetRecette) => [r.name, ...r.aliases].map(normalize);

/** Le plat du carnet qui correspond au nom tapé, s'il y en a un. */
export function findInCarnet(name: string): CarnetRecette | undefined {
  const n = normalize(name);
  if (!n) return undefined;
  const exact = CARNET.find((r) => keys(r).includes(n));
  if (exact) return exact;
  // Sinon le nom du carnet le plus long contenu dans ce qui est tapé (« lasagnes de maman » → Lasagnes).
  let best: CarnetRecette | undefined;
  let len = 0;
  for (const r of CARNET)
    for (const k of keys(r))
      if (k.length >= 4 && k.length > len && (` ${n} `.includes(` ${k} `) || n.startsWith(k))) {
        best = r;
        len = k.length;
      }
  return best;
}

/** Plats du carnet qui commencent comme ce qui est tapé, pour les suggestions. */
export function suggestFromCarnet(text: string, max = 5): CarnetRecette[] {
  const n = normalize(text);
  if (n.length < 2) return [];
  const starts = CARNET.filter((r) => keys(r).some((k) => k.startsWith(n) || k.split(' ').some((w) => w.startsWith(n))));
  const inside = CARNET.filter((r) => !starts.includes(r) && keys(r).some((k) => k.includes(n)));
  return [...starts, ...inside].slice(0, max);
}

const UNITS =
  'kg|g|mg|cl|ml|dl|l|c\\.? ?(?:à|a) ?(?:soupe|caf[eé])|c\\.? ?à ?s\\.?|c\\.? ?à ?c\\.?|cs|cc|cuill[eè]res? (?:à|a) (?:soupe|caf[eé])|cuill[eè]res?|pinc[ée]es?|gousses?|tranches?|bo[iî]tes?|pots?|sachets?|brins?|bottes?|feuilles?|verres?|tasses?|morceaux?|filets?|branches?|paquets?|briques?|bouquets?|poign[ée]es?|noix|noisettes?|zestes?|doses?|barquettes?|bocaux|bocal|bouteilles?|tablettes?|carr[ée]s?|rouleaux?|p[aâ]tes?(?= )';

const LINE = new RegExp(`^((?:\\d+(?:[.,/]\\d+)?|[½¼¾⅓⅔])(?:\\s*(?:à|-)\\s*\\d+)?)?\\s*(?:(${UNITS})(?!\\p{L})\\.?)?\\s*(?:de |d'|d’|des |du )?(.*)$`, 'iu');

/** « 250 g de pâtes à lasagne » → { name: « Pâtes à lasagne », qty: « 250 g » }. */
export function parseIngredientLine(line: string): Ingredient | undefined {
  const clean = line
    .replace(/\s+/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .trim()
    .replace(/[.;,]+$/, '');
  if (!clean) return undefined;
  const m = LINE.exec(clean);
  let num = m?.[1]?.trim();
  let unit = m?.[2]?.trim();
  let name = (m?.[3] ?? clean).trim();
  if (!num && unit) {
    // Une unité sans nombre (« pincée de sel ») : on garde tout comme nom.
    name = clean;
    unit = undefined;
  }
  if (!name) {
    name = clean;
    num = undefined;
    unit = undefined;
  }
  name = name.replace(/^(?:de |d'|d’)/i, '').trim();
  const qty = [num, unit].filter(Boolean).join(' ') || undefined;
  return { name: name.charAt(0).toUpperCase() + name.slice(1), qty };
}

/** Recettes d'une rubrique, dans l'ordre. */
export function section(recipes: Recipe[], upcoming: boolean): Recipe[] {
  return recipes.filter((r) => r.upcoming === upcoming).sort((a, b) => a.position - b.position || b.updatedAt - a.updatedAt);
}

/** Nouvelle position pour monter (-1) ou descendre (+1) une recette : on échange avec sa voisine. */
export function swapTarget(recipes: Recipe[], r: Recipe, dir: -1 | 1): { a: Recipe; b: Recipe; posA: number; posB: number } | undefined {
  const list = section(recipes, r.upcoming);
  const i = list.findIndex((x) => x.id === r.id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return undefined;
  const other = list[j];
  // Positions distinctes même si elles étaient égales.
  const posA = other.position === r.position ? r.position + dir : other.position;
  return { a: r, b: other, posA, posB: r.position };
}

/** Position pour placer une recette tout en haut de sa rubrique. */
export function topPosition(recipes: Recipe[], upcoming: boolean): number {
  const list = section(recipes, upcoming);
  return list.length ? list[0].position - 1 : 0;
}

const KEY = 'nos-courses:recettes';
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Mode test : les recettes restent dans ce navigateur. */
export function createLocalRecipes(): RecipeStore {
  const read = (): Recipe[] => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]');
    } catch {
      return [];
    }
  };
  let recipes = read();
  const listeners = new Set<(r: Recipe[]) => void>();
  const commit = (next: Recipe[]) => {
    recipes = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(recipes));
    } catch {
      /* ignoré */
    }
    listeners.forEach((cb) => cb(recipes));
  };
  return {
    subscribe(cb) {
      listeners.add(cb);
      cb(recipes);
      return () => listeners.delete(cb);
    },
    async add(r) {
      commit([...recipes, { ...r, id: uid(), position: topPosition(recipes, r.upcoming), updatedAt: Date.now() }]);
    },
    async update(id, patch) {
      commit(
        recipes.map((r) => {
          if (r.id !== id) return r;
          const moved = patch.upcoming !== undefined && patch.upcoming !== r.upcoming && patch.position === undefined;
          return { ...r, ...patch, position: moved ? topPosition(recipes, patch.upcoming!) : (patch.position ?? r.position), updatedAt: Date.now() };
        })
      );
    },
    async remove(id) {
      commit(recipes.filter((r) => r.id !== id));
    }
  };
}

const stem = (s: string) =>
  normalize(s)
    .split(' ')
    .map((w) => (w.length > 3 ? w.replace(/[sx]$/, '') : w))
    .join(' ');

/** Même aliment, au pluriel près : « Oignons » = « oignon ». */
export function sameFood(a: string, b: string): boolean {
  return stem(a) === stem(b);
}
