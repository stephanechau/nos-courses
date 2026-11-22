import { useState } from 'react';
import type { Ingredient, Recipe } from '../data/recettes';
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
  onEdit: () => void;
  onClose: () => void;
}

/** Une recette ouverte : ses ingrédients, chacun avec « Ajouter ». */
export function RecipeView({ recipe: r, inList, inCave, onAddOne, onAddMany, onUpcoming, onEdit, onClose }: Props) {
  const [cooked, setCooked] = useState(false);
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
          {r.url && (
            <a className="rchip ghost" href={r.url} target="_blank" rel="noreferrer">
              🔗 Voir la recette
            </a>
          )}
          <button className="rchip ghost" onClick={onEdit}>
            ✎ Modifier
          </button>
        </div>
        {cooked && <p className="recipe-note">Rangée dans la bibliothèque. Elle y reste pour la prochaine fois.</p>}

        <ul className="ing-list">
          {r.ingredients.map((i, k) => {
            const listed = inList(i);
            const cave = inCave(i);
            return (
              <li key={`${i.name}-${k}`} className="ing-row">
                <span className="ing-name">
                  {i.name}
                  {i.qty && <span className="ing-qty"> · {i.qty}</span>}
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

        {missing.length > 0 && (
          <button className="primary" onClick={() => onAddMany(missing)}>
            + Tout ajouter aux courses ({missing.length})
          </button>
        )}
      </section>
    </>
  );
}
