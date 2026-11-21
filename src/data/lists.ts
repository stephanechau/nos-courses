import { RAYONS, guessRayon, type Rayon } from './rayons';
import { RAYONS_CHINOIS, guessRayonChinois } from './chinois';

export type ListId = 'courses' | 'chinois';

export interface ListKind {
  id: ListId;
  title: string;
  rayons: Rayon[];
  guess: (name: string) => string;
  /** Recherche Carrefour proposée sur cette liste. */
  carrefour: boolean;
}

export const LISTS: Record<ListId, ListKind> = {
  courses: { id: 'courses', title: 'Nos courses', rayons: RAYONS, guess: guessRayon, carrefour: true },
  chinois: { id: 'chinois', title: 'Magasin chinois', rayons: RAYONS_CHINOIS, guess: guessRayonChinois, carrefour: false }
};

export const rayonIn = (kind: ListKind, id: string): Rayon => kind.rayons.find((r) => r.id === id) ?? kind.rayons[kind.rayons.length - 1];
