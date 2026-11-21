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

pickBackend().then((backend) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App backend={backend} />
    </StrictMode>
  );
});
