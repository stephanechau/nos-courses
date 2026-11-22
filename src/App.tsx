import { useCallback, useEffect, useRef, useState } from 'react';
import type { Item, Member, NewItem, NotificationPrefs } from './data/types';
import type { Backend } from './data/backend';
import { LISTS, type ListId } from './data/lists';
import { listenOnce, parseSpoken, speechAvailable } from './data/speech';
import { ListScreen } from './components/ListScreen';
import { AddSheet } from './components/AddSheet';
import { Settings } from './components/Settings';
import { CarrefourWalk } from './components/CarrefourWalk';
import { CaveScreen } from './components/CaveScreen';
import { CaveSheet } from './components/CaveSheet';
import { Tabs, type Tab } from './components/Tabs';
import { guessCaveCat, type NewStock, type StockItem } from './data/cave';
import { openCarrefour } from './data/carrefour';
import { Login } from './components/Login';
import { VoiceSetup } from './components/VoiceSetup';

type View = { kind: 'list' } | { kind: 'add' } | { kind: 'edit'; item: Item } | { kind: 'settings' } | { kind: 'voice' } | { kind: 'carrefour'; items: Item[] } | { kind: 'caveAdd' } | { kind: 'caveEdit'; item: StockItem };

const PUSH_DISMISSED = 'nos-courses:push-banner-masque';
const TAB_KEY = 'nos-courses:onglet';

