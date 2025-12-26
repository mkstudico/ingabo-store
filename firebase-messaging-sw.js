// Firebase Cloud Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAQsQAEGPdFY2gKRBpC3crZTSEzUGQ4CKE",
    authDomain: "ingabo-store.firebaseapp.com",
    projectId: "ingabo-store",
    storageBucket: "ingabo-store.firebasestorage.app",
    messagingSenderId: "1059301382626",
    appId: "1:1059301382626:web:98f0a8cebbeccbc21f41bb",
    measurementId: "G-QSXTGP9R1Q"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    
    // Customize notification here
    const notificationTitle = payload.notification.title || 'INGABO Store';
    const notificationOptions = {
        body: payload.notification.body || 'You have a new notification',
        icon: 'https://i.ibb.co/1fjd5Ncn/logo.png',
        badge: 'https://i.ibb.co/1fjd5Ncn/logo.png',
        data: payload.data || {},
        actions: [
            {
                action: 'open',
                title: 'Open App'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };

    // Show notification
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click received:', event);
    
    event.notification.close();

    if (event.action === 'open') {
        // Open the app
        event.waitUntil(
            clients.matchAll({type: 'window', includeUncontrolled: true})
            .then((windowClients) => {
                // Check if there's already a window/tab open
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    // If so, just focus it
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not, open a new window/tab
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    } else if (event.action === 'close') {
        // Just close the notification
        event.notification.close();
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Push subscription handler
self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('[firebase-messaging-sw.js] Push subscription changed:', event);
    
    event.waitUntil(
        messaging.getToken().then((token) => {
            if (token) {
                // Send new token to server
                fetch('/api/update-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: token,
                        userId: 'current-user-id' // This should be obtained from your app
                    })
                });
            }
        }).catch((error) => {
            console.error('[firebase-messaging-sw.js] Error getting token:', error);
        })
    );
});

// Install event - cache important files
self.addEventListener('install', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker installing...');
    
    event.waitUntil(
        caches.open('ingabo-cache-v1').then((cache) => {
            return cache.addAll([
                '/',
                '/indexp.html',
                '/account.html',
                'https://i.ibb.co/1fjd5Ncn/logo.png'
            ]);
        })
    );
    
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== 'ingabo-cache-v1') {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    return self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
