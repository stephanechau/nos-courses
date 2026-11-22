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
