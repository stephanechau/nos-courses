import { normalize } from './rayons';
import type { ListId } from './lists';

/** Rayons choisis à la main, retenus pour la famille : clé « liste|nom normalisé » → rayon. */
export type RayonMemo = Record<string, string>;

export interface MemoStore {
  subscribe(cb: (memo: RayonMemo) => void): () => void;
  /** Retient le rayon choisi à la main pour cet article. */
  remember(list: ListId, name: string, rayon: string): Promise<void>;
}

export const memoKey = (list: string, name: string) => `${list}|${normalize(name)}`;

const KEY = 'nos-courses:rayons-retenus';

/** Mode test : retenu dans ce navigateur. */
export function createLocalMemo(): MemoStore {
  let memo: RayonMemo = {};
  try {
    memo = JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    /* vide */
  }
  const listeners = new Set<(m: RayonMemo) => void>();
  return {
    subscribe(cb) {
      listeners.add(cb);
      cb(memo);
      return () => listeners.delete(cb);
    },
    async remember(list, name, rayon) {
      memo = { ...memo, [memoKey(list, name)]: rayon };
      try {
        localStorage.setItem(KEY, JSON.stringify(memo));
      } catch {
        /* ignoré */
      }
      listeners.forEach((cb) => cb(memo));
    }
  };
}
