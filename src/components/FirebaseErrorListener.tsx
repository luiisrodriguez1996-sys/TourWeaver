'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { usePathname } from 'next/navigation';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It throws any received error to be caught by Next.js's global-error.tsx,
 * except on public tour pages where we prefer local graceful handling.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Si estamos en la vista pública del tour, dejamos que el componente local maneje el error
      // para mostrar un mensaje de "Acceso denegado" en lugar de crashear la app.
      if (pathname?.startsWith('/tour/')) {
        return;
      }
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [pathname]);

  if (error) {
    throw error;
  }

  return null;
}
