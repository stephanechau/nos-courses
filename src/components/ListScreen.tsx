import type { ReactNode } from 'react';
import type { Item, Member } from '../data/types';
import { RAYONS } from '../data/rayons';
import { BasketIcon, BellIcon, CartIcon, CheckIcon, CloseIcon, MicIcon, PathIcon, PlusIcon } from './Icons';

interface Props {
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
  /** Articles déjà cherchés sur Carrefour (le chariot devient blanc). */
  searched: Set<string>;
  onCarrefour: (item: Item) => void;
  onCarrefourAll: () => void;
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

export function ListScreen(p: Props) {
  const byId = (id?: string) => p.members.find((m) => m.id === id);
  const todo = p.items.filter((i) => !i.done);
  const done = p.items.filter((i) => i.done);
  const pct = p.items.length ? Math.round((done.length * 100) / p.items.length) : 0;
  const sections = RAYONS.map((r) => ({ r, items: todo.filter((i) => i.rayon === r.id).sort((a, b) => a.createdAt - b.createdAt) })).filter(
    (s) => s.items.length > 0
  );

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-top">
          <span className="hero-hello">Bonjour {p.me.name}</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="avatars">
              {p.members.map((m) => (
                <Avatar key={m.id} m={m} />
              ))}
            </div>
            <button className="icon-btn" aria-label="Réglages" onClick={p.onSettings}>
              <BellIcon />
            </button>
          </div>
        </div>
        <h1 className="sr-only">Nos courses</h1>
        {p.tabs}
        <div className="hero-stats">
          <span>{todo.length} article{todo.length > 1 ? 's' : ''} à prendre</span>
          <span>{done.length} dans le panier</span>
        </div>
        <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Avancement des courses">
          <span style={{ width: `${pct}%` }} />
        </div>
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
        {todo.length > 0 && (
          <button className="secondary accent carrefour-all" onClick={p.onCarrefourAll}>
            <CartIcon size={20} />
            Tout chercher sur Carrefour
          </button>
        )}
        {p.items.length === 0 && (
          <p className="empty">
            <strong>La liste est vide</strong>
            Ajoutez un article avec le champ en bas, ou appuyez sur le micro et dites par exemple « farine et pâtes ».
          </p>
        )}

        {sections.map(({ r, items }) => (
          <section key={r.id} className="section" aria-labelledby={`h-${r.id}`}>
            <div className="section-head">
              <span className="tile" style={{ background: r.tint }}>
                <PathIcon d={r.icon} color={r.ink} />
              </span>
              <h2 id={`h-${r.id}`}>{r.label}</h2>
              <span className="count" style={{ background: r.tint, color: r.ink }}>
                {items.length}
              </span>
            </div>
            <ul>
              {items.map((it) => (
                <li key={it.id} className="row">
                  <button className="check" aria-label={`Cocher ${it.name}`} onClick={() => p.onToggle(it)}>
                    <span className="box" />
                  </button>
                  <button className="row-main" onClick={() => p.onEdit(it)} aria-label={`Modifier ${it.name}`}>
                    <span className="row-name">
                      {it.name}
                      {it.qty && <span className="chip">{it.qty}</span>}
                    </span>
                    {it.note && <span className="row-note">{it.note}</span>}
                  </button>
                  <span className="row-side">
                    <button
                      className={`cart-btn${p.searched.has(it.id) ? ' seen' : ''}`}
                      aria-label={`Chercher ${it.name} sur Carrefour`}
                      onClick={() => p.onCarrefour(it)}
                    >
                      <CartIcon />
                    </button>
                    {it.voice && (
                      <span className="voice-badge" role="img" aria-label="Ajouté à la voix">
                        <MicIcon size={14} color="var(--accent)" width={2.4} />
                      </span>
                    )}
                    <Avatar m={byId(it.addedBy)} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {done.length > 0 && (
          <section className="section basket" aria-labelledby="h-basket">
            <div className="section-head">
              <span className="tile" style={{ background: 'var(--accent)' }}>
                <BasketIcon />
              </span>
              <h2 id="h-basket">Dans le panier</h2>
              <button className="link-btn" onClick={p.onClearDone}>
                Vider
              </button>
            </div>
            <ul>
              {done.map((it) => (
                <li key={it.id} className="row">
                  <button className="check" aria-label={`Décocher ${it.name}`} onClick={() => p.onToggle(it)}>
                    <span className="box on">
                      <CheckIcon />
                    </span>
                  </button>
                  <span className="row-main">
                    <span className="row-name done">{it.name}</span>
                  </span>
                  <span className="row-side">par {byId(it.doneBy)?.name ?? '?'}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <div className="addbar">
        <button className="addbar-field" onClick={p.onAdd}>
          <PlusIcon />
          Ajouter un article…
        </button>
        <button className={`mic${p.listening ? ' listening' : ''}`} aria-label={p.listening ? 'J’écoute…' : 'Ajouter à la voix'} onClick={p.onVoice}>
          <MicIcon size={26} />
        </button>
      </div>
    </div>
  );
}
