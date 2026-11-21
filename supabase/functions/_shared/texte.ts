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
  fruits: [
    // fruits
    'fruit', 'pomme', 'poire', 'banane', 'orange', 'citron', 'citron vert', 'pamplemousse', 'clementine', 'mandarine', 'fraise', 'framboise',
    'myrtille', 'mure', 'groseille', 'cassis', 'cerise', 'raisin', 'kiwi', 'mangue', 'ananas', 'melon', 'pasteque', 'peche', 'nectarine',
    'brugnon', 'abricot', 'prune', 'mirabelle', 'reine-claude', 'figue', 'grenade', 'litchi', 'fruit de la passion', 'papaye', 'kaki',
    'coing', 'rhubarbe', 'noix de coco', 'datte fraiche', 'physalis', 'goyave', 'avocat',
    // légumes
    'legume', 'tomate', 'tomate cerise', 'salade', 'laitue', 'batavia', 'roquette', 'mache', 'mesclun', 'endive', 'frisee', 'scarole',
    'carotte', 'courgette', 'aubergine', 'poivron', 'piment', 'concombre', 'cornichon frais', 'oignon', 'oignon rouge', 'ail', 'echalote',
    'pomme de terre', 'patate', 'patate douce', 'champignon', 'champignon de paris', 'cepe', 'girolle', 'brocoli', 'chou', 'chou-fleur',
    'chou fleur', 'chou rouge', 'chou de bruxelles', 'chou kale', 'epinard', 'haricot vert', 'haricot plat', 'petit pois frais', 'poireau',
    'radis', 'navet', 'betterave', 'celeri', 'celeri-rave', 'fenouil', 'artichaut', 'asperge', 'potiron', 'potimarron', 'courge',
    'butternut', 'citrouille', 'panais', 'topinambour', 'blette', 'cresson', 'pousse', 'germe de soja', 'mais doux', 'gingembre',
    'persil', 'basilic', 'coriandre', 'menthe', 'ciboulette', 'aneth', 'estragon', 'thym frais', 'romarin frais', 'herbes fraiches',
    'salade de fruits', 'crudite'
  ],
  boulangerie: [
    'pain', 'baguette', 'tradition', 'ficelle', 'batard', 'pain complet', 'pain aux cereales', 'pain de campagne', 'pain de mie', 'pain burger',
    'pain hamburger', 'pain hot dog', 'pain pita', 'pain de seigle', 'pain sans gluten', 'brioche', 'croissant', 'pain au chocolat',
    'chocolatine', 'pain aux raisins', 'chausson aux pommes', 'viennoiserie', 'biscotte', 'pain grille', 'cracotte', 'wasa', 'gressin',
    'tortilla', 'wrap', 'galette de ble', 'muffin anglais', 'bagel', 'focaccia', 'fougasse', 'tarte', 'flan patissier', 'eclair', 'gateau d\'anniversaire',
    'baba', 'chouquette', 'madeleine fraiche'
  ],
  boucherie: [
    'viande', 'boucherie', 'poulet', 'blanc de poulet', 'cuisse de poulet', 'aiguillette', 'pilon', 'dinde', 'canard', 'magret', 'pintade',
    'lapin', 'caille', 'boeuf', 'steak', 'steak hache', 'hache', 'bavette', 'entrecote', 'faux-filet', 'rumsteck', 'cote de boeuf',
    'bourguignon', 'pot-au-feu', 'pot au feu', 'carpaccio', 'tartare', 'roti', 'porc', 'filet mignon', 'echine', 'cote de porc',
    'travers', 'saucisse', 'chipolata', 'merguez', 'saucisse de toulouse', 'chair a saucisse', 'boudin', 'andouillette', 'veau', 'blanquette',
    'escalope', 'osso bucco', 'agneau', 'gigot', 'souris d\'agneau', 'cote d\'agneau', 'abats', 'foie', 'rognon',
    // charcuterie
    'jambon', 'jambon blanc', 'jambon cru', 'jambon de bayonne', 'lardon', 'bacon', 'saucisson', 'chorizo', 'salami', 'rosette', 'coppa',
    'pancetta', 'rillettes', 'terrine', 'mousse de canard', 'foie gras', 'knacki', 'saucisse de strasbourg', 'charcuterie', 'blanc de dinde',
    'cordon bleu', 'nugget de poulet',
    // poisson
    'poisson', 'poissonnerie', 'saumon', 'saumon fume', 'truite', 'truite fumee', 'cabillaud', 'colin', 'merlu', 'lieu', 'dorade', 'bar',
    'loup', 'sole', 'limande', 'lotte', 'maquereau', 'sardine fraiche', 'thon frais', 'espadon', 'raie', 'hareng', 'crevette', 'gambas',
    'langoustine', 'moule', 'huitre', 'coquille saint-jacques', 'saint-jacques', 'noix de saint-jacques', 'calamar', 'encornet', 'poulpe',
    'crabe', 'homard', 'bulot', 'tarama', 'surimi', 'fruits de mer', 'filet de poisson'
  ],
  frais: [
    'lait', 'lait demi-ecreme', 'lait entier', 'lait ecreme', 'lait d\'avoine', 'lait d\'amande', 'lait de soja', 'boisson vegetale',
    'yaourt', 'yogourt', 'yoghourt', 'yaourt grec', 'skyr', 'fromage blanc', 'petit suisse', 'faisselle', 'creme dessert', 'danette',
    'flan', 'mousse au chocolat', 'liegeois', 'riz au lait', 'dessert lacte', 'activia', 'actimel', 'kefir',
    'beurre', 'beurre doux', 'beurre demi-sel', 'margarine', 'creme', 'creme fraiche', 'creme liquide', 'creme epaisse', 'chantilly',
    'oeuf', 'oeufs', 'oeuf bio',
    'fromage', 'emmental', 'gruyere', 'comte', 'beaufort', 'mozzarella', 'burrata', 'parmesan', 'grana padano', 'pecorino', 'camembert',
    'brie', 'coulommiers', 'chevre', 'buche de chevre', 'roquefort', 'bleu', 'fourme d\'ambert', 'gorgonzola', 'reblochon', 'raclette',
    'tomme', 'morbier', 'mont d\'or', 'munster', 'maroilles', 'saint-nectaire', 'cantal', 'salers', 'mimolette', 'edam', 'gouda', 'cheddar',
    'feta', 'ricotta', 'mascarpone', 'boursin', 'kiri', 'babybel', 'vache qui rit', 'carre frais', 'saint moret', 'saint-moret', 'fromage rape',
    'rape', 'cancoillotte', 'halloumi',
    'pate feuilletee', 'pate brisee', 'pate sablee', 'pate a pizza', 'pate fraiche', 'ravioli frais', 'gnocchi', 'tortellini',
    'quenelle', 'houmous', 'guacamole', 'tzatziki', 'taboule', 'salade composee', 'carottes rapees', 'celeri remoulade', 'jus frais',
    'jus presse', 'tofu', 'levure fraiche', 'compote fraiche', 'traiteur', 'sandwich', 'quiche', 'pizza fraiche', 'hachis parmentier',
    'lasagnes fraiches', 'plat cuisine', 'soupe fraiche', 'gaspacho'
  ],
  epicerie: [
    // base
    'farine', 'maizena', 'fecule', 'sucre', 'sucre roux', 'sucre glace', 'cassonade', 'vergeoise', 'sel', 'gros sel', 'fleur de sel',
    'poivre', 'levure', 'levure chimique', 'bicarbonate', 'sucre vanille', 'vanille', 'arome', 'gelatine', 'agar-agar', 'pepites de chocolat',
    'chocolat patissier', 'chocolat noir', 'chocolat au lait', 'chocolat', 'cacao', 'poudre d\'amande', 'amande', 'noisette', 'noix',
    'noix de cajou', 'pistache', 'cacahuete', 'pignon', 'raisin sec', 'abricot sec', 'pruneau', 'datte', 'figue seche', 'fruit sec',
    'graine', 'graines de chia', 'graines de lin', 'sesame',
    // féculents
    'pate', 'pates', 'spaghetti', 'tagliatelle', 'penne', 'fusilli', 'coquillette', 'macaroni', 'farfalle', 'linguine', 'lasagne',
    'vermicelle', 'nouille', 'nouilles chinoises', 'ramen', 'riz', 'riz basmati', 'riz thai', 'riz rond', 'risotto', 'semoule', 'couscous',
    'boulgour', 'quinoa', 'ble', 'ebly', 'polenta', 'lentille', 'lentille corail', 'pois chiche', 'pois casse', 'haricot rouge',
    'haricot blanc', 'flageolet', 'puree en flocons', 'flocons d\'avoine', 'avoine',
    // condiments
    'huile', 'huile d\'olive', 'huile de tournesol', 'huile de colza', 'vinaigre', 'vinaigre balsamique', 'vinaigrette', 'moutarde',
    'ketchup', 'mayonnaise', 'sauce', 'sauce tomate', 'coulis de tomate', 'concentre de tomate', 'passata', 'pesto', 'sauce soja',
    'sauce barbecue', 'sauce samourai', 'harissa', 'tabasco', 'sriracha', 'nuoc-mam', 'cornichon', 'capre', 'olive', 'tapenade',
    'bouillon', 'cube', 'fond de veau', 'epice', 'curry', 'paprika', 'cumin', 'curcuma', 'cannelle', 'muscade', 'herbes de provence',
    'thym', 'laurier', 'origan', 'piment d\'espelette', 'ras el hanout', 'gingembre moulu', 'ail semoule',
    // conserves
    'conserve', 'boite', 'thon', 'sardine', 'maquereau en boite', 'miette de thon', 'tomates pelees', 'tomate pelee', 'mais', 'petit pois',
    'haricots verts en boite', 'champignons en boite', 'ratatouille', 'cassoulet', 'raviolis', 'chili', 'soupe', 'veloute', 'lait de coco',
    'lait concentre', 'compote', 'fruits au sirop', 'puree', 'confit de canard',
    // petit déjeuner et sucré
    'cafe', 'cafe moulu', 'cafe soluble', 'capsule', 'dosette', 'nespresso', 'senseo', 'the', 'tisane', 'infusion', 'chicoree', 'ricore',
    'chocolat en poudre', 'nesquik', 'poulain', 'banania', 'cereale', 'cereales', 'corn flakes', 'cornflakes', 'special k', 'chocapic', 'muesli', 'granola',
    'confiture', 'gelee', 'miel', 'pate a tartiner', 'nutella', 'sirop d\'erable', 'beurre de cacahuete', 'biscuit', 'gateau', 'gateaux',
    'petit beurre', 'prince', 'bn', 'oreo', 'pepito', 'madeleine', 'quatre-quarts', 'brownie', 'cookie', 'gaufre', 'crepe', 'pain d\'epices',
    'barre de cereales', 'bonbon', 'chewing-gum', 'sucette', 'dragee', 'kinder', 'smarties', 'm&m\'s', 'haribo', 'tablette', 'carambar',
    // apéritif
    'chips', 'pringles', 'crackers', 'tuc', 'biscuit aperitif', 'apericube', 'cacahuetes', 'pop-corn', 'popcorn', 'bretzel',
    // monde et divers
    'galette', 'galette de riz', 'galette de sarrasin', 'tortilla chips', 'nachos', 'sauce salsa', 'kit fajitas', 'feuille de riz',
    'lait en poudre', 'petit pot', 'bledina', 'lait infantile', 'croquette', 'patee', 'litiere', 'nourriture chat',
    'nourriture chien', 'whiskas', 'friskies'
  ],
  surgeles: [
    'surgele', 'surgelee', 'congele', 'glace', 'glaces', 'creme glacee', 'sorbet', 'esquimau', 'cornetto', 'magnum', 'buche glacee',
    'frite', 'frites', 'potatoes', 'pomme noisette', 'pizza', 'poelee', 'nugget', 'poisson pane', 'cordon bleu surgele', 'legumes surgeles',
    'epinards surgeles', 'petits pois surgeles', 'haricots verts surgeles', 'glacon', 'glacons', 'gratin surgele', 'lasagnes surgelees',
    'fruits rouges surgeles', 'croissants surgeles', 'picard', 'tarte surgelee', 'steak hache surgele', 'crevettes surgelees'
  ],
  boissons: [
    'eau', 'eau plate', 'eau gazeuse', 'eau petillante', 'evian', 'volvic', 'cristaline', 'vittel', 'contrex', 'badoit', 'perrier',
    'san pellegrino', 'saint-yorre', 'hepar', 'jus', 'jus d\'orange', 'jus de pomme', 'jus de raisin', 'nectar', 'smoothie', 'tropicana',
    'soda', 'coca', 'coca-cola', 'coca cola', 'pepsi', 'fanta', 'sprite', 'orangina', 'schweppes', 'oasis', 'ice tea', 'lipton',
    'limonade', 'diabolo', 'sirop', 'grenadine', 'sirop de menthe', 'red bull', 'boisson energisante', 'biere', 'bieres', 'biere sans alcool',
    'heineken', 'kronenbourg', 'leffe', 'grimbergen', 'desperados', 'pelforth', 'vin', 'vin rouge', 'vin blanc', 'vin rose', 'rose',
    'bordeaux', 'bourgogne', 'cotes du rhone', 'beaujolais', 'muscadet', 'chablis', 'sancerre', 'champagne', 'cremant', 'prosecco',
    'mousseux', 'cidre', 'poire williams', 'pastis', 'ricard', 'whisky', 'rhum', 'vodka', 'gin', 'tequila', 'cognac', 'armagnac',
    'calvados', 'porto', 'martini', 'muscat', 'liqueur', 'aperitif', 'apero', 'kir', 'creme de cassis', 'get 27', 'baileys', 'limoncello',
    'tonic'
  ],
  hygiene: [
    'hygiene', 'shampoing', 'shampooing', 'apres-shampoing', 'apres shampoing', 'masque cheveux', 'savon', 'savon liquide', 'gel douche',
    'douche', 'bain moussant', 'dentifrice', 'brosse a dent', 'brosse a dents', 'fil dentaire', 'bain de bouche', 'deodorant', 'deo',
    'coton', 'coton-tige', 'coton tige', 'disque demaquillant', 'demaquillant', 'lingette', 'lingettes', 'rasoir', 'lame de rasoir',
    'mousse a raser', 'gel a raser', 'creme solaire', 'apres-soleil', 'creme hydratante', 'creme pour les mains', 'lait corporel',
    'baume a levres', 'maquillage', 'mascara', 'vernis', 'dissolvant', 'parfum', 'eau de toilette', 'laque', 'gel coiffant', 'cire',
    'coloration', 'elastique', 'mouchoir', 'mouchoirs', 'kleenex', 'couche', 'couches', 'pampers', 'lingettes bebe', 'liniment',
    'papier toilette', 'pq', 'lotus', 'serviette hygienique', 'protege-slip', 'tampon', 'coupe menstruelle', 'pansement', 'compresse',
    'serum physiologique', 'doliprane', 'paracetamol', 'thermometre', 'preservatif', 'test de grossesse'
  ],
  maison: [
    'lessive', 'capsules de lessive', 'ariel', 'skip', 'le chat', 'adoucissant', 'soupline', 'detachant', 'vanish', 'liquide vaisselle',
    'produit vaisselle', 'pastille lave-vaisselle', 'pastilles lave-vaisselle', 'tablette lave-vaisselle', 'lave-vaisselle', 'sel regenerant',
    'liquide de rincage', 'finish', 'sun', 'eponge', 'eponges', 'grattoir', 'serpillere', 'balai', 'balayette', 'pelle', 'seau', 'chiffon',
    'microfibre', 'gants menage', 'gants de menage', 'sac poubelle', 'sacs poubelle', 'poubelle', 'essuie-tout', 'essuie tout', 'sopalin',
    'papier absorbant', 'papier alu', 'papier aluminium', 'aluminium', 'film', 'film alimentaire', 'papier cuisson', 'sulfurise',
    'sac congelation', 'sachet congelation', 'boite hermetique', 'javel', 'eau de javel', 'nettoyant', 'nettoyant sol', 'nettoyant vitres',
    'produit vitres', 'anticalcaire', 'vinaigre blanc', 'cristaux de soude', 'savon noir', 'bicarbonate de soude', 'desinfectant',
    'degraissant', 'destop', 'deboucheur', 'wc', 'canard wc', 'bloc wc', 'harpic', 'cif', 'mr propre', 'monsieur propre', 'ajax', 'st marc',
    'saint marc', 'febreze', 'desodorisant', 'bougie', 'allumette', 'briquet', 'pile', 'piles', 'ampoule', 'ampoules', 'sac aspirateur',
    'insecticide', 'anti-moustique', 'raid', 'filtre a cafe', 'charbon', 'allume-feu', 'serviette en papier', 'serviettes en papier',
    'nappe', 'assiette en carton', 'gobelet', 'paille', 'scotch', 'ruban adhesif', 'stylo', 'cahier', 'enveloppe', 'timbre', 'cartouche d\'encre'
  ]
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
      const m = new RegExp(`[ '-]${w.replace(/ /g, '(?:s|x)? ')}(s|x)?[ ,.'-]`).exec(n);
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
