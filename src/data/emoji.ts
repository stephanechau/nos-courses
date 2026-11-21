import { normalize } from './rayons';

/** Un emoji par produit, pour le style Bulles. Le premier mot reconnu l'emporte. */
const EMOJI: [string, string][] = [
  ['pomme de terre', '🥔'], ['patate douce', '🍠'], ['patate', '🥔'], ['pomme', '🍎'], ['poire', '🍐'], ['banane', '🍌'], ['orange', '🍊'],
  ['clementine', '🍊'], ['mandarine', '🍊'], ['citron', '🍋'], ['fraise', '🍓'], ['framboise', '🍓'], ['myrtille', '🫐'], ['cerise', '🍒'],
  ['raisin', '🍇'], ['kiwi', '🥝'], ['mangue', '🥭'], ['ananas', '🍍'], ['melon', '🍈'], ['pasteque', '🍉'], ['peche', '🍑'],
  ['abricot', '🍑'], ['avocat', '🥑'], ['noix de coco', '🥥'], ['lait de coco', '🥥'], ['tomate', '🍅'], ['salade', '🥗'], ['laitue', '🥬'],
  ['pak choi', '🥬'], ['chou', '🥬'], ['epinard', '🥬'], ['carotte', '🥕'], ['courgette', '🥒'], ['concombre', '🥒'], ['cornichon', '🥒'],
  ['aubergine', '🍆'], ['poivron', '🫑'], ['piment', '🌶️'], ['sriracha', '🌶️'], ['oignon', '🧅'], ['echalote', '🧅'], ['ail', '🧄'],
  ['champignon', '🍄'], ['brocoli', '🥦'], ['mais', '🌽'], ['haricot', '🫘'], ['petit pois', '🫛'], ['edamame', '🫛'], ['gingembre', '🫚'],
  ['persil', '🌿'], ['basilic', '🌿'], ['coriandre', '🌿'], ['menthe', '🌿'], ['citronnelle', '🌿'], ['herbe', '🌿'],
  ['pain de mie', '🍞'], ['pain', '🥖'], ['baguette', '🥖'], ['croissant', '🥐'], ['brioche', '🍞'], ['bagel', '🥯'], ['crepe', '🥞'],
  ['gaufre', '🧇'], ['lait', '🥛'], ['yaourt', '🥛'], ['fromage', '🧀'], ['emmental', '🧀'], ['comte', '🧀'], ['mozzarella', '🧀'],
  ['camembert', '🧀'], ['raclette', '🧀'], ['parmesan', '🧀'], ['beurre', '🧈'], ['creme', '🥛'], ['oeuf', '🥚'], ['tofu', '🫘'],
  ['poulet', '🍗'], ['dinde', '🍗'], ['canard', '🦆'], ['steak', '🥩'], ['boeuf', '🥩'], ['viande', '🥩'], ['agneau', '🥩'], ['porc', '🥓'],
  ['lardon', '🥓'], ['bacon', '🥓'], ['jambon', '🍖'], ['saucisse', '🌭'], ['merguez', '🌭'], ['saucisson', '🍖'], ['poisson', '🐟'],
  ['saumon', '🐟'], ['thon', '🐟'], ['cabillaud', '🐟'], ['sardine', '🐟'], ['nuoc', '🐟'], ['crevette', '🦐'], ['moule', '🦪'],
  ['huitre', '🦪'], ['crabe', '🦀'], ['calamar', '🦑'], ['poulpe', '🐙'],
  ['farine', '🌾'], ['sucre', '🍬'], ['sel', '🧂'], ['poivre', '🧂'], ['epice', '🧂'], ['pates', '🍝'], ['pate', '🍝'], ['spaghetti', '🍝'],
  ['nouille', '🍜'], ['ramen', '🍜'], ['udon', '🍜'], ['vermicelle', '🍜'], ['riz', '🍚'], ['semoule', '🍚'], ['huile', '🫒'], ['olive', '🫒'],
  ['vinaigre', '🫙'], ['moutarde', '🫙'], ['sauce', '🫙'], ['ketchup', '🍅'], ['mayonnaise', '🫙'], ['confiture', '🍯'], ['miel', '🍯'],
  ['nutella', '🍫'], ['chocolat', '🍫'], ['cacao', '🍫'], ['cafe', '☕'], ['capsule', '☕'], ['the', '🍵'], ['matcha', '🍵'], ['tisane', '🍵'],
  ['cereale', '🥣'], ['muesli', '🥣'], ['biscuit', '🍪'], ['cookie', '🍪'], ['gateau', '🍰'], ['tarte', '🥧'], ['bonbon', '🍬'],
  ['chips', '🥔'], ['cacahuete', '🥜'], ['amande', '🌰'], ['noix', '🌰'], ['noisette', '🌰'], ['conserve', '🥫'], ['soupe', '🥣'],
  ['mochi', '🍡'], ['gyoza', '🥟'], ['ravioli', '🥟'], ['dim sum', '🥟'], ['nem', '🌯'], ['bao', '🥟'], ['sushi', '🍣'], ['algue', '🌿'],
  ['nori', '🌿'], ['pizza', '🍕'], ['frite', '🍟'], ['glace', '🍨'], ['sorbet', '🍧'], ['glacon', '🧊'], ['surgele', '❄️'],
  ['eau', '💧'], ['jus', '🧃'], ['soda', '🥤'], ['coca', '🥤'], ['sirop', '🧃'], ['biere', '🍺'], ['vin', '🍷'], ['champagne', '🍾'],
  ['cidre', '🍏'], ['whisky', '🥃'], ['rhum', '🥃'], ['sake', '🍶'],
  ['papier toilette', '🧻'], ['essuie-tout', '🧻'], ['sopalin', '🧻'], ['mouchoir', '🤧'], ['savon', '🧼'], ['gel douche', '🧴'],
  ['shampoing', '🧴'], ['creme solaire', '🧴'], ['dentifrice', '🪥'], ['brosse a dent', '🪥'], ['couche', '👶'], ['rasoir', '🪒'],
  ['lessive', '🧺'], ['adoucissant', '🧺'], ['eponge', '🧽'], ['liquide vaisselle', '🧽'], ['lave-vaisselle', '🍽️'], ['javel', '🧪'],
  ['nettoyant', '🧪'], ['canard wc', '🚽'], ['wc', '🚽'], ['sac poubelle', '🗑️'], ['pile', '🔋'], ['ampoule', '💡'], ['bougie', '🕯️'],
  ['croquette', '🐾'], ['litiere', '🐾'], ['chat', '🐱'], ['chien', '🐶'], ['fleur', '💐'], ['bol', '🥣'], ['baguettes', '🥢']
];

export function emojiFor(name: string, fallback: string): string {
  const n = ` ${normalize(name)} `;
  let best = { e: fallback, pos: Infinity, len: 0 };
  for (const [w, e] of EMOJI) {
    const m = new RegExp(`[ '-]${w.replace(/ /g, '(?:s|x)? ')}(s|x)?[ ,.'-]`).exec(n);
    if (m && (m.index < best.pos || (m.index === best.pos && w.length > best.len))) best = { e, pos: m.index, len: w.length };
  }
  return best.e;
}
