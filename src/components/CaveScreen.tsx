import { useState, type ReactNode } from 'react';
import type { Member } from '../data/types';
import { CAVE_CATS, type StockItem } from '../data/cave';
import { Avatar } from './ListScreen';
import { BellIcon, MicIcon, PlusIcon } from './Icons';

interface Props {
  me: Member;
  members: Member[];
  items: StockItem[];
  /** La table n'existe pas encore dans Supabase. */
  missing: boolean;
  tabs: ReactNode;
  listening: boolean;
  onQty: (item: StockItem, qty: number) => void;
  onEdit: (item: StockItem) => void;
  onAdd: () => void;
  onVoice: () => void;
  onToShopping: (item: StockItem) => void;
  onSettings: () => void;
}

export function CaveScreen(p: Props) {
  // Articles tombés à zéro sur ce téléphone, pour lesquels on propose « Ajouter aux courses ».
  const [ask, setAsk] = useState<Set<string>>(() => new Set());
  const [added, setAdded] = useState<Set<string>>(() => new Set());
  const without = (s: Set<string>, id: string) => {
    const n = new Set(s);
    n.delete(id);
    return n;
  };

  const total = p.items.reduce((n, i) => n + i.qty, 0);
  const durable = new Set(CAVE_CATS.filter((c) => c.durable).map((c) => c.id));
  const low = p.items.filter((i) => i.qty <= 1 && !durable.has(i.category)).length;
  const sections = CAVE_CATS.map((c) => ({ c, items: p.items.filter((i) => i.category === c.id) })).filter((s) => s.items.length > 0);

  return (
    <div className="app bulles">
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
        <h1>La cave 📦</h1>
        {p.tabs}
        <div className="bstats">
          <span>
            {total} produit{total > 1 ? 's' : ''} en stock
          </span>
          <span>
            {low} presque épuisé{low > 1 ? 's' : ''}
          </span>
        </div>
      </header>

      <main className="list">
        {p.missing ? (
          <p className="empty">
            <strong>La cave arrive bientôt</strong>
            Il reste une petite étape à faire dans Supabase, depuis un ordinateur. Ensuite, elle apparaîtra ici sur tous les téléphones.
          </p>
        ) : (
          p.items.length === 0 && (
            <p className="empty">
              <strong>La cave est vide</strong>
              Rangez un premier objet avec le champ en bas, ou appuyez sur le micro et dites par exemple « six bouteilles de bordeaux ».
            </p>
          )
        )}

        {sections.map(({ c, items }) => (
          <section key={c.id} className="bcard" aria-labelledby={`c-${c.id}`}>
            <div className="bcard-head">
              <h2 id={`c-${c.id}`}>
                <span aria-hidden="true">{c.emoji}</span> {c.label}
              </h2>
              <span className="bcard-count">{items.reduce((n, i) => n + i.qty, 0)} en stock</span>
            </div>
            <ul className="cave-list">
              {items.map((it) => (
                <li key={it.id} className="cave-row">
                  <div className="cave-line">
                    <button className="row-main" onClick={() => p.onEdit(it)} aria-label={`Modifier ${it.name}`}>
                      <span className={`row-name${it.qty === 0 ? ' empty-stock' : ''}`}>{it.name}</span>
                      {it.detail && <span className="cave-detail">{it.detail}</span>}
                    </button>
                    <div className="cave-stepper">
                      <button
                        aria-label={`Un ${it.name} de moins`}
                        disabled={it.qty === 0}
                        onClick={() => {
                          const q = Math.max(0, it.qty - 1);
                          p.onQty(it, q);
                          if (q === 0 && !c.durable) setAsk((s) => new Set(s).add(it.id));
                        }}
                      >
                        −
                      </button>
                      <span className={!c.durable && it.qty <= 1 ? 'low' : ''} aria-live="polite">
                        {it.qty}
                      </span>
                      <button
                        aria-label={`Un ${it.name} de plus`}
                        onClick={() => {
                          p.onQty(it, it.qty + 1);
                          setAsk((s) => without(s, it.id));
                          setAdded((s) => without(s, it.id));
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {ask.has(it.id) && it.qty === 0 && (
                    <div className="cave-ask">
                      <span>Plus de {it.name.toLowerCase()}. Ajouter aux courses ?</span>
                      <button
                        className="push-on"
                        onClick={() => {
                          p.onToShopping(it);
                          setAsk((s) => without(s, it.id));
                          setAdded((s) => new Set(s).add(it.id));
                        }}
                      >
                        Ajouter
                      </button>
                      <button className="link-btn" onClick={() => setAsk((s) => without(s, it.id))}>
                        Non
                      </button>
                    </div>
                  )}
                  {added.has(it.id) && <span className="cave-added">✓ Ajouté à la liste de courses</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      {!p.missing && (
        <div className="addbar">
          <button className="addbar-field" onClick={p.onAdd}>
            <PlusIcon />
            Ranger à la cave…
          </button>
          <button className={`mic${p.listening ? ' listening' : ''}`} aria-label={p.listening ? 'J’écoute…' : 'Ranger à la voix'} onClick={p.onVoice}>
            <MicIcon size={26} />
          </button>
        </div>
      )}
    </div>
  );
}
