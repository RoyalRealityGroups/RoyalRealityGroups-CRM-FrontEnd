/**
 * Firebase Cloud Messaging (FCM) — Web Push Notifications
 *
 * This module initializes Firebase and handles FCM token registration
 * for receiving push notifications in the browser.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import apiClient from '../api/axios.config';

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Firebase config — fetched from the backend general settings.
 * Falls back to env variables if available.
 */
let firebaseConfig: Record<string, string> | null = null;

/**
 * Initialize Firebase with config from the backend.
 */
export async function initFirebase(): Promise<boolean> {
  if (app) return true; // Already initialized

  try {
    // Fetch config from backend general settings
    const response = await apiClient.get('/api/general/general-settings/');
    const settings = response.data;

    if (!settings.fcm_enabled || !settings.fcm_project_id || !settings.fcm_api_key) {
      console.log('[Firebase] FCM not configured or disabled');
      return false;
    }

    firebaseConfig = {
      apiKey: settings.fcm_api_key,
      authDomain: settings.fcm_auth_domain || `${settings.fcm_project_id}.firebaseapp.com`,
      projectId: settings.fcm_project_id,
      storageBucket: settings.fcm_storage_bucket || `${settings.fcm_project_id}.firebasestorage.app`,
      messagingSenderId: settings.fcm_sender_id,
      appId: settings.fcm_web_app_id,
    };

    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);

    // Register service worker and pass config
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      registration.active?.postMessage({
        type: 'FIREBASE_CONFIG',
        config: firebaseConfig,
      });
    }

    console.log('[Firebase] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error);
    return false;
  }
}

/**
 * Request notification permission and get FCM token.
 * Registers the token with the backend Device table.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (!messaging) {
      const initialized = await initFirebase();
      if (!initialized) return null;
    }

    // Request browser notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[Firebase] Notification permission denied');
      return null;
    }

    // Get FCM token
    const response = await apiClient.get('/api/general/general-settings/');
    const vapidKey = response.data?.fcm_vapid_key;

    const token = await getToken(messaging!, {
      vapidKey: vapidKey || undefined,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration(),
    });

    if (token) {
      console.log('[Firebase] FCM token obtained');
      // Register token with backend
      await registerDeviceToken(token);
      return token;
    }

    console.log('[Firebase] No FCM token available');
    return null;
  } catch (error) {
    console.error('[Firebase] Failed to get token:', error);
    return null;
  }
}

/**
 * Register the FCM token with the backend by updating the user's device.
 */
async function registerDeviceToken(fcmToken: string): Promise<void> {
  try {
    await apiClient.post('/api/users/userdevices/update-fcm/', {
      fcmtoken: fcmToken,
    });
    console.log('[Firebase] FCM token registered with backend');
  } catch (error) {
    console.error('[Firebase] Failed to register device token:', error);
    sessionStorage.setItem('fcm_token', fcmToken);
  }
}

/**
 * Listen for foreground messages (when app is in focus).
 */
export function onForegroundMessage(callback: (payload: any) => void): void {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('[Firebase] Foreground message received:', payload);
    callback(payload);
  });
}

/**
 * Get stored FCM token (for use during login).
 */
export function getStoredFcmToken(): string {
  return sessionStorage.getItem('fcm_token') || '';
}
