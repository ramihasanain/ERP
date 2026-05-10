import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const SW_PATH = '/firebase-messaging-sw.js';

export async function registerFcmServiceWorker() {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  return await navigator.serviceWorker.register(SW_PATH);
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  return await Notification.requestPermission();
}

export async function getFcmRegistrationToken() {
  if (typeof window === 'undefined') return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return null;

  const registration = await registerFcmServiceWorker();
  const messaging = getMessaging(firebaseApp);

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) throw new Error('Missing VITE_FIREBASE_VAPID_KEY');

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration || undefined,
  });

  return token || null;
}

export function getStoredFcmToken() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('fcm_registration_token');
  } catch {
    return null;
  }
}

export function storeFcmToken(token) {
  if (typeof window === 'undefined') return;
  try {
    if (!token) {
      localStorage.removeItem('fcm_registration_token');
      return;
    }
    localStorage.setItem('fcm_registration_token', token);
  } catch {
    // ignore
  }
}

export async function subscribeToForegroundMessages(handler) {
  if (typeof window === 'undefined') return () => {};

  const supported = await isSupported().catch(() => false);
  if (!supported) return () => {};

  const messaging = getMessaging(firebaseApp);
  const unsubscribe = onMessage(messaging, (payload) => {
    handler?.(payload);
  });

  return unsubscribe;
}

