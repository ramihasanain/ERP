/* eslint-disable no-undef */
// Firebase Messaging service worker (background notifications)
// Note: `public/` files can't use import.meta.env, so config is inlined.

importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyD3qSwCVSxKicb4janW6YVhY3MAbbr0DvI',
  authDomain: 'adex-erp.firebaseapp.com',
  projectId: 'adex-erp',
  storageBucket: 'adex-erp.firebasestorage.app',
  messagingSenderId: '7836156068',
  appId: '1:7836156068:web:d12e766faac94719ab2631',
});

const messaging = firebase.messaging();

// Handle background messages when the app isn't focused.
messaging.onBackgroundMessage((payload) => {
  const notif = payload?.notification || {};
  const title = notif.title || payload?.data?.title || 'Notification';
  const body = notif.body || payload?.data?.body || '';

  // Optional deep link: set by backend in `data.click_action` or `data.link`.
  const link = payload?.data?.click_action || payload?.data?.link || '/';

  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    data: { link },
  });
});

self.addEventListener('notificationclick', (event) => {
  const link = event?.notification?.data?.link || '/';
  event.notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      const appClient = allClients.find((c) => 'focus' in c);
      if (appClient) {
        await appClient.focus();
        try {
          appClient.postMessage({ type: 'FCM_NOTIFICATION_CLICK', link });
        } catch {
          // ignore
        }
      } else {
        await clients.openWindow(link);
      }
    })()
  );
});

