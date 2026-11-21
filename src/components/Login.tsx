import { useEffect, useState } from 'react';
import type { Backend } from '../data/backend';
import { BasketIcon } from './Icons';

export const MEMBER_COLORS = ['#2F5FA8', '#B0521A', '#6B4BA8', '#1F7672', '#A1306B', '#5B6B1E'];

type Step = 'email' | 'code' | 'profile';

/** Écran « Rejoindre la famille » : e-mail, code reçu, puis prénom et couleur. */
export function Login({ backend }: { backend: Backend }) {
  const [inviter, setInviter] = useState<string>();
  const [step, setStep] = useState<Step>(backend.emailLogin ? 'email' : 'profile');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState(MEMBER_COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    backend.inviterName().then(setInviter).catch(() => {});
  }, [backend]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
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

      {step === 'email' && (
        <form
          className="login"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await backend.emailLogin!.sendCode(email.trim());
              setStep('code');
            });
          }}
        >
          <h2>Connectez-vous</h2>
          <label htmlFor="mail" className="field-label">
            Votre adresse e-mail
          </label>
          <input id="mail" type="email" required className="text-input" style={{ marginTop: 0 }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom@exemple.fr" autoComplete="email" />
          <button type="submit" className="primary" disabled={busy || !email.includes('@')}>
            Recevoir un code
          </button>
          <p className="hint" style={{ textAlign: 'center' }}>
            Pas de mot de passe à retenir. Vous ne le ferez qu’une fois, ensuite vous restez connecté.
          </p>
        </form>
      )}

      {step === 'code' && (
        <form
          className="login"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const hasProfile = await backend.emailLogin!.verifyCode(email.trim(), code.trim());
              if (!hasProfile) setStep('profile');
            });
          }}
        >
          <h2>Entrez le code reçu</h2>
          <p className="hint" style={{ textAlign: 'center' }}>
            Nous venons d’envoyer un code à {email}. Pensez à regarder dans les courriers indésirables.
          </p>
          <label htmlFor="code" className="sr-only">
            Code reçu par e-mail
          </label>
          <input
            id="code"
            className="text-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            style={{ textAlign: 'center', fontSize: 26, letterSpacing: 8, fontWeight: 800 }}
          />
          <button type="submit" className="primary" disabled={busy || code.length < 6}>
            Valider
          </button>
          <button type="button" className="link-btn" onClick={() => setStep('email')}>
            Changer d’adresse
          </button>
        </form>
      )}

      {step === 'profile' && (
        <form
          className="login"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) run(() => backend.join(name.trim(), color));
          }}
        >
          <h2>Qui êtes-vous ?</h2>
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
          <button type="submit" className="primary" disabled={busy || !name.trim()} style={{ marginTop: 12 }}>
            Rejoindre la liste
          </button>
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
