import type { SupabaseClient } from '@supabase/supabase-js';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

const toBytes = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

/** Demande l'autorisation et enregistre ce téléphone pour les notifications. */
export async function subscribePush(sb: SupabaseClient, memberId: string): Promise<void> {
  if (!VAPID_PUBLIC || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Notifications non disponibles ici (sur iPhone, installez d’abord l’app sur l’écran d’accueil).');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications bloquées pour cette app. Autorisez-les dans les réglages du téléphone, puis réessayez.');
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(VAPID_PUBLIC) }));
  const json = sub.toJSON();
  const { error } = await sb
    .from('push_subscriptions')
    .upsert({ endpoint: sub.endpoint, member_id: memberId, p256dh: json.keys!.p256dh, auth: json.keys!.auth });
  if (error) throw new Error(`Enregistrement des notifications impossible : ${error.message}`);
}

export async function unsubscribePush(sb: SupabaseClient): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}

/** Ce téléphone reçoit-il déjà les notifications ? */
export async function pushStatus(): Promise<'on' | 'off' | 'unsupported'> {
  if (!VAPID_PUBLIC || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'unsupported';
  if (Notification.permission !== 'granted') return 'off';
  const reg = await navigator.serviceWorker.ready;
  return (await reg.pushManager.getSubscription()) ? 'on' : 'off';
}
