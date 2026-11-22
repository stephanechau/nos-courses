import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { createLocalBackend, type Backend } from './data/backend';
import './styles.css';

async function pickBackend(): Promise<Backend> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (url && key) {
    const { createSupabaseBackend } = await import('./data/supabaseBackend');
    return createSupabaseBackend(url, key);
  }
  return createLocalBackend();
}

// Mise à jour : dès qu'une nouvelle version est installée, on recharge l'app pour l'utiliser tout de suite.
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });
  // Quand on revient dans l'app, on regarde s'il y a une nouvelle version.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') navigator.serviceWorker.getRegistration().then((r) => r?.update()).catch(() => {});
  });
}

pickBackend().then((backend) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App backend={backend} />
    </StrictMode>
  );
});
