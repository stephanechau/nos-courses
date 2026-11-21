import { useState } from 'react';
import type { Item, Member } from '../data/types';
import { RAYONS } from '../data/rayons';
import { openCarrefour } from '../data/carrefour';
import { CloseIcon } from './Icons';
import { emojiFor } from '../data/emoji';

interface Props {
  /** Articles à prendre, dans l'ordre de la liste (figés au lancement). */
  items: Item[];
  members: Member[];
  onInBasket: (item: Item) => void;
  onClose: () => void;
}

/** « Tout chercher sur Carrefour » : les articles un par un. */
export function CarrefourWalk({ items, members, onInBasket, onClose }: Props) {
  const [i, setI] = useState(0);
  const [ok, setOk] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [opened, setOpened] = useState(false);
  const cur = items[i];
  const rayon = cur && RAYONS.find((r) => r.id === cur.rayon);
  const by = cur && members.find((m) => m.id === cur.addedBy);
  const next = () => {
    setI(i + 1);
    setOpened(false);
  };

  return (
    <div className="app">
      <header className="page-head">
        <button className="icon-btn soft" aria-label="Arrêter" onClick={onClose}>
          <CloseIcon />
        </button>
        <h1>Courses sur Carrefour</h1>
      </header>
      <main className="page walk">
        <div className="walk-progress">
          <span>{cur ? `Article ${i + 1} sur ${items.length}` : `${items.length} article${items.length > 1 ? 's' : ''} parcouru${items.length > 1 ? 's' : ''}`}</span>
          <div className="walk-bar">
            <span style={{ width: `${Math.round((Math.min(i, items.length) * 100) / Math.max(items.length, 1))}%` }} />
          </div>
        </div>

        {cur ? (
          <>
            <section className="walk-card">
              {rayon && (
                <span className="tile big" style={{ background: rayon.tint, fontSize: 32 }} aria-hidden="true">
                  {emojiFor(cur.name, rayon.emoji)}
                </span>
              )}
              <strong>{cur.name}</strong>
              {cur.qty && <span className="chip">{cur.qty}</span>}
              <span className="walk-meta">
                {rayon?.label}
                {by ? ` · ajouté par ${by.name}` : ''}
              </span>
              {cur.note && <span className="walk-meta">{cur.note}</span>}
            </section>
            <button
              className="primary"
              onClick={() => {
                openCarrefour(cur.name);
                setOpened(true);
              }}
            >
              Chercher sur Carrefour
            </button>
            {opened && <p className="hint" style={{ textAlign: 'center', margin: '-6px 8px 0' }}>Ajoutez le produit au panier sur Carrefour, puis revenez ici.</p>}
            <button
              className="secondary accent"
              onClick={() => {
                onInBasket(cur);
                setOk(ok + 1);
                next();
              }}
            >
              C’est dans le panier ✓
            </button>
            <button
              className="link-btn"
              onClick={() => {
                setSkipped(skipped + 1);
                next();
              }}
            >
              Passer cet article
            </button>
          </>
        ) : (
          <>
            <section className="walk-card">
              <span style={{ fontSize: 44 }} aria-hidden="true">
                🎉
              </span>
              <strong>C’est terminé</strong>
              <span className="walk-meta">
                {ok} article{ok > 1 ? 's' : ''} coché{ok > 1 ? 's' : ''} dans la liste
                {skipped ? `, ${skipped} passé${skipped > 1 ? 's' : ''} (toujours à prendre).` : '.'}
              </span>
            </section>
            <button className="primary" onClick={onClose}>
              Revenir à la liste
            </button>
          </>
        )}
      </main>
    </div>
  );
}
