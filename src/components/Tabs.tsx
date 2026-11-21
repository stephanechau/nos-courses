export type Tab = 'courses' | 'chinois' | 'cave';

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'courses', emoji: '🛒', label: 'Courses' },
  { id: 'chinois', emoji: '🥢', label: 'Chinois' },
  { id: 'cave', emoji: '📦', label: 'Cave' }
];

/** Les onglets de l'en-tête : courses, magasin chinois et cave. */
export function Tabs({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <div className="tabs" role="tablist" aria-label="Listes">
      {TABS.map((t) => (
        <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => onTab(t.id)}>
          <span aria-hidden="true">{t.emoji}</span> {t.label}
        </button>
      ))}
    </div>
  );
}
