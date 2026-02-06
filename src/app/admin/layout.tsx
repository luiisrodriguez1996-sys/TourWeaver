
"use client";

import React, { useState, useEffect } from 'react';
import { Globe, LayoutDashboard, Settings, LogOut, PlusCircle, Languages, Menu, ShieldAlert, ArrowLeft, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { VersionIndicator } from '@/components/VersionIndicator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDashboard = pathname === '/admin';

  // Ocultar el loader cuando cambia el pathname
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const handleNavigation = (path: string) => {
    if (path === pathname) {
      setIsMobileMenuOpen(false);
      return;
    }

    // Interceptación de navegación interna si hay cambios sin guardar
    if (typeof window !== 'undefined' && (window as any).__IS_DIRTY__) {
      const confirmLeave = window.confirm("Tienes cambios sin guardar en el editor. ¿Estás seguro de que quieres salir de esta página?");
      if (!confirmLeave) return;
      // Si el usuario acepta salir, limpiamos el flag
      (window as any).__IS_DIRTY__ = false;
    }

    setIsNavigating(true);
    setIsMobileMenuOpen(false);
    router.push(path);
  };

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

  const currentLang = siteConfig?.defaultLanguage || 'es';

  const menuText = {
    es: { properties: 'Propiedades', new: 'Nueva Propiedad', settings: 'Configuración', analytics: 'Estadísticas', logout: 'Cerrar Sesión', owner: 'PROPIETARIO', viewSite: 'Ver Sitio Público', management: 'Gestión de Servicios', back: 'Volver' },
    en: { properties: 'Properties', new: 'New Property', settings: 'Settings', analytics: 'Statistics', logout: 'Logout', owner: 'OWNER', viewSite: 'View Public Site', management: 'Service Management', back: 'Back' },
    pt: { properties: 'Propriedades', new: 'Nova Propriedade', settings: 'Configurações', analytics: 'Estatísticas', logout: 'Sair', owner: 'PROPRIETÁRIO', viewSite: 'Ver Site Público', management: 'Gestão de Servicios', back: 'Voltar' }
  }[currentLang as 'es' | 'en' | 'pt'] || { properties: 'Propiedades', new: 'Nueva Propiedad', settings: 'Configuración', analytics: 'Estadísticas', logout: 'Cerrar Sesión', owner: 'PROPIETARIO', viewSite: 'Ver Sitio Público', management: 'Gestión de Servicios', back: 'Volver' };

  const handleLogout = async () => {
    try {
      setIsNavigating(true);
      setIsMobileMenuOpen(false);
      await auth.signOut();
      router.push('/');
    } catch (error) {
      setIsNavigating(false);
      console.error('Error signing out:', error);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6">
        <button onClick={() => handleNavigation('/')} className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
            <Globe className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold font-headline tracking-tight text-primary">Tour Weaver</span>
        </button>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-3 rounded-xl transition-all duration-200", 
            pathname === '/admin' 
              ? 'bg-primary/10 text-primary font-bold' 
              : 'text-muted-foreground hover:bg-accent hover:text-white [&_svg]:hover:text-white'
          )}
          onClick={() => handleNavigation('/admin')}
        >
          <LayoutDashboard className="w-4 h-4" />
          {menuText.properties}
        </Button>

        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-3 rounded-xl transition-all duration-200", 
            pathname === '/admin/tours/new' 
              ? 'bg-primary/10 text-primary font-bold' 
              : 'text-muted-foreground hover:bg-accent hover:text-white [&_svg]:hover:text-white'
          )}
          onClick={() => handleNavigation('/admin/tours/new')}
        >
          <PlusCircle className="w-4 h-4" />
          {menuText.new}
        </Button>
        
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-3 rounded-xl transition-all duration-200", 
            pathname?.startsWith('/admin/analytics')
              ? 'bg-primary/10 text-primary font-bold' 
              : 'text-muted-foreground hover:bg-accent hover:text-white [&_svg]:hover:text-white'
          )}
          onClick={() => handleNavigation('/admin/analytics')}
        >
          <BarChart3 className="w-4 h-4" />
          {menuText.analytics}
        </Button>

        <Separator className="my-4" />
        
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-3 rounded-xl transition-all duration-200", 
            pathname === '/admin/settings' 
              ? 'bg-primary/10 text-primary font-bold' 
              : 'text-muted-foreground hover:bg-accent hover:text-white [&_svg]:hover:text-white'
          )}
          onClick={() => handleNavigation('/admin/settings')}
        >
          <Settings className="w-4 h-4" />
          {menuText.settings}
        </Button>

        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/5 mt-auto"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          {menuText.logout}
        </Button>
      </nav>

      <div className="p-4 border-t space-y-4">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-primary uppercase flex-shrink-0">
            {user?.email?.substring(0, 2) || 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground truncate uppercase">{menuText.owner}</p>
          </div>
        </div>
        <div className="px-2 pb-2">
          <VersionIndicator />
        </div>
      </div>
    </div>
  );

  if (isUserLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse font-medium">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  if (!user || !adminData || adminData.isAdmin !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center p-8 bg-white rounded-[2.5rem] shadow-xl max-w-md mx-4 w-full border border-border">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="text-destructive w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-8 text-balance">
            {!user 
              ? "Debes iniciar sesión con una cuenta autorizada para acceder al panel de administración." 
              : "Esta cuenta no tiene privilegios de administrador para gestionar tours."}
          </p>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 text-base font-semibold rounded-2xl" onClick={() => router.push('/login')}>
              Ir a Iniciar Sesión
            </Button>
            <Button variant="ghost" className="w-full h-12 text-base font-semibold rounded-2xl" onClick={() => router.push('/')}>
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] max-w-full overflow-x-hidden relative">
      {/* Global Navigation Loader */}
      {isNavigating && (
        <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 border border-border/50">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
              <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-primary tracking-widest uppercase animate-pulse">Cargando...</p>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      <main className="flex-1 md:ml-64 min-h-screen w-full overflow-x-hidden">
        <header className="h-16 border-b bg-white flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 w-full">
          <div className="flex items-center gap-4 min-w-0">
            {/* Mobile Menu Trigger */}
            <div className="md:hidden flex-shrink-0">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 max-w-[80vw]">
                  <div className="sr-only">
                    <SheetHeader>
                      <SheetTitle>Menú de Administración</SheetTitle>
                      <SheetDescription>Navegación lateral para la gestión de la plataforma</SheetDescription>
                    </SheetHeader>
                  </div>
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            </div>
            <h2 className="text-base md:text-lg font-semibold text-muted-foreground truncate">
              {menuText.management}
            </h2>
          </div>
          
          <div className="flex items-center gap-4 flex-shrink-0">
             {!isDashboard && (
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="gap-2 text-muted-foreground hover:text-primary rounded-xl"
                 onClick={() => handleNavigation('/admin')}
               >
                 <ArrowLeft className="w-4 h-4" />
                 <span className="hidden sm:inline font-bold uppercase tracking-wider text-[10px]">{menuText.back}</span>
               </Button>
             )}
          </div>
        </header>
        <div className="p-4 md:p-8 w-full max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
