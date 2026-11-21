import type { ListStore, Member, NotificationPrefs } from './types';
import { createLocalStore } from './localStore';

/** Ce que l'app attend du service en ligne (Supabase) ou du mode test local. */
export interface Backend {
  store: ListStore;
  /** Appelé avec le membre connecté, ou null s'il faut se connecter. */
  onSession(cb: (me: Member | null) => void): () => void;
  onMembers(cb: (members: Member[]) => void): () => void;
  join(name: string, color: string): Promise<void>;
  logout(): Promise<void>;
  /** Nom de la personne qui invite (lien d'invitation), s'il y en a un. */
  inviterName(): Promise<string | undefined>;
  /** Connexion par code reçu par e-mail (absent en mode test). */
  emailLogin?: {
    sendCode(email: string): Promise<void>;
    /** Renvoie true si le compte a déjà un profil dans la famille. */
    verifyCode(email: string, code: string): Promise<boolean>;
  };
  inviteLink(): string;
  /** Adresse et jeton personnel pour les raccourcis vocaux (absent en mode test). */
  voiceSetup?(): Promise<{ endpoint: string; token: string }>;
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
    inviterName: async () => undefined,
    inviteLink: () => location.origin,
    getPrefs: async () => get(PREFS, DEFAULT_PREFS),
    setPrefs: async (p) => set(PREFS, p)
  };
}

export { DEFAULT_PREFS };
