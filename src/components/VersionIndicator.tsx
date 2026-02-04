"use client";

import React from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Shield } from 'lucide-react';

/**
 * Indicador de versión del sitio.
 * Solo visible para usuarios con rol de administrador.
 */
export function VersionIndicator() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const adminRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminData } = useDoc(adminRef);

  // Si no hay usuario, está cargando, o no es admin, no mostramos nada
  if (isUserLoading || !user || !adminData?.isAdmin) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none">
      <div className="bg-primary/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-2xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 pointer-events-auto hover:bg-primary transition-colors cursor-default">
        <Shield className="w-3 h-3" />
        <span className="text-[10px] font-bold tracking-wider uppercase">v1.1.0 Admin Mode</span>
      </div>
    </div>
  );
}
