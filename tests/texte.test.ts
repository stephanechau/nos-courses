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
    ['Truc inconnu', 'autre']
  ])('%s → %s', (name, rayon) => {
    expect(guessRayon(name)).toBe(rayon);
  });
});
