import { useEffect, useMemo, useRef, useState } from 'react';
import type { Item, NewItem } from '../data/types';
import { normalize } from '../data/rayons';
import { LISTS, type ListId, type ListKind } from '../data/lists';
import { listenOnce, speechAvailable } from '../data/speech';
import { CartIcon, CloseIcon, MicIcon } from './Icons';

const UNITS = ['pièce', 'kg', 'g', 'L', 'paquet'];

interface Props {
  kind: ListKind;
  editing?: Item;
  /** Ouvre la recherche Carrefour pour cet article (liste de courses seulement). */
  onCarrefour?: (name: string) => void;
  history: string[];
  /** list : la liste choisie (différente de kind.id si on déplace l'article). */
  onSave: (item: NewItem, list: ListId) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function splitQty(qty?: string): { n: number; unit: string } {
  const m = qty?.match(/^×?(\d+)\s*(.*)$/);
  if (!m) return { n: 0, unit: 'pièce' };
  return { n: Number(m[1]), unit: m[2] || 'pièce' };
}

export function AddSheet({ kind, editing, onCarrefour, history, onSave, onDelete, onClose }: Props) {
  const init = splitQty(editing?.qty);
  const [name, setName] = useState(editing?.name ?? '');
  const [rayon, setRayon] = useState<string | null>(editing?.rayon ?? null); // null = automatique
  const [n, setN] = useState(init.n);
  const [unit, setUnit] = useState(init.unit);
  const [note, setNote] = useState(editing?.note ?? '');
  const [voice, setVoice] = useState(!!editing?.voice);
  const [listId, setListId] = useState<ListId>(kind.id);
  const active = LISTS[listId];
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);
  const rayonsRef = useRef<HTMLDivElement>(null);

  const autoRayon = active.guess(name);
  const shownRayon = rayon ?? autoRayon;
  // Fait défiler la rangée jusqu'au rayon choisi.
  useEffect(() => {
    const el = rayonsRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    const row = rayonsRef.current;
    if (el && row) row.scrollTo({ left: el.offsetLeft - row.offsetLeft - 8, behavior: 'auto' });
  }, [shownRayon]);
  const suggestions = useMemo(() => {
    const q = normalize(name);
    if (q.length < 2) return [];
    return history.filter((h) => normalize(h).includes(q) && normalize(h) !== q).slice(0, 3);
  }, [name, history]);

  const dictate = async () => {
    try {
      const text = await listenOnce().promise;
      setName(text.charAt(0).toUpperCase() + text.slice(1));
      setVoice(true);
    } catch {
      /* rien entendu */
    }
  };

  const save = () => {
    if (!name.trim()) return;
    const qty = n > 0 ? (unit === 'pièce' ? `×${n}` : `${n} ${unit}`) : undefined;
    onSave({ name: name.trim(), rayon: shownRayon, qty, note: note.trim() || undefined, voice }, listId);
  };

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="grab" />
        <div className="sheet-head">
          <h2 id="sheet-title">{editing ? 'Modifier l’article' : 'Ajouter un article'}</h2>
          <button className="icon-btn soft" aria-label="Fermer" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label htmlFor="nom" className="sr-only">
              Nom de l’article
            </label>
            <div className="name-field">
              <input
                id="nom"
                ref={input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Farine, lait, pâtes…"
                autoComplete="off"
                enterKeyHint="done"
              />
              {speechAvailable() && (
                <button type="button" className="mic-small" aria-label="Dicter" onClick={dictate}>
                  <MicIcon size={20} />
                </button>
              )}
            </div>
            {suggestions.length > 0 && (
              <div className="suggest">
                <span>Déjà acheté :</span>
                {suggestions.map((s) => (
                  <button type="button" key={s} className="pill" onClick={() => setName(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {editing && (
            <div>
              <p className="field-label">
                Liste {listId !== kind.id && <small>l’article va changer de liste</small>}
              </p>
              <div className="list-pick" role="group" aria-label="Liste">
                {(Object.values(LISTS) as ListKind[]).map((l) => (
                  <button
                    type="button"
                    key={l.id}
                    className="pill"
                    aria-pressed={l.id === listId}
                    onClick={() => {
                      if (l.id === listId) return;
                      setListId(l.id);
                      setRayon(null); // les rayons ne sont pas les mêmes : on repart sur le choix automatique
                    }}
                  >
                    <span aria-hidden="true">{l.id === 'chinois' ? '🥢' : '🛒'}</span> {l.id === 'chinois' ? 'Magasin chinois' : 'Courses'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="field-label">
              Rayon <small>{rayon ? 'choisi à la main' : 'choisi automatiquement'}</small>
            </p>
            <div className="rayons" role="group" aria-label="Rayon" ref={rayonsRef}>
              {active.rayons.map((r) => {
                const on = r.id === shownRayon;
                return (
                  <button
                    type="button"
                    key={r.id}
                    className="rayon"
                    aria-pressed={on}
                    onClick={() => setRayon(r.id)}
                    style={on ? { background: r.ink, color: '#fff', borderColor: r.ink } : { background: r.tint, color: r.ink }}
                  >
                    <span aria-hidden="true">{r.emoji}</span>
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="qty">
            <div>
              <p className="field-label">
                Quantité&nbsp;<small>(facultatif)</small>
              </p>
              <div className="stepper">
                <button type="button" aria-label="Moins" onClick={() => setN(Math.max(0, n - 1))}>
                  −
                </button>
                <span aria-live="polite">{n > 0 ? n : '–'}</span>
                <button type="button" aria-label="Plus" onClick={() => setN(n + 1)}>
                  +
                </button>
              </div>
            </div>
            <div className="units" role="group" aria-label="Unité">
              {UNITS.map((u) => (
                <button
                  type="button"
                  key={u}
                  className={`pill${n > 0 && unit === u ? ' on' : ''}`}
                  aria-pressed={n > 0 && unit === u}
                  onClick={() => {
                    setUnit(u);
                    if (n === 0) setN(1);
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="note" className="field-label">
              <span>
                Note <small>(facultatif)</small>
              </span>
            </label>
            <input id="note" className="text-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : la bio, telle marque…" />
          </div>

          <button type="submit" className="primary" disabled={!name.trim()}>
            {editing ? 'Enregistrer' : 'Ajouter à la liste'}
          </button>
          {editing && onCarrefour && (
            <button type="button" className="secondary accent carrefour-all" onClick={() => onCarrefour(name || editing.name)}>
              <CartIcon size={20} />
              Chercher sur Carrefour
            </button>
          )}
          {onDelete && (
            <button type="button" className="danger" onClick={onDelete}>
              Retirer de la liste
            </button>
          )}
        </form>
      </section>
    </>
  );
}
