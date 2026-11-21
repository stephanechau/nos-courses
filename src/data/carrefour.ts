/** Ouvre la recherche publique de carrefour.fr pour un article (aucun compte, aucun accès au panier). */
export function carrefourUrl(name: string): string {
  return `https://www.carrefour.fr/s?q=${encodeURIComponent(name.trim())}`;
}

export function openCarrefour(name: string): void {
  window.open(carrefourUrl(name), '_blank', 'noopener');
}
