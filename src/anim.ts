// Petites animations « fun » : confettis, gerbes, envol des pastilles.

const COLORS = ['#ffc94a', '#ff7a59', '#9be3d2', '#13827c', '#ff9fd0'];

export function calm(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Gerbe de points colorés autour d'un point de l'écran. */
export function burst(x: number, y: number) {
  if (calm()) return;
  for (let i = 0; i < 10; i++) {
    const d = document.createElement('span');
    d.className = 'fx-spark';
    const a = (Math.PI * 2 * i) / 10;
    const r = 34 + Math.random() * 14;
    d.style.left = `${x}px`;
    d.style.top = `${y}px`;
    d.style.setProperty('--dx', `${Math.cos(a) * r}px`);
    d.style.setProperty('--dy', `${Math.sin(a) * r}px`);
    d.style.background = COLORS[i % COLORS.length];
    document.body.append(d);
    window.setTimeout(() => d.remove(), 700);
  }
}

/** Pluie de confettis et bulle « Tout est pris ! ». */
export function celebrate() {
  const msg = document.createElement('div');
  msg.className = 'fx-bravo';
  msg.textContent = 'Tout est pris ! 🎉';
  document.body.append(msg);
  window.setTimeout(() => msg.remove(), 2200);
  if (calm()) return;
  for (let i = 0; i < 36; i++) {
    const k = document.createElement('span');
    k.className = 'fx-confetti';
    k.style.left = `${Math.random() * 100}vw`;
    k.style.background = COLORS[i % COLORS.length];
    k.style.animationDelay = `${Math.random() * 0.5}s`;
    document.body.append(k);
    window.setTimeout(() => k.remove(), 2600);
  }
}

/** Position de départ des pastilles qui changent de carte (cochées ou décochées). */
const flights = new Map<string, DOMRect>();

export function markFlight(id: string, el: Element) {
  flights.set(id, el.getBoundingClientRect());
  window.setTimeout(() => flights.delete(id), 1500);
}

/** À l'arrivée : fait partir la pastille de son ancienne place jusqu'à la nouvelle. Renvoie vrai si elle a volé. */
export function land(id: string, el: HTMLElement): boolean {
  const from = flights.get(id);
  if (!from) return false;
  flights.delete(id);
  if (calm()) return true;
  const to = el.getBoundingClientRect();
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  if (Math.abs(dx) + Math.abs(dy) < 2) return true;
  el.animate(
    [
      { transform: `translate(${dx}px, ${dy}px)`, zIndex: 5 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(1.06)`, zIndex: 5, offset: 0.5 },
      { transform: 'none', zIndex: 5 }
    ],
    { duration: 650, easing: 'cubic-bezier(.45,0,.3,1)' }
  );
  return true;
}
