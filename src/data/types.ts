export interface Member {
  id: string;
  name: string;
  color: string;
}

export interface Item {
  id: string;
  name: string;
  rayon: string;
  qty?: string;
  note?: string;
  addedBy: string; // id du membre
  voice?: boolean; // ajouté par un assistant vocal
  done: boolean;
  doneBy?: string;
  createdAt: number;
}

export type NewItem = Pick<Item, 'name' | 'rayon' | 'qty' | 'note' | 'voice'>;

export interface NotificationPrefs {
  onAdd: boolean;
  grouped: boolean;
  quietNight: boolean;
  onShopping: boolean;
}

/**
 * Tout ce dont l'interface a besoin pour lire et modifier la liste.
 * L'implémentation locale sert au développement ; une implémentation
 * en ligne (Supabase ou Firebase) la remplacera sans toucher aux écrans.
 */
export interface ListStore {
  /** onMissing : la liste n'est pas encore installée dans la base. */
  subscribe(cb: (items: Item[]) => void, onMissing?: () => void): () => void;
  add(item: NewItem, by: string): Promise<void>;
  setDone(id: string, done: boolean, by: string): Promise<void>;
  update(id: string, patch: Partial<NewItem>): Promise<void>;
  remove(id: string): Promise<void>;
  clearDone(): Promise<void>;
  /** Noms déjà achetés, pour les suggestions. */
  history(): string[];
}
