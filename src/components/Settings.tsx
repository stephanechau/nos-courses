import type { Member, NotificationPrefs } from '../data/types';
import { BackIcon } from './Icons';

interface Props {
  me: Member;
  prefs: NotificationPrefs;
  onChange: (p: NotificationPrefs) => void;
  onBack: () => void;
  onInvite: () => void;
  onVoice: () => void;
  onLogout: () => void;
}

const ROWS: { key: keyof NotificationPrefs; title: string; desc: string }[] = [
  { key: 'onAdd', title: 'Quand un article est ajouté', desc: 'Savoir ce que la famille ajoute, et par qui.' },
  { key: 'grouped', title: 'Regrouper les ajouts', desc: 'Une seule notification si plusieurs articles arrivent en quelques minutes.' },
  { key: 'quietNight', title: 'Silence la nuit', desc: 'Rien entre 22 h et 7 h, tout arrive le matin.' },
  { key: 'onShopping', title: 'Quand quelqu’un fait les courses', desc: 'Être prévenu quand un membre commence à cocher la liste.' }
];

export function Settings({ me, prefs, onChange, onBack, onInvite, onVoice, onLogout }: Props) {
  return (
    <div className="app">
      <header className="page-head">
        <button className="icon-btn soft" aria-label="Retour" onClick={onBack}>
          <BackIcon />
        </button>
        <h1>Réglages</h1>
      </header>
      <main className="page">
        <section>
          <h2 className="hint" style={{ fontWeight: 800, marginBottom: 10 }}>
            Notifications
          </h2>
          <div className="card">
            {ROWS.map((r) => (
              <div className="setting" key={r.key}>
                <div>
                  <strong id={`s-${r.key}`}>{r.title}</strong>
                  <span>{r.desc}</span>
                </div>
                <button
                  className="switch"
                  role="switch"
                  aria-checked={prefs[r.key]}
                  aria-labelledby={`s-${r.key}`}
                  onClick={() => onChange({ ...prefs, [r.key]: !prefs[r.key] })}
                >
                  <span />
                </button>
              </div>
            ))}
          </div>
        </section>
        <p className="hint">
          Vous ne recevez jamais de notification pour vos propres ajouts. Sur iPhone, il faut d’abord installer l’app sur l’écran d’accueil
          (bouton Partager, puis « Sur l’écran d’accueil »).
        </p>
        <button className="secondary" onClick={onVoice}>
          Ajouter avec Siri ou l’assistant Android
        </button>
        <button className="secondary" onClick={onInvite}>
          Inviter un membre de la famille
        </button>
        <button className="danger" onClick={onLogout}>
          Se déconnecter ({me.name})
        </button>
      </main>
    </div>
  );
}
