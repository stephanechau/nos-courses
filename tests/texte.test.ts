import { describe, expect, it } from 'vitest';
import { guessRayon, parseSpoken } from '../supabase/functions/_shared/texte.ts';

describe('parseSpoken', () => {
  it('retire la formule et les articles', () => {
    expect(parseSpoken('Rajoute moi de la farine sur la liste de courses')).toEqual(['Farine']);
    expect(parseSpoken('Rajoute pâtes à ma liste de courses')).toEqual(['Pâtes']);
  });
  it('sépare plusieurs articles', () => {
    expect(parseSpoken('du lait, des œufs et du pain')).toEqual(['Lait', 'Œufs', 'Pain']);
  });
  it('garde un texte simple', () => {
    expect(parseSpoken('farine')).toEqual(['Farine']);
    expect(parseSpoken('  ')).toEqual([]);
  });
});

describe('guessRayon', () => {
  it.each([
    ['Farine', 'epicerie'],
    ['Pâtes', 'epicerie'],
    ['Tomates', 'fruits'],
    ['Pommes de terre', 'fruits'],
    ['Lait demi-écrémé', 'frais'],
    ['Œufs', 'frais'],
    ['Pain de mie', 'boulangerie'],
    ["Jus d'orange", 'boissons'],
    ['Papier toilette', 'hygiene'],
    ['Lessive', 'maison'],
    ['Thon en boîte', 'epicerie'],
    ['Truc inconnu', 'autre'],
    // dictionnaire enrichi
    ['Canard WC', 'maison'],
    ['Pastilles lave-vaisselle', 'maison'],
    ['Eau de javel', 'maison'],
    ['Lait de coco', 'epicerie'],
    ['Riz au lait', 'frais'],
    ['Crème solaire', 'hygiene'],
    ['Crème fraîche', 'frais'],
    ['Glace vanille', 'surgeles'],
    ['Pommes noisettes', 'surgeles'],
    ['Steak haché', 'boucherie'],
    ['Saumon fumé', 'boucherie'],
    ['Thon frais', 'boucherie'],
    ['Courgettes', 'fruits'],
    ['Choux de Bruxelles', 'fruits'],
    ['Mozzarella', 'frais'],
    ['Pain au chocolat', 'boulangerie'],
    ["Pain d'épices", 'epicerie'],
    ['Sauce soja', 'epicerie'],
    ['Tomates pelées', 'epicerie'],
    ['Capsules Nespresso', 'epicerie'],
    ['Coca-Cola', 'boissons'],
    ['Vin rouge', 'boissons'],
    ['Bière', 'boissons'],
    ['Eau gazeuse', 'boissons'],
    ['Mouchoirs', 'hygiene'],
    ['Couches', 'hygiene'],
    ['Sacs poubelle', 'maison'],
    ['Piles', 'maison'],
    ['Yaourt à la fraise', 'frais'],
    ['Croquettes pour le chat', 'epicerie'],
    ['Frites', 'surgeles']
  ])('%s → %s', (name, rayon) => {
    expect(guessRayon(name)).toBe(rayon);
  });
});
