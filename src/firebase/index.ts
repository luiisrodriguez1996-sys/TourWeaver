'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

/**
 * Initializes Firebase services and App Check.
 * App Check is configured with reCAPTCHA Enterprise for production-grade security.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    const sdks = getSdks(firebaseApp);

    // PRIORIDAD 1: Persistencia de sesión
    // Configuramos que la sesión persista localmente para comodidad del administrador.
    if (sdks.auth) {
      setPersistence(sdks.auth, browserLocalPersistence).catch((err) => {
        console.error("Auth persistence failed:", err);
      });
    }

    // Initialize App Check only on the client side
    if (typeof window !== 'undefined') {
      const appCheckSiteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY || (firebaseConfig as any).appCheckSiteKey;
      
      if (appCheckSiteKey) {
        try {
          initializeAppCheck(firebaseApp, {
            provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
            isTokenAutoRefreshEnabled: true,
          });
          console.log('Firebase App Check: Active Security Shield.');
        } catch (err) {
          console.error('Firebase App Check failed to initialize:', err);
        }
      }
    }

    return sdks;
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
