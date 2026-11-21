import { useEffect, useRef, useState } from 'react';
import { CAVE_CATS, guessCaveCat, type CaveCat, type NewStock, type StockItem } from '../data/cave';
import { CloseIcon } from './Icons';

interface Props {
  editing?: StockItem;
  onSave: (item: NewStock) => void;
  onDelete?: () => void;
  onClose: () => void;
}

/** Ranger un objet à la cave, ou le modifier. */
export function CaveSheet({ editing, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(editing?.name ?? '');
  const [cat, setCat] = useState<CaveCat | null>(editing?.category ?? null); // null = automatique
  const [detail, setDetail] = useState(editing?.detail ?? '');
  const [qty, setQty] = useState(editing?.qty ?? 1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!editing) input.current?.focus();
  }, [editing]);
  const shown = cat ?? guessCaveCat(name);

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="cave-title">
        <div className="grab" />
        <div className="sheet-head">
          <h2 id="cave-title">{editing ? 'Modifier' : 'Ranger à la cave'}</h2>
          <button className="icon-btn soft" aria-label="Fermer" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSave({ name: name.trim(), category: shown, detail: detail.trim() || undefined, qty });
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <div>
            <label htmlFor="cave-nom" className="field-label">
              Nom
            </label>
            <input
              id="cave-nom"
              ref={input}
              className="text-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Saint-Émilion, lessive, perceuse…"
              autoComplete="off"
              enterKeyHint="done"
            />
          </div>
          <div>
            <p className="field-label">
              Catégorie <small>{cat ? 'choisie à la main' : 'choisie automatiquement'}</small>
            </p>
            <div className="cave-cats" role="group" aria-label="Catégorie">
              {CAVE_CATS.map((c) => (
                <button type="button" key={c.id} className={`pill${c.id === shown ? ' on' : ''}`} aria-pressed={c.id === shown} onClick={() => setCat(c.id)}>
                  <span aria-hidden="true">{c.emoji}</span> {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="cave-detail" className="field-label">
              <span>
                Détail <small>(facultatif)</small>
              </span>
            </label>
            <input id="cave-detail" className="text-input" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Ex. : rouge 2019, bidons, mallette de 6…" />
          </div>
          <div>
            <p className="field-label">Quantité</p>
            <div className="stepper" style={{ width: 'fit-content' }}>
              <button type="button" aria-label="Moins" onClick={() => setQty(Math.max(0, qty - 1))}>
                −
              </button>
              <span aria-live="polite">{qty}</span>
              <button type="button" aria-label="Plus" onClick={() => setQty(qty + 1)}>
                +
              </button>
            </div>
          </div>
          <button type="submit" className="primary" disabled={!name.trim()}>
            {editing ? 'Enregistrer' : 'Ranger à la cave'}
          </button>
          {onDelete && (
            <button type="button" className="danger" onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}>
              {confirmDelete ? `Confirmer : supprimer ${name || 'cet objet'} de la cave` : 'Supprimer de la cave'}
            </button>
          )}
        </form>
      </section>
    </>
  );
}
