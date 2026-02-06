
"use client";

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * Inyecta dinámicamente el meta tag de verificación de Google Search Console.
 */
export function GoogleSearchConsoleVerification() {
  const firestore = useFirestore();
  const siteConfigRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'siteConfigurations', 'default');
  }, [firestore]);

  const { data: siteConfig } = useDoc(siteConfigRef);
  const verificationCode = siteConfig?.googleSearchConsoleCode;

  if (typeof window === 'undefined' || !verificationCode || verificationCode.trim() === '') {
    return null;
  }

  // Comprobar si ya existe el meta tag para evitar duplicados
  const existingMeta = document.querySelector('meta[name="google-site-verification"]');
  if (existingMeta) {
    if (existingMeta.getAttribute('content') !== verificationCode) {
      existingMeta.setAttribute('content', verificationCode);
    }
    return null;
  }

  // Crear e insertar el meta tag
  const meta = document.createElement('meta');
  meta.name = "google-site-verification";
  meta.content = verificationCode;
  document.head.appendChild(meta);

  return null;
}
