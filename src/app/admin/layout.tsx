"use client";

import React from 'react';
import { Globe, LayoutDashboard, Settings, LogOut, PlusCircle, Languages } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const adminRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminRef);

  const siteConfigRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'siteConfigurations', 'default');
  }, [firestore]);

  const { data: siteConfig } = useDoc(siteConfigRef);

  const isSpanish = siteConfig?.defaultLanguage !== 'en';

  if (isUserLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <p className="text-muted-foreground animate-pulse">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  // Verificación estricta: debe existir el documento y isAdmin debe ser true (booleano)
  if (!user || !adminData || adminData.isAdmin !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogOut className="text-destructive w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-8">Este portal está restringido al propietario. Si eres el administrador, asegúrate de tener los permisos correctos en la base de datos.</p>
          <Link href="/">
            <Button className="w-full">Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col fixed inset-y-0">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
              <Globe className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold font-headline tracking-tight text-primary">Tour Weaver</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary">
              <LayoutDashboard className="w-4 h-4" />
              Tours
            </Button>
          </Link>
          <Link href="/admin/tours/new">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary">
              <PlusCircle className="w-4 h-4" />
              {isSpanish ? 'Nuevo Encargo' : 'New Assignment'}
            </Button>
          </Link>
          <Separator className="my-4" />
          <Link href="/admin/settings">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary">
              <Settings className="w-4 h-4" />
              {isSpanish ? 'Configuración' : 'Settings'}
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-primary uppercase">
              {user.email?.substring(0, 2) || 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground truncate uppercase">{isSpanish ? 'PROPIETARIO' : 'OWNER'}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 min-h-screen">
        <header className="h-16 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-40">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {isSpanish ? 'Gestión de Servicios' : 'Service Management'}
          </h2>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
               <Languages className="w-4 h-4" />
               <span>{isSpanish ? 'Español' : 'English'}</span>
             </div>
             <Button variant="outline" size="sm" onClick={() => router.push('/')}>
               {isSpanish ? 'Ver Sitio Público' : 'View Public Site'}
             </Button>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
