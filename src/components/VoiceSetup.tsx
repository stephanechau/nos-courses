import { useEffect, useState } from 'react';
import type { Backend } from '../data/backend';
import { BackIcon } from './Icons';

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

/** Explique comment ajouter des articles avec Siri ou l'assistant Android. */
export function VoiceSetup({ backend, onBack }: { backend: Backend; onBack: () => void }) {
  const [setup, setSetup] = useState<{ endpoint: string; token: string }>();
  const [copied, setCopied] = useState('');
  const [ios, setIos] = useState(isIOS());

  useEffect(() => {
    backend.voiceSetup?.().then(setSetup).catch(() => {});
  }, [backend]);

  const copy = async (label: string, text: string) => {
    await navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const appUrl = `${location.origin}${location.pathname}`;

  return (
    <div className="app">
      <header className="page-head">
        <button className="icon-btn soft" aria-label="Retour" onClick={onBack}>
          <BackIcon />
        </button>
        <h1>Assistant vocal</h1>
      </header>
      <main className="page">
        <div className="rayons" role="tablist" aria-label="Téléphone" style={{ marginTop: 0 }}>
          <button role="tab" aria-selected={ios} className={`pill${ios ? ' on' : ''}`} onClick={() => setIos(true)}>
            iPhone (Siri)
          </button>
          <button role="tab" aria-selected={!ios} className={`pill${!ios ? ' on' : ''}`} onClick={() => setIos(false)}>
            Android
          </button>
        </div>

        {ios ? (
          <section className="card" style={{ padding: '16px 18px', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 10px', fontWeight: 800 }}>Dites « Dis Siri, courses », puis « farine et pâtes ».</p>
            <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Ouvrez le lien du raccourci « Courses » envoyé par Stéphane, puis touchez « Ajouter le raccourci ».</li>
              <li>Quand le raccourci le demande, collez votre jeton personnel ci-dessous.</li>
              <li>C’est tout : le nom du raccourci, « Courses », est la phrase à dire à Siri.</li>
            </ol>
          </section>
        ) : (
          <section className="card" style={{ padding: '16px 18px', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 10px', fontWeight: 800 }}>Deux façons d’ajouter à la voix :</p>
            <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>
                Appui long sur l’icône de l’app, puis « Ajouter à la voix » : l’app s’ouvre et écoute directement. Vous pouvez glisser ce raccourci sur
                l’écran d’accueil.
              </li>
              <li>Dites « Ok Google, ouvre Nos courses », puis touchez le micro.</li>
            </ol>
          </section>
        )}

        {setup && (
          <section className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <strong>Votre jeton personnel</strong>
            <span className="hint" style={{ margin: 0 }}>
              Il permet au raccourci d’ajouter des articles en votre nom. Ne le partagez pas.
            </span>
            <code style={{ background: 'var(--ground)', padding: '10px 12px', borderRadius: 12, fontSize: 13, wordBreak: 'break-all' }}>{setup.token}</code>
            <button className="secondary" onClick={() => copy('jeton', setup.token)}>
              {copied === 'jeton' ? 'Copié !' : 'Copier mon jeton'}
            </button>
          </section>
        )}

        <button className="secondary" onClick={() => copy('lien', `${appUrl}?voix=1`)}>
          {copied === 'lien' ? 'Copié !' : 'Copier le lien « écouter tout de suite »'}
        </button>
      </main>
    </div>
  );
}
