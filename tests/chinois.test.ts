import { describe, expect, it } from 'vitest';
import { guessRayonChinois } from '../src/data/chinois';
import { emojiFor } from '../src/data/emoji';

describe('guessRayonChinois', () => {
  it.each([
    ['Pak-choï', 'ch_legumes'],
    ['Citronnelle', 'ch_legumes'],
    ['Riz thaï 5 kg', 'ch_riz'],
    ['Nouilles udon', 'ch_riz'],
    ['Feuilles de riz', 'ch_riz'],
    ['Sauce soja', 'ch_sauces'],
    ['Nuoc-mâm', 'ch_sauces'],
    ['Lait de coco', 'ch_sauces'],
    ['Tofu', 'ch_frais'],
    ['Kimchi', 'ch_frais'],
    ['Gyozas', 'ch_surgeles'],
    ['Nems', 'ch_surgeles'],
    ['Mochis', 'ch_snacks'],
    ['Thé jasmin', 'ch_snacks'],
    ['Baguettes', 'ch_maison'],
    ['Bols', 'ch_maison'],
    ['Truc inconnu', 'ch_autre']
  ])('%s → %s', (name, rayon) => {
    expect(guessRayonChinois(name)).toBe(rayon);
  });
});

describe('emojiFor', () => {
  it.each([
    ['Bananes', '🍌'],
    ['Pommes de terre', '🥔'],
    ['Œufs', '🥚'],
    ['Café', '☕'],
    ['Truc inconnu', '🛍️']
  ])('%s → %s', (name, e) => {
    expect(emojiFor(name, '🛍️')).toBe(e);
  });
});
