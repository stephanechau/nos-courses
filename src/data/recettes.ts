import { CARNET, type CarnetRecette } from './carnet';
import { normalize } from './rayons';

export interface Ingredient {
  name: string;
  qty?: string;
  /** Quantité d'origine, gardée quand on a ajusté les quantités. */
  base?: string;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  ingredients: Ingredient[];
  /** Lien vers la recette complète, s'il y en a un. */
  url?: string;
  /** Étapes de préparation. */
  steps?: string[];
  /** Dans « Prochaines recettes » (sinon dans la bibliothèque). */
  upcoming: boolean;
  /** Ordre dans sa rubrique : le plus petit en haut. */
  position: number;
  updatedAt: number;
}

export type NewRecipe = Pick<Recipe, 'name' | 'emoji' | 'ingredients' | 'url' | 'upcoming' | 'steps'>;

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
  steps?: string[];
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

const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

/** Le nombre au début d'une quantité : « 1,5 kg » → { value: 1.5, rest: « kg » }. */
export function splitQty(qty?: string): { value: number; rest: string } | undefined {
  const m = /^\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|[½¼¾⅓⅔])\s*(.*)$/.exec(qty ?? '');
  if (!m) return undefined;
  const raw = m[1].replace(/\s/g, '');
  let value: number;
  if (FRACTIONS[raw] !== undefined) value = FRACTIONS[raw];
  else if (raw.includes('/')) {
    const [a, b] = raw.split('/').map(Number);
    value = b ? a / b : NaN;
  } else value = Number(raw.replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return { value, rest: m[2].trim() };
}

const WEIGHTS = /^(?:kg|g|mg|cl|ml|dl|l)$/i;

/** Arrondi lisible : grammes et centilitres « ronds », objets entiers. */
function roundNice(v: number, rest: string): string {
  let r: number;
  if (WEIGHTS.test(rest)) {
    if (v >= 100) r = Math.round(v / 10) * 10;
    else if (v >= 20) r = Math.round(v / 5) * 5;
    else if (v >= 2) r = Math.round(v);
    else r = Math.round(v * 10) / 10;
  } else {
    r = v < 0.75 ? Math.round(v * 2) / 2 : Math.max(1, Math.round(v));
  }
  return String(r).replace('.', ',');
}

/** Multiplie une quantité : « 250 g » × 1,6 → « 400 g ». Les quantités sans nombre ne bougent pas. */
export function scaleQty(qty: string | undefined, factor: number): string | undefined {
  if (!qty || factor === 1) return qty;
  const s = splitQty(qty);
  if (!s) return qty;
  return [roundNice(s.value * factor, s.rest), s.rest].filter(Boolean).join(' ');
}

/** Coefficient quand on remplace la quantité « avant » par « après » (même unité). */
export function factorFrom(before: string | undefined, after: string): number | undefined {
  const a = splitQty(before);
  const b = splitQty(after);
  if (!a || !b) return undefined;
  return b.value / a.value;
}

/** Toutes les quantités recalculées quand l'ingrédient n° index passe à « after ». Undefined si ce n'est pas un nombre. */
export function rescale(list: Ingredient[], index: number, after: string): Ingredient[] | undefined {
  const target = list[index];
  if (!target) return undefined;
  const factor = factorFrom(target.base ?? target.qty, after);
  if (!factor || !Number.isFinite(factor)) return undefined;
  const typed = splitQty(after)!;
  const unit = splitQty(target.base ?? target.qty)!.rest;
  return list.map((i, k) => {
    const base = i.base ?? i.qty;
    if (!splitQty(base)) return i;
    const qty = k === index ? [String(typed.value).replace('.', ','), typed.rest || unit].filter(Boolean).join(' ') : scaleQty(base, factor);
    return Math.abs(factor - 1) < 1e-9 ? { name: i.name, qty: base } : { name: i.name, qty, base };
  });
}

/** Coefficient actuel par rapport à l'origine (1 si rien n'a été ajusté). */
export function currentFactor(list: Ingredient[]): number {
  for (const i of list) if (i.base) {
    const f = factorFrom(i.base, i.qty ?? '');
    if (f) return f;
  }
  return 1;
}

/** Revient aux quantités d'origine. */
export function resetQty(list: Ingredient[]): Ingredient[] {
  return list.map((i) => (i.base ? { name: i.name, qty: i.base } : i));
}
