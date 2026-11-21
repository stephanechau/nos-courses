import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { burst, celebrate, land, markFlight } from '../anim';
import type { Item, Member } from '../data/types';
import type { ListKind } from '../data/lists';
import { emojiFor } from '../data/emoji';
import { BellIcon, CartIcon, CloseIcon, MicIcon, PlusIcon } from './Icons';

interface Props {
  kind: ListKind;
  /** La liste n'est pas encore installée dans la base. */
  missing?: boolean;
  me: Member;
  members: Member[];
  items: Item[];
  listening: boolean;
  onToggle: (item: Item) => void;
  onEdit: (item: Item) => void;
  onAdd: () => void;
  onVoice: () => void;
  onClearDone: () => void;
  onSettings: () => void;
  tabs: ReactNode;
  showPushBanner: boolean;
  onCarrefourAll?: () => void;
  onEnablePush: () => void;
  onDismissPush: () => void;
}

/** Deux premières lettres du prénom : « Stéphane » → « St ». */
export function initials(name?: string): string {
  const letters = [...(name ?? '').trim()];
  if (!letters.length) return '?';
  return letters[0].toUpperCase() + (letters[1] ?? '').toLowerCase();
}

export function Avatar({ m, size }: { m?: Member; size?: number }) {
  const style = size ? { width: size, height: size, fontSize: Math.round(size * 0.36) } : undefined;
  return (
    <span className="avatar" title={m?.name} style={{ background: m?.color ?? '#7a8583', ...style }}>
      {initials(m?.name)}
    </span>
  );
}

/** Une pastille d'article : toucher pour cocher, appui long pour modifier. */
function Pill({ it, by, emoji, live, onToggle, onEdit }: { it: Item; by?: Member; emoji: string; live: boolean; onToggle: () => void; onEdit: () => void }) {
  const timer = useRef(0);
  const btn = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const el = btn.current;
    if (!el) return;
    if (land(it.id, el)) {
      if (it.done) window.setTimeout(() => el.classList.add('wiggle'), 600);
    } else if (live) {
      el.classList.add('pop');
    }
    // Uniquement à l’apparition de la pastille.
  }, []);
  const long = useRef(false);
  const start = () => {
    long.current = false;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      long.current = true;
      navigator.vibrate?.(15);
      onEdit();
    }, 450);
  };
  const stop = () => window.clearTimeout(timer.current);
  return (
    <li>
      <button
        ref={btn}
        className={`pill-item${it.done ? ' done' : ''}`}
        onAnimationEnd={(e) => e.currentTarget.classList.remove('pop', 'squish', 'wiggle')}
        aria-pressed={it.done}
        aria-label={`${it.name}${it.qty ? ` ${it.qty}` : ''}${it.done ? ', dans le chariot' : ''}. Appui long pour modifier`}
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          if (long.current) return;
          const el = btn.current;
          if (el) {
            if (!it.done) {
              const r = el.getBoundingClientRect();
              burst(r.left + r.width / 2, r.top + r.height / 2);
            }
            markFlight(it.id, el);
          }
          onToggle();
        }}
      >
        <span className="pill-emoji" aria-hidden="true">
          {emoji}
        </span>
        <span className="pill-name">{it.name}</span>
        {it.qty && <span className="pill-qty">{it.qty}</span>}
        {it.note && (
          <span className="pill-note" aria-hidden="true">
            ✎
          </span>
        )}
        {it.voice && (
          <span className="pill-note" aria-hidden="true">
            🎤
          </span>
        )}
        <span className="pill-dot" style={{ background: by?.color ?? '#9aa5a3' }} title={by?.name} />
      </button>
    </li>
  );
}

/** Grosses bulles transparentes qui montent doucement dans le fond. */
export function Bubbles() {
  return (
    <div className="bg-bubbles" aria-hidden="true">
      {[
        [70, 8, 16],
        [40, 30, 12],
        [110, 62, 20],
        [54, 80, 14],
        [30, 92, 10]
      ].map(([size, left, dur], i) => (
        <span key={i} style={{ width: size, height: size, left: `${left}%`, animationDuration: `${dur}s`, animationDelay: `${-i * 3.1}s` }} />
      ))}
    </div>
  );
}

