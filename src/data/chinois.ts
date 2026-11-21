import { normalize } from './rayons';

/** Rayons du magasin chinois, dans l'ordre d'un parcours classique. */
export const RAYONS_CHINOIS = [
  { id: 'ch_legumes', label: 'Fruits et légumes d’Asie', emoji: '🥬', tint: '#E2F6EC', ink: '#2E6B3A' },
  { id: 'ch_riz', label: 'Riz et nouilles', emoji: '🍜', tint: '#FFF0C9', ink: '#7A5300' },
  { id: 'ch_sauces', label: 'Sauces et épices', emoji: '🥢', tint: '#FDE3DA', ink: '#9C3A1E' },
  { id: 'ch_frais', label: 'Frais', emoji: '🧊', tint: '#DDEBFA', ink: '#2A5D99' },
  { id: 'ch_surgeles', label: 'Surgelés', emoji: '❄️', tint: '#DCF1F7', ink: '#1C6479' },
  { id: 'ch_snacks', label: 'Snacks et boissons', emoji: '🍡', tint: '#F4E1F0', ink: '#7D2E6B' },
  { id: 'ch_maison', label: 'Maison et vaisselle', emoji: '🏮', tint: '#ECE7E1', ink: '#5A4E42' },
  { id: 'ch_autre', label: 'Autre', emoji: '🛍️', tint: '#E8ECEB', ink: '#4B5654' }
];

const KEYWORDS: Record<string, string[]> = {
  ch_legumes: ['pak choi', 'pak-choi', 'bok choy', 'chou chinois', 'gingembre', 'citronnelle', 'galanga', 'coriandre', 'ciboule', 'oignon vert',
    'piment', 'piment oiseau', 'mangue', 'litchi', 'longane', 'ramboutan', 'fruit du dragon', 'pitaya', 'durian', 'jacquier', 'papaye',
    'goyave', 'kumquat', 'kaki', 'nashi', 'pousse de bambou', 'germe de soja', 'pousse de soja', 'radis noir', 'daikon', 'lotus',
    'racine de lotus', 'shiitake', 'champignon noir', 'enoki', 'pleurote', 'basilic thai', 'menthe', 'feuille de kaffir', 'combava',
    'patate douce', 'taro', 'igname', 'gombo', 'aubergine thai', 'liseron', 'mais', 'avocat', 'citron vert', 'legume', 'fruit'],
  ch_riz: ['riz', 'riz thai', 'riz jasmin', 'riz gluant', 'riz basmati', 'riz japonais', 'riz a sushi', 'nouille', 'nouilles', 'udon',
    'soba', 'ramen', 'vermicelle', 'vermicelles de riz', 'pho', 'nouilles de riz', 'nouilles instantanees', 'nouilles aux oeufs', 'mien',
    'feuille de riz', 'galette de riz', 'feuilles de brick', 'pate a raviolis', 'farine de riz', 'farine de riz gluant', 'tapioca',
    'perles de tapioca', 'fecule', 'panko', 'chapelure'],
  ch_sauces: ['sauce', 'sauce soja', 'soja', 'sauce soja sucree', 'kikkoman', 'nuoc-mam', 'nuoc mam', 'sauce poisson', 'sauce huitre',
    'sauce hoisin', 'hoisin', 'sauce teriyaki', 'teriyaki', 'sriracha', 'sauce piquante', 'sambal', 'pate de curry', 'curry', 'curry vert',
    'curry rouge', 'gochujang', 'miso', 'mirin', 'vinaigre de riz', 'sake', 'huile de sesame', 'sesame', 'graines de sesame', 'wasabi',
    'cinq epices', 'badiane', 'anis etoile', 'poivre de sichuan', 'glutamate', 'bouillon', 'lait de coco', 'creme de coco', 'sucre de palme',
    'pate de crevette', 'sauce aigre-douce', 'ketjap', 'nori', 'algue', 'algues', 'furikake', 'dashi', 'tamarin'],
  ch_frais: ['tofu', 'tofu soyeux', 'tofu frit', 'kimchi', 'boulette', 'boulettes de poisson', 'boulettes de boeuf', 'pate de poisson',
    'surimi', 'nem frais', 'rouleau de printemps', 'bao frais', 'lait de soja', 'oeuf de cane', 'oeufs de cent ans', 'oeuf', 'oeufs',
    'canard laque', 'porc laque', 'char siu', 'saucisse chinoise', 'lap cheong', 'viande', 'poulet', 'porc', 'boeuf', 'poisson', 'tempeh'],
  ch_surgeles: ['surgele', 'surgeles', 'gyoza', 'gyozas', 'nem', 'nems', 'samoussa', 'raviolis', 'ravioli', 'dim sum', 'har gow',
    'siu mai', 'bao', 'baozi', 'crevette', 'crevettes', 'calamar', 'seiche', 'poulpe', 'crabe', 'edamame', 'mochi glace', 'glace',
    'galette a l\'oignon', 'boulettes surgelees', 'brioche vapeur'],
  ch_snacks: ['chips de crevette', 'chips', 'biscuit', 'biscuits', 'pocky', 'mochi', 'mochis', 'bonbon', 'bonbons', 'gateau de lune',
    'the', 'the vert', 'the jasmin', 'the oolong', 'matcha', 'bubble tea', 'boisson', 'jus', 'lait de coco a boire', 'boisson aloe',
    'aloe vera', 'ramune', 'soda', 'biere', 'biere chinoise', 'tsingtao', 'sake a boire', 'alcool de riz', 'cacahuete', 'noix de cajou',
    'graines de pasteque', 'fruits secs', 'mangue sechee', 'gelee', 'konjac', 'snack'],
  ch_maison: ['baguette', 'baguettes', 'bol', 'bols', 'assiette', 'tasse', 'theiere', 'cuillere', 'wok', 'cuiseur', 'cuiseur a riz',
    'panier vapeur', 'cuit vapeur', 'couteau', 'planche', 'passoire', 'ecumoire', 'louche', 'encens', 'lanterne', 'sac', 'boite',
    'vaisselle', 'baguettes jetables', 'eventail', 'chaussons']
};

export function guessRayonChinois(name: string): string {
  const n = ` ${normalize(name)} `;
  let best = { id: 'ch_autre', pos: Infinity, len: 0 };
  for (const [id, words] of Object.entries(KEYWORDS)) {
    for (const w of words) {
      const m = new RegExp(`[ '-]${w.replace(/ /g, '(?:s|x)? ')}(s|x)?[ ,.'-]`).exec(n);
      if (!m) continue;
      if (m.index < best.pos || (m.index === best.pos && w.length > best.len)) best = { id, pos: m.index, len: w.length };
    }
  }
  return best.id;
}
