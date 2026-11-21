import type { ListStore, Member, NotificationPrefs } from './types';
import { createLocalStore } from './localStore';
import { createLocalCave, type CaveStore } from './cave';

/** Ce que l'app attend du service en ligne (Supabase) ou du mode test local. */
export interface Backend {
  store: ListStore;
  /** Le stock de la cave. */
  cave: CaveStore;
  /** Appelé avec le membre connecté, ou null s'il faut se connecter. */
  onSession(cb: (me: Member | null) => void): () => void;
  onMembers(cb: (members: Member[]) => void): () => void;
  /** Rejoint la famille du code donné, ou crée la famille si aucun code. */
  join(name: string, color: string, familyCode?: string): Promise<void>;
  logout(): Promise<void>;
  /** true si les données sont partagées en ligne (false en mode test). */
  online: boolean;
  /** Code famille reçu par un lien d'invitation, s'il y en a un. */
  pendingCode(): string | undefined;
  /** Nom de la personne qui a créé la famille de ce code. */
  inviterName(familyCode: string): Promise<string | undefined>;
  /** Code et lien d'invitation de sa propre famille. */
  invitation(): Promise<{ code: string; link: string } | undefined>;
  /** Adresse et jeton personnel pour les raccourcis vocaux (absent en mode test). */
  voiceSetup?(): Promise<{ endpoint: string; token: string }>;
  /** Notifications sur ce téléphone : actives, à activer, ou impossibles ici. */
  pushStatus(): Promise<'on' | 'off' | 'unsupported'>;
  /** Retire un membre de la famille. */
  removeMember(id: string): Promise<void>;
  getPrefs(): Promise<NotificationPrefs>;
  setPrefs(p: NotificationPrefs): Promise<void>;
}

const DEFAULT_PREFS: NotificationPrefs = { onAdd: true, grouped: true, quietNight: true, onShopping: false };

/** Mode test : tout reste dans ce navigateur. */
export function createLocalBackend(): Backend {
  const store = createLocalStore();
  const ME = 'nos-courses:me';
  const MEMBERS = 'nos-courses:members';
  const PREFS = 'nos-courses:prefs';
  const get = <T,>(k: string, f: T): T => {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : f;
    } catch {
      return f;
    }
  };
  const set = (k: string, v: unknown) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* ignoré */
    }
  };
  const sessionCbs = new Set<(m: Member | null) => void>();
  const memberCbs = new Set<(m: Member[]) => void>();

  return {
    store,
    cave: createLocalCave(),
    onSession(cb) {
      sessionCbs.add(cb);
      cb(get<Member | null>(ME, null));
      return () => sessionCbs.delete(cb);
    },
    onMembers(cb) {
      memberCbs.add(cb);
      cb(get<Member[]>(MEMBERS, []));
      return () => memberCbs.delete(cb);
    },
    async join(name, color) {
      const me: Member = { id: Math.random().toString(36).slice(2), name, color };
      const members = [...get<Member[]>(MEMBERS, []), me];
      set(MEMBERS, members);
      set(ME, me);
      sessionCbs.forEach((cb) => cb(me));
      memberCbs.forEach((cb) => cb(members));
    },
    async logout() {
      localStorage.removeItem(ME);
      sessionCbs.forEach((cb) => cb(null));
    },
    online: false,
    pendingCode: () => undefined,
    inviterName: async () => undefined,
    invitation: async () => undefined,
    pushStatus: async () => 'unsupported',
    async removeMember(id) {
      const members = get<Member[]>(MEMBERS, []).filter((m) => m.id !== id);
      set(MEMBERS, members);
      memberCbs.forEach((cb) => cb(members));
    },
    getPrefs: async () => get(PREFS, DEFAULT_PREFS),
    setPrefs: async (p) => set(PREFS, p)
  };
}

export { DEFAULT_PREFS };