export function ListScreen(p: Props) {
  const byId = (id?: string) => p.members.find((m) => m.id === id);
  const todo = p.items.filter((i) => !i.done);
  const done = p.items.filter((i) => i.done);
  const pct = p.items.length ? Math.round((done.length * 100) / p.items.length) : 0;
  const shown = Math.max(pct, 14);
  const known = new Set(p.kind.rayons.map((r) => r.id));
  const fallback = p.kind.rayons[p.kind.rayons.length - 1];
  const sections = p.kind.rayons
    .map((r) => ({
      r,
      items: todo.filter((i) => i.rayon === r.id || (r === fallback && !known.has(i.rayon))).sort((a, b) => a.createdAt - b.createdAt)
    }))
    .filter((s) => s.items.length > 0);
  // Les pastilles déjà là à l'ouverture de l'écran ne rebondissent pas, seulement les nouvelles.
  const [live, setLive] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLive(true), 1200);
    return () => window.clearTimeout(t);
  }, []);
  // Le chariot sautille à chaque article pris ; confettis quand tout est pris.
  const cart = useRef<HTMLSpanElement>(null);
  const prevDone = useRef(done.length);
  useEffect(() => {
    if (live && done.length > prevDone.current) {
      cart.current?.classList.remove('bump');
      void cart.current?.offsetWidth;
      cart.current?.classList.add('bump');
      if (todo.length === 0) celebrate();
    }
    prevDone.current = done.length;
  }, [done.length, todo.length, live]);
  const emojiOf = (it: Item) => emojiFor(it.name, (p.kind.rayons.find((r) => r.id === it.rayon) ?? fallback).emoji);

  return (
    <div className="app bulles">
      <Bubbles />
      <header className="bhero">
        <div className="hero-top">
          <span className="hero-hello">Hello {p.me.name} ✨</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="avatars">
              {p.members.map((m) => (
                <Avatar key={m.id} m={m} />
              ))}
            </div>
            <button className="icon-btn glass" aria-label="Réglages" onClick={p.onSettings}>
              <BellIcon />
            </button>
          </div>
        </div>
        <h1>{p.kind.title}</h1>
        {p.tabs}
        {p.items.length > 0 && (
          <div className="cart-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Avancement des courses">
            <span className="cart-fill" style={{ width: `${shown}%` }} />
            <span ref={cart} className="cart-icon" onAnimationEnd={(e) => e.currentTarget.classList.remove('bump')} style={{ left: `calc(${shown}% - 34px)` }} aria-hidden="true">
              🛒
            </span>
            <span className="cart-label">
              {done.length} / {p.items.length} dans le chariot
            </span>
          </div>
        )}
      </header>

      <main className="list">
        {p.showPushBanner && (
          <div className="push-banner" role="region" aria-label="Notifications">
            <span className="push-bell">
              <BellIcon size={20} color="#0B5453" />
            </span>
            <p>Être prévenu quand la famille ajoute un article ?</p>
            <button className="push-on" onClick={p.onEnablePush}>
              Activer
            </button>
            <button className="push-close" aria-label="Masquer" onClick={p.onDismissPush}>
              <CloseIcon size={14} color="#5C6664" />
            </button>
          </div>
        )}
        {p.missing && (
          <p className="empty">
            <strong>Bientôt prête</strong>
            Il reste une petite étape à faire dans Supabase, depuis un ordinateur. Ensuite, cette liste apparaîtra sur tous les téléphones.
          </p>
        )}
        {!p.missing && p.items.length === 0 && (
          <p className="empty">
            <strong>La liste est vide</strong>
            Ajoutez un article avec le champ en bas, ou appuyez sur le micro et dites par exemple « farine et pâtes ».
          </p>
        )}
        {p.onCarrefourAll && todo.length > 0 && (
          <button className="glass-btn" onClick={p.onCarrefourAll}>
            <CartIcon size={20} color="#fff" />
            Tout chercher sur Carrefour
          </button>
        )}

        {sections.map(({ r, items }) => (
          <section key={r.id} className="bcard" aria-labelledby={`h-${r.id}`}>
            <div className="bcard-head">
              <h2 id={`h-${r.id}`}>
                <span aria-hidden="true">{r.emoji}</span> {r.label}
              </h2>
              <span className="bcard-count">{items.length} à prendre</span>
            </div>
            <ul className="pills">
              {items.map((it) => (
                <Pill key={it.id} it={it} by={byId(it.addedBy)} emoji={emojiOf(it)} live={live} onToggle={() => p.onToggle(it)} onEdit={() => p.onEdit(it)} />
              ))}
            </ul>
          </section>
        ))}

        {done.length > 0 && (
          <section className="bcard basket" aria-labelledby="h-basket">
            <div className="bcard-head">
              <h2 id="h-basket">
                <span aria-hidden="true">🧺</span> Dans le chariot
              </h2>
              <button className="link-btn" onClick={p.onClearDone}>
                Vider
              </button>
            </div>
            <ul className="pills">
              {done.map((it) => (
                <Pill key={it.id} it={it} by={byId(it.doneBy)} emoji={emojiOf(it)} live={live} onToggle={() => p.onToggle(it)} onEdit={() => p.onEdit(it)} />
              ))}
            </ul>
          </section>
        )}
        {p.items.length > 0 && <p className="bhint">Touchez un article pour le cocher, appui long pour le modifier.</p>}
      </main>

      {!p.missing && (
        <div className="addbar">
          <button className="addbar-field" onClick={p.onAdd}>
            <PlusIcon />
            Ajouter un article…
          </button>
          <button className={`mic${p.listening ? ' listening' : ''}`} aria-label={p.listening ? 'J’écoute…' : 'Ajouter à la voix'} onClick={p.onVoice}>
            <MicIcon size={26} />
          </button>
        </div>
      )}
    </div>
  );
}
