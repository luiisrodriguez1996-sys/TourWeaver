"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { ThreeSixtyViewer } from '@/components/ThreeSixtyViewer';
import { Button } from '@/components/ui/button';
import { Globe, Map, ChevronUp, ChevronDown, Share2, Info, Loader2, Check, MapPin, ArrowLeft, Shield, Layers, ImageOff, StickyNote, X, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { VersionIndicator } from '@/components/VersionIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PublicTourViewer() {
  const { slug } = useParams();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  const adminRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminRef);
  const isAdmin = adminData?.isAdmin === true;

  const tourQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    const toursCol = collection(firestore, 'tours');
    
    if (isAdmin) {
      return query(toursCol, where('slug', '==', slug), limit(1));
    }
    
    return query(toursCol, 
      where('slug', '==', slug), 
      where('published', '==', true), 
      limit(1)
    );
  }, [firestore, slug, isAdmin]);

  const { data: tours, isLoading: isTourLoading, error: tourError } = useCollection(tourQuery);
  const tour = tours?.[0];

  const scenesRef = useMemoFirebase(() => {
    if (!firestore || !tour) return null;
    return collection(firestore, 'tours', tour.id, 'scenes');
  }, [firestore, tour]);

  const { data: serverScenes, isLoading: isScenesLoading, error: scenesError } = useCollection(scenesRef);

  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [orderedScenes, setOrderedScenes] = useState<any[]>([]);

  useEffect(() => {
    if (serverScenes && tour) {
      let sorted = [...serverScenes];
      if (tour.sceneIds && tour.sceneIds.length > 0) {
        sorted.sort((a, b) => {
          const indexA = tour.sceneIds!.indexOf(a.id);
          const indexB = tour.sceneIds!.indexOf(b.id);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      }
      setOrderedScenes(sorted);
      if (sorted.length > 0 && !activeSceneId) {
        setActiveSceneId(sorted[0].id);
      }
    }
  }, [serverScenes, tour, activeSceneId]);

  const activeScene = orderedScenes?.find((s: any) => s.id === activeSceneId);
  const activeAnnotation = activeScene?.annotations?.find((a: any) => a.id === selectedAnnotationId);

  useEffect(() => {
    if (activeScene?.floorId) {
      setActiveFloorId(activeScene.floorId);
    } else if (tour?.floors?.length && !activeFloorId) {
      setActiveFloorId(tour.floors[0].id);
    }
  }, [activeScene, tour, activeFloorId]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Enlace copiado" });
    }
  };

  const getMapsUrl = () => {
    if (tour?.googleMapsUrl) return tour.googleMapsUrl;
    if (tour?.address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tour.address)}`;
    return null;
  };

  const canView = tour ? (tour.published || isAdmin) : false;

  if (isTourLoading || (tours === null && !tourError) || (tour && isScenesLoading && !scenesError)) {
    return (
      <div className="h-[100dvh] bg-black flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium animate-pulse">Cargando experiencia inmersiva...</p>
      </div>
    );
  }

  // Si hay error de permisos (porque pasó a privado) o el tour no existe/no es público
  if (!tour || !canView || scenesError || tourError) {
    return (
      <div className="h-[100dvh] bg-black flex items-center justify-center text-white p-6">
        <div className="text-center p-12 bg-white/5 backdrop-blur-lg rounded-[2.5rem] border border-white/10 max-w-md shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-destructive w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold font-headline mb-2">Tour no disponible</h2>
          <p className="text-white/60 text-sm mb-8 text-balance">
            Esta propiedad ha sido marcada como privada o ya no está disponible públicamente.
          </p>
          <Link href="/">
            <Button size="lg" className="w-full gap-2 rounded-2xl h-14 text-lg">
              <ArrowLeft className="w-5 h-5" /> Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentFloor = tour.floors?.find((f: any) => f.id === activeFloorId);

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden bg-black flex flex-col touch-none">
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 z-20 pointer-events-none flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="pointer-events-auto w-full md:w-auto">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 text-white max-w-full md:max-w-sm shadow-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-base font-bold font-headline truncate">{tour.name}</h1>
                  {!tour.published && isAdmin && <div className="flex-shrink-0 flex items-center gap-1 bg-accent/20 text-accent px-1.5 py-0.5 rounded text-[8px] font-bold border border-accent/20"><Shield className="w-2.5 h-2.5" /> ADMIN</div>}
                </div>
                <p className="text-[10px] text-white/60 flex items-center gap-1"><Info className="w-3 h-3" /> {activeScene?.name || 'Cargando...'}</p>
              </div>
              {isDetailsExpanded ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
            </div>
            
            <div className={cn("overflow-hidden transition-all duration-300 ease-in-out px-4", isDetailsExpanded ? "max-h-[600px] pb-4 opacity-100" : "max-h-0 opacity-0")}>
              <div className="space-y-4 pt-2">
                {tour.address && (
                  <a href={getMapsUrl() || '#'} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 text-xs text-white/80 hover:text-primary transition-colors">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-primary" /><span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-primary">{tour.address}</span>
                  </a>
                )}
                {activeScene?.description && (
                  <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                    <p className="text-[9px] font-black text-primary uppercase mb-1 tracking-wider">Sobre esta estancia</p>
                    <p className="text-[11px] text-white/80 leading-relaxed">{activeScene.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 pointer-events-auto w-full md:w-auto justify-end">
          {(tour.address || tour.googleMapsUrl) && (
            <Button variant="secondary" size="icon" className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 h-10 w-10 md:h-11 md:w-11" onClick={() => { const url = getMapsUrl(); if (url) window.open(url, '_blank'); }}>
              <MapPin className="w-4 h-4" />
            </Button>
          )}
          <Button variant="secondary" size="icon" className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 h-10 w-10 md:h-11 md:w-11" onClick={handleShare}><Share2 className="w-4 h-4" /></Button>
          <Link href="/"><Button variant="secondary" size="icon" className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 h-10 w-10 md:h-11 md:w-11"><Globe className="w-4 h-4" /></Button></Link>
        </div>
      </div>

      <div className="flex-grow w-full h-full relative">
        {activeScene && (
          <ThreeSixtyViewer 
            imageUrl={activeScene.imageUrl} 
            hotspots={activeScene.hotspots || []} 
            annotations={activeScene.annotations || []}
            onHotspotClick={(targetId) => {
              setActiveSceneId(targetId);
              setSelectedAnnotationId(null);
            }} 
            onAnnotationClick={(annotationId) => {
              setSelectedAnnotationId(annotationId);
            }}
          />
        )}

        {activeAnnotation && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-[2px] pointer-events-none">
            <Card className="w-full max-w-sm pointer-events-auto animate-in zoom-in-95 duration-300 rounded-[2rem] border-white/10 bg-black/60 text-white backdrop-blur-xl shadow-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/10">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-blue-400" />
                  {activeAnnotation.title}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10 text-white" onClick={() => setSelectedAnnotationId(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                  {activeAnnotation.content}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="absolute bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 w-full px-4 justify-center">
        <div className="bg-black/40 backdrop-blur-md px-2 md:px-6 py-1 rounded-full border border-white/10 flex items-center gap-1 md:gap-2 text-white shadow-2xl pointer-events-auto max-w-full overflow-x-auto scrollbar-hide">
           <Dialog>
             <DialogTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10 hover:text-white rounded-full h-10 px-3 md:px-4 flex-shrink-0">
                  <ChevronUp className="w-4 h-4" />
                  <span className="text-xs md:text-sm font-medium whitespace-nowrap">Estancias ({orderedScenes?.length || 0})</span>
                </Button>
             </DialogTrigger>
             <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[425px] bg-black/80 backdrop-blur-xl border-white/10 text-white p-0 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 border-b border-white/10 text-left"><DialogTitle className="font-bold text-lg">Explorar Estancias</DialogTitle></DialogHeader>
                <ScrollArea className="max-h-[60vh] p-4">
                  <div className="grid grid-cols-1 gap-2">
                    {orderedScenes?.map((scene: any) => (
                      <DialogClose asChild key={scene.id}>
                        <button onClick={() => { setActiveSceneId(scene.id); setSelectedAnnotationId(null); }} className={cn("w-full flex items-center gap-4 p-3 rounded-2xl transition-all group border", activeSceneId === scene.id ? 'bg-primary/20 text-primary border-primary/40' : 'hover:bg-white/10 text-white/70 hover:text-white border-transparent')}>
                          <div className="relative w-20 md:w-24 h-14 md:h-16 rounded-xl overflow-hidden flex-shrink-0"><img src={scene.imageUrl} className="w-full h-full object-cover" alt={scene.name} />{activeSceneId === scene.id && <div className="absolute inset-0 bg-primary/40 flex items-center justify-center"><Check className="w-6 h-6 text-white" /></div>}</div>
                          <span className="text-xs md:text-sm font-semibold truncate flex-1 text-left">{scene.name}</span>
                        </button>
                      </DialogClose>
                    ))}
                  </div>
                </ScrollArea>
             </DialogContent>
           </Dialog>

           {(tour.showFloorPlan && tour.floors?.length > 0) && (
             <>
               <div className="h-4 w-px bg-white/20 mx-1 md:mx-2 flex-shrink-0" />
               <Button variant="ghost" onClick={() => setShowFloorPlan(!showFloorPlan)} className={cn("flex items-center gap-2 text-white hover:bg-white/10 hover:text-white rounded-full h-10 px-3 md:px-4 flex-shrink-0", showFloorPlan && 'text-primary bg-primary/10')}><Map className="w-4 h-4" /><span className="text-xs md:text-sm font-medium whitespace-nowrap">Plano</span></Button>
             </>
           )}
        </div>
      </div>

      {(showFloorPlan && tour.showFloorPlan && tour.floors?.length > 0) && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 max-w-[calc(100vw-2rem)] md:max-w-3xl w-full relative shadow-2xl flex flex-col gap-4">
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-10 w-10 rounded-full hover:bg-muted" onClick={() => setShowFloorPlan(false)}>✕</Button>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-bold font-headline text-primary flex items-center gap-2"><Map className="w-5 h-5 md:w-6 md:h-6" /> Mapa de Navegación</h2>
                {tour.floors.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {tour.floors.map((floor: any) => (
                      <Button key={floor.id} variant={activeFloorId === floor.id ? "default" : "outline"} size="sm" className="rounded-full h-8 px-4 text-[10px]" onClick={() => setActiveFloorId(floor.id)}><Layers className="w-3 h-3 mr-2" /> {floor.name}</Button>
                    ))}
                  </div>
                )}
              </div>
              <div className="aspect-video bg-muted rounded-2xl md:rounded-3xl overflow-hidden relative border shadow-inner">
                 {currentFloor?.imageUrl ? (
                   <>
                     <img src={currentFloor.imageUrl} alt={currentFloor.name} className="w-full h-full object-contain" />
                     {orderedScenes?.filter((s: any) => s.floorId === activeFloorId).map((s: any) => s.floorPlanX !== undefined && (
                       <button key={s.id} onClick={() => { setActiveSceneId(s.id); setShowFloorPlan(false); setSelectedAnnotationId(null); }} className={cn("absolute w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white shadow-xl -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-150 flex items-center justify-center", s.id === activeSceneId ? 'bg-primary z-20 ring-4 ring-primary/30 scale-125' : 'bg-muted-foreground/80 z-10 hover:bg-primary')} style={{ left: `${s.floorPlanX}%`, top: `${s.floorPlanY}%` }} title={s.name}><MapPin className={cn("w-3 h-3 md:w-3.5 md:h-3.5 text-white", s.id === activeSceneId ? 'block' : 'hidden')} /></button>
                     ))}
                   </>
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                     <ImageOff className="w-10 h-10 opacity-20" />
                     <p className="text-xs md:text-sm font-medium">Plano no disponible para esta planta</p>
                   </div>
                 )}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground text-center font-medium">Selecciona un nivel y toca los puntos para navegar.</p>
           </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 md:right-8 z-20 pointer-events-none flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-3">
        <VersionIndicator /><span className="text-neutral-500/40 text-[8px] md:text-[10px] font-bold tracking-widest uppercase">Potenciado por Tour Weaver</span>
      </div>
    </div>
  );
}
