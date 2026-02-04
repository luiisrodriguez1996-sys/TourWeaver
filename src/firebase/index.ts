'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION STRUCTURE
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      // Initialize with config object for consistency across environments
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      console.warn('Firebase initialization fallback triggered.', e);
      firebaseApp = initializeApp(firebaseConfig);
    }

    // Initialize App Check only on the client side
    if (typeof window !== 'undefined') {
      const appCheckSiteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;
      
      if (appCheckSiteKey) {
        try {
          // Explicit initialization of reCAPTCHA Enterprise
          initializeAppCheck(firebaseApp, {
            provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
            isTokenAutoRefreshEnabled: true,
          });
        } catch (err) {
          // Failure to init App Check shouldn't crash the entire app load
          console.error('Firebase App Check failed to initialize:', err);
        }
      } else {
        console.warn('App Check Site Key is missing. Please set NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY in your environment variables.');
      }
    }

    return getSdks(firebaseApp);
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