export default function App({ backend }: { backend: Backend }) {
  const [me, setMe] = useState<Member | null | undefined>(undefined); // undefined = chargement
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [chinoisItems, setChinoisItems] = useState<Item[]>([]);
  const [chinoisMissing, setChinoisMissing] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>({ onAdd: true, grouped: true, quietNight: true, onShopping: false });
  const [view, setView] = useState<View>({ kind: 'list' });
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState('');
  const [familyCode, setFamilyCode] = useState<string>();
  const [pushOff, setPushOff] = useState(false);
  const [tab, setTabState] = useState<Tab>(() => {
    try {
      const t = localStorage.getItem(TAB_KEY);
      return t === 'cave' || t === 'chinois' ? t : 'courses';
    } catch {
      return 'courses';
    }
  });
  const setTab = (t: Tab) => {
    setTabState(t);
    setToast('');
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {
      /* ignoré */
    }
  };
  const [stock, setStock] = useState<StockItem[]>([]);
  const [caveMissing, setCaveMissing] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(() => {
    try {
      return localStorage.getItem(PUSH_DISMISSED) === '1';
    } catch {
      return false;
    }
  });
  const toastTimer = useRef<number>(0);
  const handledUrl = useRef(false);

  const say = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), Math.max(3000, msg.length * 70));
  }, []);

  useEffect(() => backend.onSession(setMe), [backend]);

  useEffect(() => {
    if (!me) return;
    const offItems = backend.store.subscribe(setItems);
    const offChinois = backend.chinois.subscribe(
      (i) => {
        setChinoisMissing(false);
        setChinoisItems(i);
      },
      () => setChinoisMissing(true)
    );
    const offMembers = backend.onMembers(setMembers);
    const offCave = backend.cave.subscribe(
      (s) => {
        setCaveMissing(false);
        setStock(s);
      },
      () => setCaveMissing(true)
    );
    backend.getPrefs().then(setPrefs);
    backend.invitation().then((i) => setFamilyCode(i?.code)).catch(() => {});
    backend
      .pushStatus()
      .then((st) => setPushOff(st === 'off'))
      .catch(() => {});
    return () => {
      offItems();
      offChinois();
      offMembers();
      offCave();
    };
  }, [backend, me]);

  const addNames = useCallback(
    async (names: string[], voice: boolean, list: ListId = 'courses') => {
      if (!me || names.length === 0) return;
      const store = list === 'chinois' ? backend.chinois : backend.store;
      for (const name of names) await store.add({ name, rayon: LISTS[list].guess(name), voice }, me.id);
      say(names.length === 1 ? `« ${names[0]} » ajouté` : `${names.length} articles ajoutés : ${names.join(', ')}`);
    },
    [backend, me, say]
  );

  const dictate = useCallback(async (handle: (names: string[]) => Promise<void>) => {
    if (!speechAvailable()) {
      say('La dictée n’est pas disponible sur ce navigateur.');
      return;
    }
    setListening(true);
    let text = '';
    try {
      text = await listenOnce().promise;
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      setListening(false);
      if (code === 'not-allowed' || code === 'service-not-allowed')
        return say('Micro bloqué : autorisez le micro pour cette app dans les réglages du téléphone.');
      if (code === 'network') return say('La dictée a besoin d’internet, réessayez.');
      if (code === 'audio-capture') return say('Aucun micro disponible.');
      if (code === 'no-speech' || code === 'aborted') return say('Je n’ai rien entendu, réessayez.');
      return say(`Dictée impossible (${code || 'erreur inconnue'}).`);
    }
    try {
      await handle(parseSpoken(text));
    } catch (e) {
      say(e instanceof Error && e.message ? `Impossible d’enregistrer : ${e.message}` : 'Impossible d’enregistrer.');
    } finally {
      setListening(false);
    }
  }, [say]);

  const voice = useCallback((list: ListId = 'courses') => dictate((names) => addNames(names, true, list)), [dictate, addNames]);

  const storeInCave = useCallback(
    async (names: string[]) => {
      if (!me || names.length === 0) return;
      for (const name of names) await backend.cave.add({ name, category: guessCaveCat(name), qty: 1 }, me.id);
      say(names.length === 1 ? `« ${names[0]} » rangé à la cave` : `${names.length} objets rangés : ${names.join(', ')}`);
    },
    [backend, me, say]
  );

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

  if (view.kind === 'carrefour')
    return (
      <CarrefourWalk
        items={view.items}
        members={members}
        onInBasket={(it) => backend.store.setDone(it.id, true, me.id).catch(() => say('Impossible de cocher cet article.'))}
        onClose={() => setView({ kind: 'list' })}
      />
    );

  if (view.kind === 'voice') return <VoiceSetup backend={backend} onBack={() => setView({ kind: 'settings' })} />;

  if (view.kind === 'settings') {
    return (
      <Settings
        me={me}
        prefs={prefs}
        onChange={(p) => {
          setPrefs(p);
          backend
            .setPrefs(p)
            .then(() => {
              if ((p.onAdd || p.onShopping) && backend.online) {
                setPushOff(false);
                say('Notifications activées sur ce téléphone');
              }
            })
            .catch((e) => say(e instanceof Error && e.message ? e.message : 'Impossible d’activer les notifications sur ce téléphone.'));
        }}
        onBack={() => setView({ kind: 'list' })}
        familyCode={familyCode}
        members={members}
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

  const tabs = <Tabs tab={tab} onTab={setTab} />;

  if (tab === 'cave') {
    const saveStock = async (data: NewStock) => {
      try {
        if (view.kind === 'caveEdit') await backend.cave.update(view.item.id, data, me.id);
        else {
          await backend.cave.add(data, me.id);
          say(`« ${data.name} » rangé à la cave`);
        }
        setView({ kind: 'list' });
      } catch (e) {
        say(`Impossible d’enregistrer : ${e instanceof Error ? e.message : 'erreur inconnue'}`);
      }
    };
    return (
      <>
        <CaveScreen
          me={me}
          members={members}
          items={stock}
          missing={caveMissing}
          tabs={tabs}
          listening={listening}
          onQty={(it, q) => backend.cave.setQty(it.id, q, me.id).catch(() => say('Impossible de modifier la quantité.'))}
          onEdit={(item) => setView({ kind: 'caveEdit', item })}
          onAdd={() => {
            setToast('');
            setView({ kind: 'caveAdd' });
          }}
          onVoice={() => dictate(storeInCave)}
          onRemove={(it) => backend.cave.remove(it.id).catch(() => say('Impossible de retirer cet objet.'))}
          onToShopping={(it) =>
            addNames([it.name], false).catch((e) => say(`Impossible d’ajouter : ${e instanceof Error ? e.message : 'erreur inconnue'}`))
          }
          onSettings={() => setView({ kind: 'settings' })}
        />
        {(view.kind === 'caveAdd' || view.kind === 'caveEdit') && (
          <CaveSheet
            editing={view.kind === 'caveEdit' ? view.item : undefined}
            onSave={saveStock}
            onDelete={
              view.kind === 'caveEdit'
                ? async () => {
                    await backend.cave.remove(view.item.id).catch(() => say('Impossible de supprimer.'));
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

  const listId: ListId = tab === 'chinois' ? 'chinois' : 'courses';
  const kind = LISTS[listId];
  const store = listId === 'chinois' ? backend.chinois : backend.store;
  const listItems = listId === 'chinois' ? chinoisItems : items;
  const oops = (e: unknown) => say(`Impossible : ${e instanceof Error ? e.message : 'erreur inconnue'}`);

  const save = async (data: NewItem) => {
    try {
      if (view.kind === 'edit') await store.update(view.item.id, data);
      else {
        await store.add(data, me.id);
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
        key={listId}
        kind={kind}
        missing={listId === 'chinois' && chinoisMissing}
        me={me}
        members={members}
        items={listItems}
        listening={listening}
        onToggle={(it) => store.setDone(it.id, !it.done, me.id).catch(oops)}
        onEdit={(item) => setView({ kind: 'edit', item })}
        onAdd={() => {
          setToast('');
          setView({ kind: 'add' });
        }}
        onVoice={() => voice(listId)}
        onClearDone={() => store.clearDone().catch(oops)}
        onSettings={() => setView({ kind: 'settings' })}
        tabs={tabs}
        showPushBanner={pushOff && !pushDismissed}
        onCarrefourAll={
          kind.carrefour
            ? () => {
                const order = (id: string) => kind.rayons.findIndex((r) => r.id === id);
                const todo = listItems.filter((i) => !i.done).sort((a, b) => order(a.rayon) - order(b.rayon) || a.createdAt - b.createdAt);
                setView({ kind: 'carrefour', items: todo });
              }
            : undefined
        }
        onEnablePush={() => {
          const p = { ...prefs, onAdd: true };
          setPrefs(p);
          backend
            .setPrefs(p)
            .then(() => {
              setPushOff(false);
              say('Notifications activées sur ce téléphone');
            })
            .catch((e) => say(e instanceof Error && e.message ? e.message : 'Impossible d’activer les notifications.'));
        }}
        onDismissPush={() => {
          setPushDismissed(true);
          try {
            localStorage.setItem(PUSH_DISMISSED, '1');
          } catch {
            /* ignoré */
          }
        }}
      />
      {(view.kind === 'add' || view.kind === 'edit') && (
        <AddSheet
          kind={kind}
          editing={view.kind === 'edit' ? view.item : undefined}
          onCarrefour={kind.carrefour ? openCarrefour : undefined}
          history={store.history()}
          onSave={save}
          onDelete={
            view.kind === 'edit'
              ? async () => {
                  await store.remove(view.item.id).catch(oops);
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
