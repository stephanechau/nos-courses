import { useEffect, useRef, useState } from 'react';
import { findInCarnet, parseIngredientLine, suggestFromCarnet, type ImportedRecipe, type Ingredient, type NewRecipe, type Recipe } from '../data/recettes';
import type { CarnetRecette } from '../data/carnet';
import { emojiFor } from '../data/emoji';
import { CloseIcon } from './Icons';

interface Props {
  editing?: Recipe;
  /** Nom déjà dicté, pour une nouvelle idée. */
  initialName?: string;
  importRecipe?: (url: string) => Promise<ImportedRecipe>;
  onSave: (r: NewRecipe) => void;
  onDelete?: () => void;
  onClose: () => void;
}

/** Nouvelle idée de plat, ou modification d'une recette. */
export function RecipeSheet({ editing, initialName, importRecipe, onSave, onDelete, onClose }: Props) {
  const start = !editing && initialName ? findInCarnet(initialName) : undefined;
  const [name, setName] = useState(editing?.name ?? initialName ?? '');
  const [emoji, setEmoji] = useState(editing?.emoji ?? start?.emoji ?? '');
  const [ings, setIngs] = useState<Ingredient[]>(editing?.ingredients ?? start?.ingredients ?? []);
  // Tant qu'on n'a pas touché aux ingrédients, ils suivent le plat reconnu dans le carnet.
  const [fromCarnet, setFromCarnet] = useState<string | undefined>(editing ? undefined : start?.name);
  const [url, setUrl] = useState(editing?.url ?? '');
  const [steps, setSteps] = useState((editing?.steps ?? []).join('\n'));
  const [upcoming, setUpcoming] = useState(editing?.upcoming ?? true);
  const [newIng, setNewIng] = useState('');
  const [link, setLink] = useState('');
  const [reading, setReading] = useState(false);
  const [linkMsg, setLinkMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!editing && !initialName) input.current?.focus();
  }, [editing, initialName]);

  const suggestions = !editing && name.trim().length >= 2 && !fromCarnet ? suggestFromCarnet(name) : [];

  const pickCarnet = (c: CarnetRecette) => {
    setName(c.name);
    setEmoji(c.emoji);
    setIngs(c.ingredients);
    setFromCarnet(c.name);
  };

  const onName = (v: string) => {
    setName(v);
    if (editing) return;
    const c = findInCarnet(v);
    if (!fromCarnet && ings.length > 0) return; // ingrédients choisis à la main : on n'y touche pas
    if (c) {
      if (c.name !== fromCarnet) {
        setIngs(c.ingredients);
        setEmoji(c.emoji);
        setFromCarnet(c.name);
      }
    } else if (fromCarnet) {
      setIngs([]);
      setEmoji('');
      setFromCarnet(undefined);
    }
  };

  const addIng = () => {
    const parsed = parseIngredientLine(newIng);
    if (!parsed) return;
    setIngs((l) => [...l, parsed]);
    setNewIng('');
    setFromCarnet(undefined);
  };

  const readLink = async () => {
    if (!importRecipe) return setLinkMsg('La lecture des liens marche une fois l’app en ligne.');
    setReading(true);
    setLinkMsg('');
    try {
      const r = await importRecipe(link.trim());
      const list = r.ingredients.map(parseIngredientLine).filter((i): i is Ingredient => !!i);
      setIngs(list);
      setFromCarnet(undefined);
      setUrl(link.trim());
      if (r.steps?.length) setSteps(r.steps.join('\n'));
      if (!name.trim() && r.name) setName(r.name);
      const n = r.steps?.length ?? 0;
      setLinkMsg(`${list.length} ingrédient${list.length > 1 ? 's' : ''} récupéré${list.length > 1 ? 's' : ''}${n ? ` et ${n} étape${n > 1 ? 's' : ''}` : ''}.`);
      setLink('');
    } catch (e) {
      setLinkMsg(`Lecture impossible : ${e instanceof Error ? e.message : 'erreur inconnue'}`);
    } finally {
      setReading(false);
    }
  };

  const save = () => {
    const typed = name.trim();
    if (!typed) return;
    const n = typed.charAt(0).toUpperCase() + typed.slice(1);
    onSave({ name: n, emoji: emoji || emojiFor(n, '🍽️'), ingredients: ings, url: url || undefined, upcoming, steps: steps.split('\n').map((x) => x.trim()).filter(Boolean) });
  };

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="rs-title">
        <div className="grab" />
        <div className="sheet-head">
          <h2 id="rs-title">{editing ? 'Modifier la recette' : 'Nouvelle idée de plat'}</h2>
          <button className="icon-btn soft" aria-label="Fermer" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label htmlFor="rs-nom" className="field-label">
              Le plat
            </label>
            <input
              id="rs-nom"
              ref={input}
              className="text-input"
              value={name}
              onChange={(e) => onName(e.target.value)}
              placeholder="Lasagnes, curry, tartiflette…"
              autoComplete="off"
              enterKeyHint="done"
            />
            {suggestions.length > 0 && (
              <div className="rs-sugg" role="group" aria-label="Plats du carnet">
                {suggestions.map((c) => (
                  <button type="button" key={c.name} className="pill" onClick={() => pickCarnet(c)}>
                    <span aria-hidden="true">{c.emoji}</span> {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="field-label">
              Ingrédients {fromCarnet && <small>proposés par le carnet</small>}
            </p>
            {ings.length > 0 && (
              <ul className="rs-ings">
                {ings.map((i, k) => (
                  <li key={`${i.name}-${k}`}>
                    <span>
                      {i.name}
                      {i.qty && <span className="ing-qty"> · {i.qty}</span>}
                    </span>
                    <button
                      type="button"
                      aria-label={`Retirer ${i.name}`}
                      onClick={() => {
                        setIngs((l) => l.filter((_, j) => j !== k));
                        setFromCarnet(undefined);
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form
              className="rs-add"
              onSubmit={(e) => {
                e.preventDefault();
                addIng();
              }}
            >
              <input className="text-input" value={newIng} onChange={(e) => setNewIng(e.target.value)} placeholder="Ajouter : 200 g de lardons" aria-label="Ajouter un ingrédient" />
              <button type="submit" className="rchip" disabled={!newIng.trim()}>
                Ajouter
              </button>
            </form>
          </div>

          <div>
            <p className="field-label">
              Depuis un site de recettes <small>(facultatif)</small>
            </p>
            <form
              className="rs-add"
              onSubmit={(e) => {
                e.preventDefault();
                if (link.trim()) readLink();
              }}
            >
              <input
                className="text-input"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Coller le lien (Marmiton, 750g…)"
                inputMode="url"
                aria-label="Lien d’une recette"
              />
              <button type="submit" className="rchip" disabled={!link.trim() || reading}>
                {reading ? 'Lecture…' : 'Lire'}
              </button>
            </form>
            {linkMsg && <p className="recipe-note">{linkMsg}</p>}
            <a className="rchip ghost rs-search" href={`https://www.marmiton.org/recettes/recherche.aspx?aqt=${encodeURIComponent(name.trim() || 'recette')}`} target="_blank" rel="noreferrer">
              🔎 Chercher « {name.trim() || 'une recette'} » sur Marmiton
            </a>
            {url && !linkMsg && <p className="recipe-note">Lien enregistré : {url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</p>}
          </div>

          <div>
            <label htmlFor="rs-steps" className="field-label">
              <span>
                Préparation <small>(une étape par ligne)</small>
              </span>
            </label>
            <textarea
              id="rs-steps"
              className="text-input rs-steps"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder={'Faire revenir l’oignon et la viande.\nAjouter la sauce tomate, laisser mijoter 20 min.\n…'}
              rows={5}
            />
          </div>

          {!editing && (
            <label className="rs-check">
              <input type="checkbox" checked={upcoming} onChange={(e) => setUpcoming(e.target.checked)} />À cuisiner bientôt (dans « Prochaines recettes »)
            </label>
          )}

          <button type="button" className="primary" disabled={!name.trim()} onClick={save}>
            {editing ? 'Enregistrer' : 'Garder cette idée'}
          </button>
          {onDelete && (
            <button type="button" className="danger" onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}>
              {confirmDelete ? `Confirmer : supprimer « ${name || 'cette recette'} »` : 'Supprimer la recette'}
            </button>
          )}
        </div>
      </section>
    </>
  );
}
