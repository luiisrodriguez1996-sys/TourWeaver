"use client";

import React from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Shield } from 'lucide-react';

/**
 * Site version indicator.
 * Only visible to users with administrator role.
 */
export function VersionIndicator() {
  const { user, isUserLoading } = useUser();
  const documentDb = useFirestore();

  const adminRef = useMemoFirebase(() => {
    if (!documentDb || !user) return null;
    return doc(documentDb, 'roles_admin', user.uid);
  }, [documentDb, user]);

  const { data: adminData } = useDoc(adminRef);

  if (isUserLoading || !user || !adminData?.isAdmin) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20 transition-colors cursor-default select-none">
      <Shield className="w-2.5 h-2.5" />
      <span className="text-[9px] font-black tracking-wider uppercase">v1.5.6 Stable</span>
    </div>
  );
}
