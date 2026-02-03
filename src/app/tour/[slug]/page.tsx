
"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { ThreeSixtyViewer } from '@/components/ThreeSixtyViewer';
import { Button } from '@/components/ui/button';
import { Globe, Map, ChevronUp, Share2, Info, Loader2, Check, MapPin, ArrowLeft, Shield } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function PublicTourViewer() {
  const { slug } = useParams();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  
  // Verificación de administrador para permitir ver tours privados
  const adminRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminRef);
  const isAdmin = adminData?.isAdmin === true;

  const tourQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'tours'), where('slug', '==', slug), limit(1));
  }, [firestore, slug]);

  const { data: tours, isLoading: isTourLoading } = useCollection(tourQuery);
  const tour = tours?.[0];

  const scenesRef = useMemoFirebase(() => {
    if (!firestore || !tour) return null;
    return collection(firestore, 'tours', tour.id, 'scenes');
  }, [firestore, tour]);

  const { data: scenes, isLoading: isScenesLoading } = useCollection(scenesRef);

  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);

  useEffect(() => {
    if (scenes && scenes.length > 0 && !activeSceneId) {
      setActiveSceneId(scenes[0].id);
    }
  }, [scenes, activeSceneId]);

  const activeScene = scenes?.find((s: any) => s.id === activeSceneId);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Enlace copiado",
        description: "El enlace al tour ha sido copiado al portapapeles.",
      });
    }
  };

  // Determinamos si el usuario puede ver el tour
  const canView = tour ? (tour.published || isAdmin) : false;

  // Estado de carga inicial
  if (isTourLoading || (tours === null) || (tour && isScenesLoading) || (tour && !tour.published && isAdminLoading)) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium animate-pulse">Cargando experiencia inmersiva...</p>
      </div>
    );
  }

  // Si no hay tour o es privado y no es admin
  if (!tour || !canView) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white p-6">
        <div className="text-center p-12 bg-white/5 backdrop-blur-lg rounded-[2.5rem] border border-white/10 max-w-md shadow-2xl">
          <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Globe className="text-destructive w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold font-headline mb-4">Tour no encontrado</h2>
          <p className="text-white/60 mb-10 leading-relaxed">
            El enlace podría estar roto o el tour ha sido desactivado por el administrador.
          </p>
          <Link href="/">
            <Button size="lg" className="w-full gap-2 rounded-2xl h-14 text-lg">
              <ArrowLeft className="w-5 h-5" />
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen relative overflow-hidden bg-black flex flex-col">
      {/* Header Info */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto">
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white max-w-sm shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold font-headline">{tour.name}</h1>
              {!tour.published && isAdmin && (
                <div className="flex items-center gap-1 bg-accent/20 text-accent px-2 py-0.5 rounded text-[10px] font-bold border border-accent/20">
                  <Shield className="w-3 h-3" /> MODO ADMIN
                </div>
              )}
            </div>
            <p className="text-sm text-white/60 flex items-center gap-1">
              <Info className="w-3 h-3" /> {activeScene?.name || 'Cargando...'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
          <Button 
            variant="secondary" 
            size="icon" 
            className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 h-11 w-11"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Link href="/">
            <Button variant="secondary" size="icon" className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 h-11 w-11">
               <Globe className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Viewer */}
      <div className="flex-grow">
        {activeScene && (
          <ThreeSixtyViewer 
            imageUrl={activeScene.imageUrl} 
            hotspots={activeScene.hotspots || []}
            onHotspotClick={(targetId) => setActiveSceneId(targetId)}
          />
        )}
      </div>

      {/* Controls Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <div className="bg-black/40 backdrop-blur-md px-6 py-1 rounded-full border border-white/10 flex items-center gap-2 text-white shadow-2xl">
           
           <Popover>
             <PopoverTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10 hover:text-white rounded-full h-10 px-4">
                  <ChevronUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Escenas ({scenes?.length || 0})</span>
                </Button>
             </PopoverTrigger>
             <PopoverContent side="top" className="w-72 p-0 bg-black/80 backdrop-blur-xl border-white/10 text-white mb-2 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-bold text-sm">Explorar Estancias</h3>
                </div>
                <ScrollArea className="h-64">
                  <div className="p-2 space-y-1">
                    {scenes?.map((scene: any) => (
                      <button
                        key={scene.id}
                        onClick={() => setActiveSceneId(scene.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all group ${
                          activeSceneId === scene.id 
                            ? 'bg-primary/20 text-primary border border-primary/20' 
                            : 'hover:bg-white/10 text-white/70 hover:text-white'
                        }`}
                      >
                        <div className="relative w-16 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={scene.imageUrl} className="w-full h-full object-cover" alt={scene.name} />
                          {activeSceneId === scene.id && (
                            <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium truncate flex-1 text-left">{scene.name}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
             </PopoverContent>
           </Popover>

           {tour.showFloorPlan && (
             <>
               <div className="h-4 w-px bg-white/20 mx-2" />
               <Button 
                 variant="ghost" 
                 onClick={() => setShowFloorPlan(!showFloorPlan)}
                 className={`flex items-center gap-2 text-white hover:bg-white/10 hover:text-white rounded-full h-10 px-4 ${showFloorPlan ? 'text-primary bg-primary/10' : ''}`}
               >
                  <Map className="w-4 h-4" />
                  <span className="text-sm font-medium">Plano</span>
               </Button>
             </>
           )}
        </div>
      </div>

      {/* Floor Plan Overlay */}
      {(showFloorPlan && tour.showFloorPlan) && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] p-8 max-w-3xl w-full relative shadow-2xl">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-6 right-6 h-10 w-10 rounded-full hover:bg-muted"
                onClick={() => setShowFloorPlan(false)}
              >
                ✕
              </Button>
              <h2 className="text-2xl font-bold font-headline mb-6 text-primary flex items-center gap-2">
                <Map className="w-6 h-6" /> Mapa de Navegación
              </h2>
              <div className="aspect-video bg-muted rounded-3xl overflow-hidden relative border shadow-inner">
                 <img 
                   src={tour.floorPlanUrl || "https://picsum.photos/seed/plan1/800/600"} 
                   alt="Plano" 
                   className="w-full h-full object-contain"
                   data-ai-hint="house floorplan"
                 />
                 {/* Interactive Markers for all scenes */}
                 {scenes?.map((s: any) => s.floorPlanX !== undefined && (
                   <button
                     key={s.id}
                     onClick={() => {
                       setActiveSceneId(s.id);
                       setShowFloorPlan(false);
                     }}
                     className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-xl -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-150 flex items-center justify-center ${
                       s.id === activeSceneId 
                        ? 'bg-primary z-20 animate-pulse ring-4 ring-primary/30 scale-125' 
                        : 'bg-muted-foreground/80 z-10 hover:bg-primary'
                     }`}
                     style={{ left: `${s.floorPlanX}%`, top: `${s.floorPlanY}%` }}
                     title={s.name}
                   >
                     <MapPin className={`w-3.5 h-3.5 text-white ${s.id === activeSceneId ? 'block' : 'hidden group-hover:block'}`} />
                   </button>
                 ))}
              </div>
              <p className="mt-6 text-sm text-muted-foreground text-center font-medium">
                Toca los puntos en el mapa para navegar por la propiedad de forma instantánea.
              </p>
           </div>
        </div>
      )}

      {/* Branding */}
      <div className="absolute bottom-4 right-8 z-20 pointer-events-none opacity-40">
        <span className="text-white text-[10px] font-bold tracking-widest uppercase">Potenciado por Tour Weaver</span>
      </div>
    </div>
  );
}
