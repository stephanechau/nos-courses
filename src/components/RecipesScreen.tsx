import type { ReactNode } from 'react';
import type { Member } from '../data/types';
import { section, type Recipe } from '../data/recettes';
import { Avatar, Bubbles } from './ListScreen';
import { BellIcon, MicIcon, PlusIcon } from './Icons';

interface Props {
  me: Member;
  members: Member[];
  recipes: Recipe[];
  /** Nombre d'ingrédients de chaque recette déjà dans la liste de courses. */
  inList: (r: Recipe) => number;
  missing: boolean;
  tabs: ReactNode;
  listening: boolean;
  onOpen: (r: Recipe) => void;
  onMove: (r: Recipe, dir: -1 | 1) => void;
  onUpcoming: (r: Recipe, upcoming: boolean) => void;
  onAdd: () => void;
  onVoice: () => void;
  onSettings: () => void;
}

function Row({ r, first, last, inList, onOpen, onMove, onUpcoming }: { r: Recipe; first: boolean; last: boolean; inList: number } & Pick<Props, 'onOpen' | 'onMove' | 'onUpcoming'>) {
  const n = r.ingredients.length;
  return (
    <li className="recipe-row">
      <button className="recipe-main" onClick={() => onOpen(r)} aria-label={`Ouvrir ${r.name}`}>
        <span className="recipe-emoji" aria-hidden="true">
          {r.emoji}
        </span>
        <span className="recipe-text">
          <strong>{r.name}</strong>
          <small>
            {n} ingrédient{n > 1 ? 's' : ''}
            {inList > 0 && ` · ${inList} dans la liste`}
          </small>
        </span>
      </button>
      {!r.upcoming && (
        <button className="recipe-next" onClick={() => onUpcoming(r, true)} aria-label={`Mettre ${r.name} dans les prochaines recettes`}>
          + Prochaines
        </button>
      )}
      <div className="recipe-move">
        <button disabled={first} onClick={() => onMove(r, -1)} aria-label={`Monter ${r.name}`}>
          ▲
        </button>
        <button disabled={last} onClick={() => onMove(r, 1)} aria-label={`Descendre ${r.name}`}>
          ▼
        </button>
      </div>
    </li>
  );
}

export function RecipesScreen(p: Props) {
  const next = section(p.recipes, true);
  const lib = section(p.recipes, false);
  const rows = (list: Recipe[]) => (
    <ul className="recipe-list">
      {list.map((r, i) => (
        <Row key={r.id} r={r} first={i === 0} last={i === list.length - 1} inList={p.inList(r)} onOpen={p.onOpen} onMove={p.onMove} onUpcoming={p.onUpcoming} />
      ))}
    </ul>
  );

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
        <h1>Idées de plats 🍲</h1>
        {p.tabs}
      </header>

      <main className="list">
        {p.missing ? (
          <p className="empty">
            <strong>Bientôt prête</strong>
            Il reste une petite étape à faire dans Supabase, depuis un ordinateur. Ensuite, vos idées de plats apparaîtront ici sur tous les téléphones.
          </p>
        ) : (
          p.recipes.length === 0 && (
            <p className="empty">
              <strong>Aucune idée pour l’instant</strong>
              Tapez le nom d’un plat en bas, par exemple « lasagnes » : les ingrédients sont proposés tout seuls.
            </p>
          )
        )}

        {next.length > 0 && (
          <section className="bcard" aria-labelledby="h-next">
            <div className="bcard-head">
              <h2 id="h-next">
                <span aria-hidden="true">🔥</span> Prochaines recettes
              </h2>
              <span className="bcard-count">
                {next.length} prévue{next.length > 1 ? 's' : ''}
              </span>
            </div>
            {rows(next)}
          </section>
        )}

        {lib.length > 0 && (
          <section className="bcard basket" aria-labelledby="h-lib">
            <div className="bcard-head">
              <h2 id="h-lib">
                <span aria-hidden="true">📚</span> Bibliothèque de recettes
              </h2>
              <span className="bcard-count">
                {lib.length} recette{lib.length > 1 ? 's' : ''}
              </span>
            </div>
            {rows(lib)}
          </section>
        )}
        {p.recipes.length > 0 && <p className="bhint">Touchez une recette pour voir ses ingrédients et les ajouter aux courses.</p>}
      </main>

      {!p.missing && (
        <div className="addbar">
          <button className="addbar-field" onClick={p.onAdd}>
            <PlusIcon />
            Nouvelle idée de plat…
          </button>
          <button className={`mic${p.listening ? ' listening' : ''}`} aria-label={p.listening ? 'J’écoute…' : 'Dire le nom d’un plat'} onClick={p.onVoice}>
            <MicIcon size={26} />
          </button>
        </div>
      )}
    </div>
  );
}
