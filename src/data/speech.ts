// Reconnaissance vocale du navigateur (Chrome Android, Safari iOS 14.5+).

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

const Ctor = (): (new () => Recognition) | undefined => {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => Recognition) | undefined;
};

export const speechAvailable = (): boolean => typeof window !== 'undefined' && !!Ctor();

/** Écoute une phrase et renvoie le texte reconnu. */
export function listenOnce(): { promise: Promise<string>; stop: () => void } {
  const C = Ctor();
  if (!C) return { promise: Promise.reject(new Error('unsupported')), stop: () => {} };
  const rec = new C();
  rec.lang = 'fr-FR';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  const promise = new Promise<string>((resolve, reject) => {
    let text = '';
    rec.onresult = (e) => {
      text = e.results[0]?.[0]?.transcript ?? '';
    };
    rec.onerror = (e) => reject(new Error(e.error));
    rec.onend = () => (text ? resolve(text) : reject(new Error('no-speech')));
  });
  rec.start();
  return { promise, stop: () => rec.stop() };
}

export { parseSpoken } from '../../supabase/functions/_shared/texte.ts';
