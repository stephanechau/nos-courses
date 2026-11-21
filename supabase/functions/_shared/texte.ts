// Code partagé entre l'app et les fonctions Supabase (aucune dépendance).

export type RayonId =
  | 'fruits'
  | 'frais'
  | 'boucherie'
  | 'boulangerie'
  | 'epicerie'
  | 'surgeles'
  | 'boissons'
  | 'hygiene'
  | 'maison'
  | 'autre';

const KEYWORDS: Record<Exclude<RayonId, 'autre'>, string[]> = {
  fruits: ['pomme', 'poire', 'banane', 'orange', 'citron', 'fraise', 'raisin', 'kiwi', 'mangue', 'ananas', 'melon', 'pasteque', 'peche', 'abricot', 'cerise', 'clementine', 'mandarine', 'avocat', 'tomate', 'salade', 'laitue', 'carotte', 'courgette', 'aubergine', 'poivron', 'concombre', 'oignon', 'ail', 'echalote', 'pomme de terre', 'patate', 'champignon', 'brocoli', 'chou', 'epinard', 'haricot vert', 'poireau', 'radis', 'persil', 'basilic', 'coriandre', 'menthe', 'legume', 'fruit'],
  boulangerie: ['pain', 'baguette', 'brioche', 'croissant', 'viennoiserie', 'pain de mie', 'biscotte'],
  boucherie: ['poulet', 'boeuf', 'steak', 'viande', 'porc', 'veau', 'agneau', 'dinde', 'saucisse', 'merguez', 'jambon', 'lardon', 'poisson', 'saumon', 'cabillaud', 'thon frais', 'crevette', 'escalope', 'roti', 'hache'],
  frais: ['lait', 'yaourt', 'yogourt', 'fromage', 'beurre', 'creme', 'oeuf', 'emmental', 'gruyere', 'comte', 'mozzarella', 'parmesan', 'camembert', 'chevre', 'compote', 'dessert', 'pate feuilletee', 'pate brisee', 'jus frais'],
  epicerie: ['farine', 'sucre', 'sel', 'poivre', 'pate', 'pates', 'spaghetti', 'penne', 'riz', 'semoule', 'lentille', 'pois chiche', 'huile', 'vinaigre', 'moutarde', 'ketchup', 'mayonnaise', 'conserve', 'thon', 'sauce', 'cafe', 'the', 'chocolat', 'cereale', 'confiture', 'miel', 'biscuit', 'gateau', 'levure', 'epice', 'bouillon', 'chips', 'nutella', 'muesli', 'compote'],
  surgeles: ['surgele', 'glace', 'frite', 'pizza', 'poelee', 'nugget'],
  boissons: ['eau', 'jus', 'soda', 'coca', 'limonade', 'biere', 'vin', 'sirop', 'cidre', 'champagne'],
  hygiene: ['shampoing', 'shampooing', 'savon', 'gel douche', 'dentifrice', 'brosse a dent', 'deodorant', 'coton', 'rasoir', 'creme solaire', 'mouchoir', 'couche', 'papier toilette', 'serviette hygienique', 'tampon'],
  maison: ['lessive', 'adoucissant', 'liquide vaisselle', 'eponge', 'sac poubelle', 'essuie-tout', 'sopalin', 'papier alu', 'film', 'javel', 'nettoyant', 'pile', 'ampoule']
};

export const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Devine le rayon d'un article d'après son nom.
 * Le premier mot reconnu l'emporte (« jus d'orange » → boissons),
 * et à position égale le mot-clé le plus long (« pomme de terre »).
 */
export function guessRayon(name: string): RayonId {
  const n = ` ${normalize(name)} `;
  let best: { id: RayonId; pos: number; len: number } = { id: 'autre', pos: Infinity, len: 0 };
  for (const [id, words] of Object.entries(KEYWORDS) as [RayonId, string[]][]) {
    for (const w of words) {
      // début de mot, pluriel toléré (pâtes, tomates, œufs…)
      const m = new RegExp(`[ '-]${w}(s|x)?[ ,.'-]`).exec(n);
      if (!m) continue;
      if (m.index < best.pos || (m.index === best.pos && w.length > best.len)) best = { id, pos: m.index, len: w.length };
    }
  }
  return best.id;
}

const LEADING = /^(?:(?:est-ce que tu peux|peux-tu|tu peux)\s+)?(?:ajoute(?:r|z)?|rajoute(?:r|z)?|mets?|mettre|il faut|il manque|acheter)\s+(?:moi\s+|nous\s+)?/i;
const TRAILING = /\s+(?:à|a|sur|dans)\s+(?:la|ma|notre)\s+liste(?:\s+de\s+courses)?\s*$/i;
const ARTICLE = /^(?:du|de la|de l'|des|de|d'|le|la|les|l'|un|une)\s*/i;

/**
 * Transforme une phrase dictée en articles :
 * « Rajoute de la farine et des pâtes à la liste » → ["farine", "pâtes"].
 */
export function parseSpoken(text: string): string[] {
  let t = text.trim().replace(/[.!?]+$/, '');
  t = t.replace(LEADING, '').replace(TRAILING, '');
  return t
    .split(/\s*(?:,|\bet\b|\bpuis\b)\s*/i)
    .map((p) => p.trim().replace(ARTICLE, '').trim())
    .filter((p) => p.length > 0)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
}
