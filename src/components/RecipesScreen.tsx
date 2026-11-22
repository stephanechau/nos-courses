import { useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
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
  onDelete: (r: Recipe) => void;
  onAdd: () => void;
  onVoice: () => void;
  onSettings: () => void;
}

const SWIPE = 90; // distance (px) à partir de laquelle le geste est validé

function Row({ r, first, last, inList, onOpen, onMove, onUpcoming, onDelete }: { r: Recipe; first: boolean; last: boolean; inList: number } & Pick<Props, 'onOpen' | 'onMove' | 'onUpcoming' | 'onDelete'>) {
  const n = r.ingredients.length;
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<0 | 1 | -1>(0);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);

  const down = (e: RPointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    dragging.current = false;
    moved.current = false;
  };
  const move = (e: RPointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const x = e.clientX - s.x;
    const y = e.clientY - s.y;
    if (!dragging.current) {
      if (Math.abs(x) < 10 || Math.abs(x) < Math.abs(y) * 1.5) {
        if (Math.abs(y) > 10) start.current = null; // défilement vertical : on laisse faire
        return;
      }
      dragging.current = true;
      moved.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    setDx(x);
  };
  const up = () => {
    const was = dragging.current;
    start.current = null;
    dragging.current = false;
    if (!was) return;
    if (dx <= -SWIPE) {
      setLeaving(-1);
      window.setTimeout(() => onDelete(r), 220);
    } else if (dx >= SWIPE) {
      setLeaving(1);
      window.setTimeout(() => {
        onUpcoming(r, !r.upcoming);
        setLeaving(0);
        setDx(0);
      }, 220);
    } else setDx(0);
  };
  const shift = leaving ? `${leaving * 110}%` : `${dx}px`;
  const rightLabel = r.upcoming ? '📚 Bibliothèque' : '🔥 Prochaines';

  return (
    <li className="recipe-swipe">
      <div className="swipe-bg" aria-hidden="true">
        <span className={`swipe-right${dx > 0 || leaving === 1 ? ' on' : ''}${dx >= SWIPE ? ' ready' : ''}`}>{rightLabel}</span>
        <span className={`swipe-left${dx < 0 || leaving === -1 ? ' on' : ''}${dx <= -SWIPE ? ' ready' : ''}`}>🗑 Supprimer</span>
      </div>
    <div
      className={`recipe-row${dragging.current ? ' dragging' : ''}`}
      style={{ transform: `translateX(${shift})` }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onClickCapture={(e) => {
        if (moved.current) {
          e.stopPropagation();
          e.preventDefault();
          moved.current = false;
        }
      }}
    >
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
        <Row key={r.id} r={r} first={i === 0} last={i === list.length - 1} inList={p.inList(r)} onOpen={p.onOpen} onMove={p.onMove} onUpcoming={p.onUpcoming} onDelete={p.onDelete} />
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
        {p.recipes.length > 0 && <p className="bhint">Touchez une recette pour l’ouvrir. Glissez-la vers la droite pour la ranger, vers la gauche pour la supprimer.</p>}
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
