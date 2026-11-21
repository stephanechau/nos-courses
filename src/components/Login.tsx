import { useEffect, useState } from 'react';
import type { Backend } from '../data/backend';
import { BasketIcon } from './Icons';

export const MEMBER_COLORS = ['#2F5FA8', '#B0521A', '#6B4BA8', '#1F7672', '#A1306B', '#5B6B1E'];

type Mode = 'choice' | 'join' | 'create';

/**
 * Écran « Rejoindre la famille ».
 * Pas d'e-mail ni de mot de passe : on tape le code famille (ou on arrive par le lien
 * d'invitation), puis son prénom et sa couleur. Une seule fois par téléphone.
 */
export function Login({ backend }: { backend: Backend }) {
  const pending = backend.pendingCode();
  const [mode, setMode] = useState<Mode>(!backend.online ? 'create' : pending ? 'join' : 'choice');
  const [code, setCode] = useState(pending ?? '');
  const [inviter, setInviter] = useState<string>();
  const [name, setName] = useState('');
  const [color, setColor] = useState(MEMBER_COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (code.trim().length < 6) return setInviter(undefined);
    const t = setTimeout(() => backend.inviterName(code).then(setInviter).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [backend, code]);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await backend.join(name.trim(), color, mode === 'join' ? code : undefined);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Une erreur est survenue, réessayez.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <div className="welcome">
        <div className="logo">
          <BasketIcon size={54} color="#11706F" />
        </div>
        <h1>Nos courses</h1>
        <p>{inviter ? `${inviter} vous invite à partager la liste de courses de la famille.` : 'La liste de courses partagée de la famille.'}</p>
      </div>

      {mode === 'choice' && (
        <div className="login">
          <h2>Bienvenue !</h2>
          <button className="primary" onClick={() => setMode('join')}>
            J’ai un code famille
          </button>
          <button className="secondary" onClick={() => setMode('create')}>
            Créer la liste de ma famille
          </button>
          <p className="hint" style={{ textAlign: 'center' }}>
            Une seule personne crée la liste, puis invite les autres depuis les réglages.
          </p>
        </div>
      )}

      {(mode === 'join' || mode === 'create') && (
        <form
          className="login"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) submit();
          }}
        >
          <h2>{mode === 'join' ? 'Rejoindre la famille' : 'Qui êtes-vous ?'}</h2>
          {mode === 'join' && (
            <>
              <label htmlFor="code" className="field-label">
                Code famille
              </label>
              <input
                id="code"
                className="text-input"
                style={{ marginTop: 0, textTransform: 'uppercase', letterSpacing: 4, fontWeight: 800, fontSize: 20, textAlign: 'center' }}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
              />
            </>
          )}
          <label htmlFor="prenom" className="field-label">
            Votre prénom
          </label>
          <input id="prenom" className="text-input" style={{ marginTop: 0 }} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
          <p className="field-label">Votre couleur</p>
          <div className="colors" role="radiogroup" aria-label="Votre couleur">
            {MEMBER_COLORS.map((c, i) => (
              <button
                type="button"
                key={c}
                role="radio"
                aria-checked={c === color}
                aria-label={`Couleur ${i + 1}`}
                className={`color${c === color ? ' on' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <button type="submit" className="primary" disabled={busy || !name.trim() || (mode === 'join' && code.trim().length < 6)} style={{ marginTop: 12 }}>
            {mode === 'join' ? 'Rejoindre la liste' : 'Créer la liste'}
          </button>
          {backend.online && (
            <button type="button" className="link-btn" onClick={() => setMode('choice')}>
              Retour
            </button>
          )}
          <p className="hint" style={{ textAlign: 'center' }}>
            Pas de mot de passe. Vous ne le ferez qu’une fois sur ce téléphone.
          </p>
        </form>
      )}

      {error && (
        <p className="hint" role="alert" style={{ color: '#a1302b', textAlign: 'center', padding: '0 24px' }}>
          {error}
        </p>
      )}
    </div>
  );
}
