import { useState } from 'react';
import type { Member, NotificationPrefs } from '../data/types';
import { BackIcon } from './Icons';
import { Avatar } from './ListScreen';

interface Props {
  me: Member;
  prefs: NotificationPrefs;
  onChange: (p: NotificationPrefs) => void;
  onBack: () => void;
  familyCode?: string;
  members: Member[];
  onRemoveMember: (m: Member) => void;
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

export function Settings({ me, prefs, familyCode, members, onRemoveMember, onChange, onBack, onInvite, onVoice, onLogout }: Props) {
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string>();
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
        <section>
          <h2 className="hint" style={{ fontWeight: 800, marginBottom: 10 }}>
            La famille
          </h2>
          <div className="card">
            {members.map((m) => (
              <div className="setting member" key={m.id}>
                <Avatar m={m} size={36} />
                <div>
                  <strong>
                    {m.name}
                    {m.id === me.id ? ' (vous)' : ''}
                  </strong>
                </div>
                {m.id !== me.id && (
                  <button
                    className={`danger small${confirmRemove === m.id ? ' confirm' : ''}`}
                    onClick={() => {
                      if (confirmRemove === m.id) {
                        setConfirmRemove(undefined);
                        onRemoveMember(m);
                      } else setConfirmRemove(m.id);
                    }}
                  >
                    {confirmRemove === m.id ? 'Confirmer' : 'Retirer'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
        <p className="hint">Une personne retirée pourra revenir en retapant le code famille. Ses articles restent dans la liste.</p>
        <button className="secondary" onClick={onVoice}>
          Ajouter avec Siri ou l’assistant Android
        </button>
        <button className="secondary" onClick={onInvite}>
          Inviter un membre de la famille
        </button>
        {familyCode && (
          <p className="hint" style={{ textAlign: 'center' }}>
            Code famille : <strong style={{ letterSpacing: 3, color: 'var(--text)' }}>{familyCode}</strong>
          </p>
        )}
        <button className="danger" onClick={() => (confirmLeave ? onLogout() : setConfirmLeave(true))}>
          {confirmLeave ? `Confirmer : ${me.name} quitte la liste sur ce téléphone` : 'Quitter la liste sur ce téléphone'}
        </button>
        {confirmLeave && (
          <p className="hint" style={{ textAlign: 'center' }}>
            Pour revenir ensuite, il suffira de retaper le code famille.
          </p>
        )}
      </main>
    </div>
  );
}
