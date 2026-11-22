import { useState } from 'react';
import { currentFactor, rescale, resetQty, splitQty, type Ingredient, type Recipe } from '../data/recettes';
import { CloseIcon } from './Icons';

interface Props {
  recipe: Recipe;
  /** L'ingrédient est déjà dans la liste de courses (pas encore pris). */
  inList: (i: Ingredient) => boolean;
  /** Quantité déjà rangée à la cave, 0 sinon. */
  inCave: (i: Ingredient) => number;
  onAddOne: (i: Ingredient) => void;
  onAddMany: (list: Ingredient[]) => void;
  onUpcoming: (upcoming: boolean) => void;
  /** Enregistre des quantités recalculées. */
  onIngredients: (list: Ingredient[]) => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/** Une recette ouverte : ses ingrédients, chacun avec « Ajouter ». */
export function RecipeView({ recipe: r, inList, inCave, onAddOne, onAddMany, onUpcoming, onIngredients, onEdit, onDelete, onClose }: Props) {
  const [cooked, setCooked] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [qtyMsg, setQtyMsg] = useState('');
  const [confirmAll, setConfirmAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [doneSteps, setDoneSteps] = useState<Set<number>>(() => new Set());
  const steps = r.steps ?? [];
  const factor = currentFactor(r.ingredients);
  const commit = () => {
    if (editing === null) return;
    const i = editing;
    setEditing(null);
    if (!draft.trim() || draft.trim() === r.ingredients[i]?.qty) return;
    const next = rescale(r.ingredients, i, draft.trim());
    if (!next) return setQtyMsg('Tapez un nombre, par exemple 800 ou 800 g.');
    setQtyMsg('');
    onIngredients(next);
  };
  const missing = r.ingredients.filter((i) => !inList(i) && inCave(i) === 0);

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <section className="sheet recipe-sheet" role="dialog" aria-modal="true" aria-labelledby="recipe-title">
        <div className="grab" />
        <div className="sheet-head">
          <h2 id="recipe-title">
            <span aria-hidden="true">{r.emoji}</span> {r.name}
          </h2>
          <button className="icon-btn soft" aria-label="Fermer" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="recipe-actions">
          {r.upcoming ? (
            <button
              className="rchip"
              onClick={() => {
                setCooked(true);
                onUpcoming(false);
              }}
            >
              ✓ C’est cuisiné
            </button>
          ) : (
            <button className="rchip" onClick={() => onUpcoming(true)}>
              🔥 Mettre dans Prochaines
            </button>
          )}
          <button className="rchip ghost" onClick={onEdit}>
            ✎ Modifier
          </button>
          <button className={`rchip ${confirmDelete ? 'danger-on' : 'ghost danger-chip'}`} onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}>
            {confirmDelete ? 'Confirmer la suppression' : '🗑 Supprimer'}
          </button>
          {r.url && (
            <a className="rchip ghost" href={r.url} target="_blank" rel="noreferrer">
              🔗 Voir la recette
            </a>
          )}
        </div>
        {confirmDelete && (
          <p className="recipe-note">
            Touchez encore « Confirmer la suppression » pour supprimer {r.name} définitivement.{' '}
            <button className="link-btn" onClick={() => setConfirmDelete(false)}>
              Annuler
            </button>
          </p>
        )}
        {missing.length > 0 &&
          (confirmAll ? (
            <div className="add-confirm" role="alertdialog" aria-label="Confirmer l’ajout">
              <strong>
                Ajouter {missing.length} ingrédient{missing.length > 1 ? 's' : ''} aux courses ?
              </strong>
              <span>{missing.map((i) => i.name.toLowerCase()).join(', ')}</span>
              <div className="add-confirm-btns">
                <button
                  className="push-on"
                  onClick={() => {
                    setConfirmAll(false);
                    onAddMany(missing);
                  }}
                >
                  Oui, ajouter
                </button>
                <button className="link-btn" onClick={() => setConfirmAll(false)}>
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button className="primary" onClick={() => setConfirmAll(true)}>
              + Tout ajouter aux courses ({missing.length})
            </button>
          ))}
        {cooked && <p className="recipe-note">Rangée dans la bibliothèque. Elle y reste pour la prochaine fois.</p>}

        {r.ingredients.some((i) => splitQty(i.base ?? i.qty)) && (
          <div className="qty-tip">
            {factor === 1 ? (
              <span>Touchez une quantité pour la changer : tout le reste suit.</span>
            ) : (
              <>
                <span>
                  Quantités × {String(Math.round(factor * 100) / 100).replace('.', ',')} par rapport à la recette d’origine.
                </span>
                <button className="rchip ghost" onClick={() => onIngredients(resetQty(r.ingredients))}>
                  ↺ Revenir à l’origine
                </button>
              </>
            )}
          </div>
        )}
        {qtyMsg && <p className="recipe-note">{qtyMsg}</p>}
        <ul className="ing-list">
          {r.ingredients.map((i, k) => {
            const listed = inList(i);
            const cave = inCave(i);
            return (
              <li key={`${i.name}-${k}`} className="ing-row">
                <span className="ing-name">
                  {i.name}
                  {editing === k ? (
                    <input
                      className="qty-input"
                      autoFocus
                      value={draft}
                      inputMode="decimal"
                      aria-label={`Quantité de ${i.name}`}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={commit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commit();
                        if (e.key === 'Escape') setEditing(null);
                      }}
                    />
                  ) : splitQty(i.qty) ? (
                    <button
                      className="qty-btn"
                      aria-label={`Changer la quantité de ${i.name} (${i.qty})`}
                      onClick={() => {
                        setDraft(i.qty ?? '');
                        setEditing(k);
                      }}
                    >
                      {i.qty}
                    </button>
                  ) : (
                    i.qty && <span className="ing-qty"> · {i.qty}</span>
                  )}
                  {cave > 0 && <span className="ing-cave">📦 {cave} à la cave</span>}
                </span>
                {listed ? (
                  <span className="ing-add ok">✓ Dans la liste</span>
                ) : (
                  <button className="ing-add" onClick={() => onAddOne(i)}>
                    + Ajouter
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {r.ingredients.length === 0 && <p className="recipe-note">Pas encore d’ingrédients. Touchez « Modifier » pour en ajouter.</p>}

        <div className="steps">
          <h3>Préparation</h3>
          {steps.length > 0 ? (
            <>
              <ol>
                {steps.map((st, k) => (
                  <li key={k}>
                    <button
                      className={doneSteps.has(k) ? 'done' : ''}
                      aria-pressed={doneSteps.has(k)}
                      onClick={() =>
                        setDoneSteps((d) => {
                          const n = new Set(d);
                          if (n.has(k)) n.delete(k);
                          else n.add(k);
                          return n;
                        })
                      }
                    >
                      <span className="step-num">{k + 1}</span>
                      <span>{st}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <p className="recipe-note">Touchez une étape quand elle est faite.</p>
            </>
          ) : (
            <p className="recipe-note">
              Pas encore d’étapes. Touchez « Modifier » pour les écrire, ou collez le lien d’une recette pour les récupérer.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
