import { describe, expect, it } from 'vitest';
import { CARNET } from '../src/data/carnet';
import { findInCarnet, parseIngredientLine, suggestFromCarnet } from '../src/data/recettes';

describe('carnet', () => {
  it('contient au moins 150 plats bien formés', () => {
    expect(CARNET.length).toBeGreaterThanOrEqual(150);
    for (const r of CARNET) {
      expect(r.name, r.name).toBeTruthy();
      expect(r.emoji, r.name).toBeTruthy();
      expect(r.ingredients.length, r.name).toBeGreaterThan(0);
      for (const i of r.ingredients) expect(i.name, r.name).toBeTruthy();
    }
  });
  it('n’a pas de doublons', () => {
    const names = CARNET.map((r) => r.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });
  it('retrouve un plat par son nom ou un autre nom', () => {
    expect(findInCarnet('lasagnes')?.name).toBe('Lasagnes');
    expect(findInCarnet('Curry de poulet')?.name).toBe('Poulet au curry');
    expect(findInCarnet('bolognaise')?.name).toBe('Spaghetti bolognaise');
    expect(findInCarnet('pot au feu')?.name).toBe('Pot-au-feu');
    expect(findInCarnet('les lasagnes de maman')?.name).toBe('Lasagnes');
    expect(findInCarnet('truc inconnu')).toBeUndefined();
  });
  it('suggère des plats en tapant', () => {
    expect(suggestFromCarnet('tarti').map((r) => r.name)).toContain('Tartiflette');
    expect(suggestFromCarnet('pou').length).toBeGreaterThan(0);
  });
});

describe('lecture des lignes d’ingrédients', () => {
  const cases: [string, string, string | undefined][] = [
    ['250 g de pâtes à lasagne', 'Pâtes à lasagne', '250 g'],
    ['2 oignons', 'Oignons', '2'],
    ['1 pincée de sel', 'Sel', '1 pincée'],
    ['sel, poivre', 'Sel, poivre', undefined],
    ['20 cl de crème fraîche', 'Crème fraîche', '20 cl'],
    ['3 gousses d\'ail', 'Ail', '3 gousses'],
    ['1/2 citron', 'Citron', '1/2'],
    ['2 c. à soupe d\'huile d\'olive', 'Huile d\'olive', '2 c. à soupe'],
    ['500g de boeuf haché', 'Boeuf haché', '500 g'],
    ['1 l de lait', 'Lait', '1 l'],
    ['4 tranches de jambon (blanc)', 'Jambon', '4 tranches'],
    ['lardons', 'Lardons', undefined],
    ['1 c. à café de cumin', 'Cumin', '1 c. à café'],
    ['1 cuillère à café de sucre', 'Sucre', '1 cuillère à café']
  ];
  for (const [line, name, qty] of cases)
    it(line, () => {
      expect(parseIngredientLine(line)).toEqual({ name, qty });
    });
});

import { factorFrom, scaleQty } from '../src/data/recettes';
describe('produit en croix', () => {
  it('calcule le coefficient', () => {
    expect(factorFrom('500 g', '800 g')).toBeCloseTo(1.6);
    expect(factorFrom('500 g', '800')).toBeCloseTo(1.6);
    expect(factorFrom('1,2 kg', '1,8 kg')).toBeCloseTo(1.5);
    expect(factorFrom('pincée', '2')).toBeUndefined();
  });
  it('arrondit joliment', () => {
    expect(scaleQty('250 g', 1.6)).toBe('400 g');
    expect(scaleQty('1', 1.6)).toBe('2');
    expect(scaleQty('50 cl', 1.6)).toBe('80 cl');
    expect(scaleQty('3 gousses', 1.6)).toBe('5 gousses');
    expect(scaleQty('1,2 kg', 1.5)).toBe('1,8 kg');
    expect(scaleQty('1 pot', 0.5)).toBe('0,5 pot');
    expect(scaleQty('1 botte', 1.6)).toBe('2 botte');
    expect(scaleQty('1/2 pot', 2)).toBe('1 pot');
    expect(scaleQty(undefined, 2)).toBeUndefined();
    expect(scaleQty('2 c. à soupe', 1.5)).toBe('3 c. à soupe');
  });
});

import { currentFactor, rescale, resetQty } from '../src/data/recettes';
describe('ajuster une recette', () => {
  const ings = [
    { name: 'Bœuf haché', qty: '500 g' },
    { name: 'Pâtes', qty: '250 g' },
    { name: 'Oignon', qty: '1' },
    { name: 'Sel' }
  ];
  it('recalcule tout à partir d’un ingrédient', () => {
    const r = rescale(ings, 0, '800')!;
    expect(r.map((i) => i.qty)).toEqual(['800 g', '400 g', '2', undefined]);
    expect(currentFactor(r)).toBeCloseTo(1.6);
    // Un second ajustement repart des quantités d'origine.
    const r2 = rescale(r, 1, '500 g')!;
    expect(r2.map((i) => i.qty)).toEqual(['1000 g', '500 g', '2', undefined]);
    expect(resetQty(r2)).toEqual(ings);
  });
  it('refuse une quantité sans nombre', () => {
    expect(rescale(ings, 0, 'beaucoup')).toBeUndefined();
  });
});

import { ETAPES } from '../src/data/carnet-etapes';
import { carnetSteps } from '../src/data/recettes';
describe('étapes du carnet', () => {
  it('chaque plat du carnet a ses étapes, et chaque étape correspond à un plat', () => {
    const names = new Set(CARNET.map((r) => r.name));
    for (const r of CARNET) expect(ETAPES[r.name]?.length ?? 0, r.name).toBeGreaterThanOrEqual(2);
    for (const n of Object.keys(ETAPES)) expect(names.has(n), n).toBe(true);
  });
  it('retrouve les étapes d’une recette enregistrée', () => {
    expect(carnetSteps('Lasagnes')?.[0]).toMatch(/Préchauffer/);
    expect(carnetSteps('Un plat inventé')).toBeUndefined();
  });
});
