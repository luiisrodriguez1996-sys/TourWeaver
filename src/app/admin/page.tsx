
"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit3, 
  ExternalLink, 
  MoreVertical, 
  Trash2, 
  Eye, 
  EyeOff, 
  Briefcase, 
  AlertTriangle, 
  User, 
  Folder, 
  LayoutGrid, 
  ArrowLeft,
  ChevronRight,
  Loader2,
  BarChart3
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function AdminDashboardContent() {
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [tourToDeleteId, setTourToDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'clients'>('all');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  
  const searchTerm = searchParams.get('search')?.toLowerCase() || '';

  useEffect(() => {
    const savedView = localStorage.getItem('adminViewPreference') as 'all' | 'clients';
    if (savedView) setViewMode(savedView);
  }, []);

  useEffect(() => {
    if (tourToDeleteId === null) {
      const cleanup = () => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
        const hiddenElements = document.querySelectorAll('[data-aria-hidden="true"], [aria-hidden="true"]');
        hiddenElements.forEach(el => {
          el.removeAttribute('data-aria-hidden');
          el.removeAttribute('aria-hidden');
        });
      };
      cleanup();
      const timer = setTimeout(cleanup, 300);
      return () => clearTimeout(timer);
    }
  }, [tourToDeleteId]);

  const handleViewChange = (val: string) => {
    const mode = val as 'all' | 'clients';
    setViewMode(mode);
    localStorage.setItem('adminViewPreference', mode);
    setSelectedClient(null);
  };

  const toursRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tours');
  }, [firestore]);

  const { data: tours, isLoading } = useCollection(toursRef);

  const siteConfigRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'siteConfigurations', 'default');
  }, [firestore]);
  const { data: siteConfig } = useDoc(siteConfigRef);
  const isSpanish = siteConfig?.defaultLanguage !== 'en';

  const filteredTours = useMemo(() => {
    if (!tours) return [];
    if (!searchTerm) return tours;
    return tours.filter(t => 
      t.name.toLowerCase().includes(searchTerm) || 
      (t.clientName && t.clientName.toLowerCase().includes(searchTerm))
    );
  }, [tours, searchTerm]);

  const togglePublish = (id: string, currentStatus: boolean) => {
    if (!firestore) return;
    setLoadingActions(prev => ({ ...prev, [id]: true }));
    const tourRef = doc(firestore, 'tours', id);
    updateDocumentNonBlocking(tourRef, { published: !currentStatus });
    
    setTimeout(() => {
      setLoadingActions(prev => ({ ...prev, [id]: false }));
      toast({
        title: currentStatus ? (isSpanish ? "Propiedad Privada" : "Private Property") : (isSpanish ? "Propiedad Publicada" : "Property Published"),
        description: currentStatus ? (isSpanish ? "El tour ya no es visible para el público." : "The tour is no longer visible to the public.") : (isSpanish ? "El tour ahora es accesible mediante su enlace." : "The tour is now accessible via its link."),
      });
    }, 500);
  };

  const handleDeleteConfirm = () => {
    if (!firestore || !tourToDeleteId) return;
    
    setLoadingActions(prev => ({ ...prev, [`delete-${tourToDeleteId}`]: true }));
    const tourRef = doc(firestore, 'tours', tourToDeleteId);
    deleteDocumentNonBlocking(tourRef);
    
    setTimeout(() => {
      setLoadingActions(prev => ({ ...prev, [`delete-${tourToDeleteId}`]: false }));
      toast({
        variant: "destructive",
        title: isSpanish ? "Propiedad Eliminada" : "Property Deleted",
        description: isSpanish ? "El tour ha sido borrado permanentemente." : "The tour has been permanently deleted.",
      });
      setTourToDeleteId(null);
    }, 500);
  };

  const handleNavigateTo = (path: string, id: string) => {
    setIsNavigating(id);
    router.push(path);
  };

  const clients = useMemo(() => {
    if (!filteredTours) return [];
    return Array.from(new Set(filteredTours.map((t: any) => t.clientName || (isSpanish ? 'Sin Cliente' : 'No Client'))));
  }, [filteredTours, isSpanish]);

  const groupedTours = useMemo(() => {
    if (!filteredTours) return {};
    return filteredTours.reduce((acc: any, tour: any) => {
      const client = tour.clientName || (isSpanish ? 'Sin Cliente' : 'No Client');
      if (!acc[client]) acc[client] = [];
      acc[client].push(tour);
      return acc;
    }, {});
  }, [filteredTours, isSpanish]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={`skeleton-load-${i}`} className="aspect-video w-full rounded-xl" />)}
      </div>
    );
  }

  const renderTourCard = (tour: any) => (
    <Card key={tour.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none shadow-md flex flex-col h-full">
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img 
          src={tour.thumbnailUrl || 'https://picsum.photos/seed/placeholder/600/400'} 
          alt={tour.name} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          data-ai-hint="virtual tour"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          {loadingActions[tour.id] ? (
            <Badge className="bg-primary/20 text-primary border-primary/20"><Loader2 className="w-3 h-3 animate-spin mr-1" /> Actualizando</Badge>
          ) : (
            <Badge className={tour.published ? 'bg-green-500' : 'bg-gray-400'}>
              {tour.published ? (isSpanish ? 'Activo' : 'Active') : (isSpanish ? 'Privado' : 'Private')}
            </Badge>
          )}
        </div>
      </div>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase mb-1">
              <User className="w-3 h-3" /> {tour.clientName || (isSpanish ? 'Sin Cliente' : 'No Client')}
            </div>
            <CardTitle className="text-lg md:text-xl line-clamp-1">{tour.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={loadingActions[tour.id]}>
                {loadingActions[tour.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer" onClick={() => togglePublish(tour.id, tour.published)}>
                {tour.published ? (
                  <><EyeOff className="mr-2 h-4 w-4" /> Hacer Privada</>
                ) : (
                  <><Eye className="mr-2 h-4 w-4" /> Publicar</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive" 
                onSelect={(e) => {
                  e.preventDefault();
                  setTourToDeleteId(tour.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> {isSpanish ? 'Eliminar Propiedad' : 'Delete Property'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardFooter className="gap-2 border-t pt-4 bg-gray-50/50 mt-auto">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1 gap-2 text-primary border-primary hover:bg-primary hover:text-white min-w-0"
          onClick={() => handleNavigateTo(`/admin/tours/${tour.id}`, `manage-${tour.id}`)}
          disabled={isNavigating === `manage-${tour.id}`}
        >
          {isNavigating === `manage-${tour.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />} 
          <span className="truncate hidden sm:inline md:hidden 2xl:inline">
            {isSpanish ? 'Gestionar' : 'Manage'}
          </span>
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:bg-muted-foreground hover:text-white transition-all shrink-0" 
          title={isSpanish ? "Ver Estadísticas" : "View Statistics"}
          onClick={() => handleNavigateTo(`/admin/analytics/tours/${tour.id}`, `stats-${tour.id}`)}
          disabled={isNavigating === `stats-${tour.id}`}
        >
          {isNavigating === `stats-${tour.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="text-accent hover:bg-accent hover:text-white transition-all shrink-0"
          title={isSpanish ? "Ver Tour" : "View Tour"}
          onClick={() => window.open(`/tour/${tour.slug}`, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="max-w-full">
          <h1 className="text-2xl md:text-3xl font-bold font-headline truncate">
            {isSpanish ? 'Gestión de Propiedades' : 'Property Management'}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Organiza y publica tus tours virtuales profesionales
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-1 max-w-full">
          <Tabs value={viewMode} onValueChange={handleViewChange} className="bg-white p-1 rounded-xl shadow-sm border flex-shrink-0">
            <TabsList className="bg-transparent border-none">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">{isSpanish ? 'Todos' : 'All'}</span>
              </TabsTrigger>
              <TabsTrigger value="clients" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                <Folder className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">{isSpanish ? 'Por Clientes' : 'By Clients'}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button 
            type="button" 
            className="bg-primary hover:bg-primary/90 rounded-xl px-4 md:px-6 flex-shrink-0"
            onClick={() => handleNavigateTo('/admin/tours/new', 'new-btn')}
            disabled={isNavigating === 'new-btn'}
          >
            {isNavigating === 'new-btn' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isSpanish ? 'Nueva Propiedad' : 'New Property'}
          </Button>
        </div>
      </div>

      {searchTerm && (
        <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-medium">
            Mostrando resultados para: <span className="font-bold text-primary">"{searchTerm}"</span>
          </p>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {filteredTours.length} {isSpanish ? 'encontrados' : 'found'}
          </Badge>
        </div>
      )}

      {viewMode === 'clients' && selectedClient && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
          <Button type="button" variant="ghost" onClick={() => setSelectedClient(null)} className="gap-2 text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4" /> {isSpanish ? 'Volver a Clientes' : 'Back to Clients'}
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Folder className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold">{selectedClient}</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {groupedTours[selectedClient]?.length} {isSpanish ? 'Propiedades' : 'Properties'}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupedTours[selectedClient]?.map((tour: any) => renderTourCard(tour))}
          </div>
        </div>
      )}

      {viewMode === 'clients' && !selectedClient && (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-300">
          {clients.map((client) => (
            <Card 
              key={client} 
              className="cursor-pointer group hover:border-primary transition-all duration-300 border-2 border-transparent bg-white shadow-md hover:shadow-xl rounded-2xl overflow-hidden"
              onClick={() => setSelectedClient(client)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <Folder className="w-20 h-20 text-primary/10 group-hover:text-primary/20 transition-colors" />
                    <Folder className="w-12 h-12 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold line-clamp-1">{client}</h3>
                    <p className="text-sm text-muted-foreground">
                      {groupedTours[client]?.length} {isSpanish ? 'Propiedades' : 'Properties'}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50/50 justify-center py-3 border-t">
                <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {isSpanish ? 'Ver Propiedades' : 'View Properties'} <ChevronRight className="w-3 h-3" />
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {viewMode === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {filteredTours.map((tour: any) => renderTourCard(tour))}
        </div>
      )}

      {(!filteredTours || filteredTours.length === 0) && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="text-muted-foreground w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {searchTerm ? (isSpanish ? 'No hay resultados' : 'No results') : (isSpanish ? 'No hay propiedades' : 'No properties')}
          </h2>
          <p className="text-muted-foreground mb-6">
            {searchTerm ? (isSpanish ? 'Prueba con otros términos de búsqueda.' : 'Try with other search terms.') : (isSpanish ? 'Comienza a crear tu primer encargo profesional.' : 'Start creating your first professional job.')}
          </p>
          {!searchTerm && (
            <Button 
              type="button" 
              className="rounded-xl px-8"
              onClick={() => handleNavigateTo('/admin/tours/new', 'new-empty')}
              disabled={isNavigating === 'new-empty'}
            >
              {isNavigating === 'new-empty' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Registrar Propiedad
            </Button>
          )}
        </div>
      )}

      <AlertDialog 
        open={tourToDeleteId !== null} 
        onOpenChange={(open) => { if (!open) setTourToDeleteId(null); }}
      >
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="text-destructive w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Esta acción no se puede deshacer. Se eliminará la propiedad permanentemente de nuestros servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl border-muted-foreground/20">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
              disabled={loadingActions[`delete-${tourToDeleteId}`]}
            >
              {loadingActions[`delete-${tourToDeleteId}`] ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sí, eliminar propiedad
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
