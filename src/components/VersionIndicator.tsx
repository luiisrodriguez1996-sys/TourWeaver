
"use client";

import React from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Shield } from 'lucide-react';

/**
 * Indicador de versión del sitio.
 * Solo visible para usuarios con rol de administrador.
 * Ahora diseñado para integrarse en footers o barras laterales.
 */
export function VersionIndicator() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const adminRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminData } = useDoc(adminRef);

  if (isUserLoading || !user || !adminData?.isAdmin) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20 transition-colors cursor-default select-none">
      <Shield className="w-2.5 h-2.5" />
      <span className="text-[9px] font-black tracking-wider uppercase">v1.1.3 Admin Mode</span>
    </div>
  );
}
