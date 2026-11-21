export type Tab = 'courses' | 'cave';

/** Les deux onglets de l'en-tête : la liste de courses et la cave. */
export function Tabs({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <div className="tabs" role="tablist" aria-label="Listes">
      <button role="tab" aria-selected={tab === 'courses'} className={tab === 'courses' ? 'on' : ''} onClick={() => onTab('courses')}>
        <span aria-hidden="true">🛒</span> Courses
      </button>
      <button role="tab" aria-selected={tab === 'cave'} className={tab === 'cave' ? 'on' : ''} onClick={() => onTab('cave')}>
        <span aria-hidden="true">📦</span> Cave
      </button>
    </div>
  );
}
