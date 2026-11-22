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
  /** Change le code famille ; absent en mode test. */
  onFamilyCode?: (code: string) => Promise<void>;
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

export function Settings({ me, prefs, familyCode, onFamilyCode, members, onRemoveMember, onChange, onBack, onInvite, onVoice, onLogout }: Props) {
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string>();
  const [codeEdit, setCodeEdit] = useState(false);
  const [codeDraft, setCodeDraft] = useState('');
  const [codeConfirm, setCodeConfirm] = useState(false);
  const [codeMsg, setCodeMsg] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);
  const cleanCode = codeDraft.replace(/\s/g, '').toUpperCase();
  const codeProblem = !cleanCode
    ? ''
    : !/^[A-Z0-9]+$/.test(cleanCode)
      ? 'Seulement des lettres et des chiffres, sans accent.'
      : cleanCode.length < 6
        ? `Encore ${6 - cleanCode.length} caractère${6 - cleanCode.length > 1 ? 's' : ''} au minimum.`
        : cleanCode.length > 20
          ? '20 caractères au maximum.'
          : cleanCode === familyCode
            ? 'C’est déjà votre code actuel.'
            : '';
  const closeCode = () => {
    setCodeEdit(false);
    setCodeConfirm(false);
    setCodeDraft('');
  };
  const saveCode = async () => {
    if (!onFamilyCode || codeProblem || !cleanCode) return;
    if (!codeConfirm) return setCodeConfirm(true);
    setCodeBusy(true);
    setCodeMsg('');
    try {
      await onFamilyCode(cleanCode);
      closeCode();
      setCodeMsg(`C’est fait. Le nouveau code est ${cleanCode}.`);
    } catch (e) {
      setCodeConfirm(false);
      setCodeMsg(e instanceof Error && e.message ? e.message : 'Impossible de changer le code.');
    } finally {
      setCodeBusy(false);
    }
  };
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
            {onFamilyCode && !codeEdit && (
              <>
                {' · '}
                <button
                  className="link-btn"
                  onClick={() => {
                    setCodeEdit(true);
                    setCodeMsg('');
                  }}
                >
                  Changer
                </button>
              </>
            )}
          </p>
        )}
        {codeEdit && (
          <div className="card code-edit">
            <label htmlFor="new-code" className="field-label">
              Nouveau code famille
            </label>
            <input
              id="new-code"
              className="text-input"
              autoFocus
              value={codeDraft}
              maxLength={24}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder="Par exemple CHAU2026"
              onChange={(e) => {
                setCodeDraft(e.target.value);
                setCodeConfirm(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveCode();
                if (e.key === 'Escape') closeCode();
              }}
            />
            <p className="hint">
              {codeProblem ||
                'De 6 à 20 lettres ou chiffres. Les membres déjà connectés restent connectés. Seuls les nouveaux devront taper ce code.'}
            </p>
            {codeConfirm && (
              <p className="hint" style={{ color: 'var(--text)' }}>
                L’ancien code <strong>{familyCode}</strong> ne marchera plus. Touchez encore pour confirmer.
              </p>
            )}
            <button className={codeConfirm ? 'primary' : 'secondary'} disabled={!cleanCode || !!codeProblem || codeBusy} onClick={saveCode}>
              {codeBusy ? 'Enregistrement…' : codeConfirm ? `Confirmer : le code devient ${cleanCode}` : 'Enregistrer ce code'}
            </button>
            <button className="link-btn" onClick={closeCode}>
              Annuler
            </button>
          </div>
        )}
        {codeMsg && (
          <p className="hint" role="status" style={{ textAlign: 'center' }}>
            {codeMsg}
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
