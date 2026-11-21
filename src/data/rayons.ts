import type { RayonId } from '../../supabase/functions/_shared/texte.ts';
export type { RayonId };
export { guessRayon, normalize } from '../../supabase/functions/_shared/texte.ts';

export interface Rayon {
  id: RayonId;
  label: string;
  tint: string;
  ink: string;
  icon: string; // chemin SVG (viewBox 24)
}

// L'ordre suit un parcours de magasin classique.
export const RAYONS: Rayon[] = [
  { id: 'fruits', label: 'Fruits et légumes', tint: '#FDE3DA', ink: '#B23E1E', icon: 'M12 7c-2-2-6.5-1.5-6.5 3.5S8.5 20 10 20c1 0 1.3-.6 2-.6s1 .6 2 .6c1.5 0 4.5-4.5 4.5-9.5S14 5 12 7z M12 7c0-2 1-3.5 3-4' },
  { id: 'boulangerie', label: 'Boulangerie', tint: '#F6E4CE', ink: '#8A4B12', icon: 'M4 11a8 5 0 0 1 16 0v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z M9 9v4 M12 8v5 M15 9v4' },
  { id: 'boucherie', label: 'Boucherie et poisson', tint: '#F9DDE3', ink: '#9C2C45', icon: 'M15 4a5 5 0 0 1 0 10l-6 6a2 2 0 1 1-3-3l6-6a5 5 0 0 1 3-7z' },
  { id: 'frais', label: 'Frais', tint: '#DDEBFA', ink: '#2A5D99', icon: 'M8 2h8v3l2 3v14H6V8l2-3z M6 8h12' },
  { id: 'epicerie', label: 'Épicerie', tint: '#FBEFCF', ink: '#855600', icon: 'M8 3h8v3H8z M6 6h12v12a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z M6 11h12' },
  { id: 'surgeles', label: 'Surgelés', tint: '#DCF1F7', ink: '#1C6479', icon: 'M12 2v20 M4 7l16 10 M20 7L4 17' },
  { id: 'boissons', label: 'Boissons', tint: '#EAE2F8', ink: '#5B3E9E', icon: 'M5 8h12v6a6 6 0 0 1-12 0z M17 10h2a2 2 0 0 1 0 4h-2 M8 2v3 M12 2v3' },
  { id: 'hygiene', label: 'Hygiène et beauté', tint: '#E4F2DC', ink: '#3F6B22', icon: 'M9 3h6v4H9z M7 7h10l-1 14H8z' },
  { id: 'maison', label: 'Maison', tint: '#ECE7E1', ink: '#5A4E42', icon: 'M3 11l9-7 9 7 M5 10v10h14V10' },
  { id: 'autre', label: 'Autre', tint: '#E8ECEB', ink: '#4B5654', icon: 'M5 12h.01 M12 12h.01 M19 12h.01' }
];

export const rayonById = (id: RayonId): Rayon => RAYONS.find((r) => r.id === id) ?? RAYONS[RAYONS.length - 1];

