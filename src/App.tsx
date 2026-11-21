import { useCallback, useEffect, useRef, useState } from 'react';
import type { Item, Member, NewItem, NotificationPrefs } from './data/types';
import type { Backend } from './data/backend';
import { guessRayon } from './data/rayons';
import { listenOnce, parseSpoken, speechAvailable } from './data/speech';
import { ListScreen } from './components/ListScreen';
import { AddSheet } from './components/AddSheet';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { VoiceSetup } from './components/VoiceSetup';

type View = { kind: 'list' } | { kind: 'add' } | { kind: 'edit'; item: Item } | { kind: 'settings' } | { kind: 'voice' };

export default function App({ backend }: { backend: Backend }) {
  const [me, setMe] = useState<Member | null | undefined>(undefined); // undefined = chargement
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [prefs, setPrefs] = useState<NotificationPrefs>({ onAdd: true, grouped: true, quietNight: true, onShopping: false });
  const [view, setView] = useState<View>({ kind: 'list' });
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState('');
  const [familyCode, setFamilyCode] = useState<string>();
  const [isCreator, setIsCreator] = useState(false);
  const toastTimer = useRef<number>(0);
  const handledUrl = useRef(false);

  const say = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => backend.onSession(setMe), [backend]);

  useEffect(() => {
    if (!me) return;
    const offItems = backend.store.subscribe(setItems);
    const offMembers = backend.onMembers(setMembers);
    backend.getPrefs().then(setPrefs);
    backend.invitation().then((i) => setFamilyCode(i?.code)).catch(() => {});
    backend.isCreator().then(setIsCreator).catch(() => {});
    return () => {
      offItems();
      offMembers();
    };
  }, [backend, me]);

  const addNames = useCallback(
    async (names: string[], voice: boolean) => {
      if (!me || names.length === 0) return;
      for (const name of names) await backend.store.add({ name, rayon: guessRayon(name), voice }, me.id);
      say(names.length === 1 ? `« ${names[0]} » ajouté` : `${names.length} articles ajoutés : ${names.join(', ')}`);
    },
    [backend, me, say]
  );

  const voice = useCallback(async () => {
    if (!speechAvailable()) {
      say('La dictée n’est pas disponible sur ce navigateur.');
      return;
    }
    setListening(true);
    try {
      const text = await listenOnce().promise;
      await addNames(parseSpoken(text), true);
    } catch {
      say('Je n’ai rien entendu, réessayez.');
    } finally {
      setListening(false);
    }
  }, [addNames, say]);

  // Liens utilisés par les raccourcis : /?ajout=farine,pâtes  ou  /?voix=1
  useEffect(() => {
    if (!me || handledUrl.current) return;
    handledUrl.current = true;
    const q = new URLSearchParams(location.search);
    const ajout = q.get('ajout');
    if (ajout) addNames(parseSpoken(ajout), true);
    if (q.get('voix')) voice();
    if (ajout || q.get('voix')) history.replaceState(null, '', location.pathname);
  }, [me, addNames, voice]);

  if (me === undefined) return null;
  if (me === null) return <Login backend={backend} />;

  if (view.kind === 'voice') return <VoiceSetup backend={backend} onBack={() => setView({ kind: 'settings' })} />;

  if (view.kind === 'settings') {
    return (
      <Settings
        me={me}
        prefs={prefs}
        onChange={(p) => {
          setPrefs(p);
          backend.setPrefs(p).catch(() => say('Impossible d’activer les notifications sur ce téléphone.'));
        }}
        onBack={() => setView({ kind: 'list' })}
        familyCode={familyCode}
        members={members}
        isCreator={isCreator}
        onRemoveMember={(m) =>
          backend
            .removeMember(m.id)
            .then(() => say(`${m.name} a été retiré de la famille`))
            .catch((e) => say(e instanceof Error && e.message ? e.message : 'Impossible de retirer ce membre.'))
        }
        onInvite={async () => {
          const inv = await backend.invitation();
          if (!inv) return say('Invitation disponible une fois l’app en ligne.');
          const text = `Rejoins notre liste de courses « Nos courses » : ${inv.link}\nCode famille : ${inv.code}`;
          if (navigator.share) await navigator.share({ title: 'Nos courses', text }).catch(() => {});
          else {
            await navigator.clipboard?.writeText(text);
            say('Invitation copiée');
          }
        }}
        onVoice={() => setView({ kind: 'voice' })}
        onLogout={() => backend.logout()}
      />
    );
  }

  const save = async (data: NewItem) => {
    try {
      if (view.kind === 'edit') await backend.store.update(view.item.id, data);
      else {
        await backend.store.add(data, me.id);
        say(`« ${data.name} » ajouté`);
      }
      setView({ kind: 'list' });
    } catch (e) {
      say(`Impossible d’enregistrer : ${e instanceof Error ? e.message : 'erreur inconnue'}`);
    }
  };

  return (
    <>
      <ListScreen
        me={me}
        members={members}
        items={items}
        listening={listening}
        onToggle={(it) => backend.store.setDone(it.id, !it.done, me.id)}
        onEdit={(item) => setView({ kind: 'edit', item })}
        onAdd={() => {
          setToast('');
          setView({ kind: 'add' });
        }}
        onVoice={voice}
        onClearDone={() => backend.store.clearDone()}
        onSettings={() => setView({ kind: 'settings' })}
      />
      {(view.kind === 'add' || view.kind === 'edit') && (
        <AddSheet
          editing={view.kind === 'edit' ? view.item : undefined}
          history={backend.store.history()}
          onSave={save}
          onDelete={
            view.kind === 'edit'
              ? async () => {
                  await backend.store.remove(view.item.id);
                  setView({ kind: 'list' });
                }
              : undefined
          }
          onClose={() => setView({ kind: 'list' })}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
