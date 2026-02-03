"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { ThreeSixtyViewer } from '@/components/ThreeSixtyViewer';
import { Button } from '@/components/ui/button';
import { Globe, Map, ChevronUp, Share2, Info } from 'lucide-react';

export default function PublicTourViewer() {
  const { slug } = useParams();
  const firestore = useFirestore();
  
  const tourQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'tours'), where('slug', '==', slug), limit(1));
  }, [firestore, slug]);

  const { data: tours, isLoading } = useCollection(tourQuery);
  const tour = tours?.[0];

  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);

  useEffect(() => {
    if (tour?.scenes?.length > 0 && !activeSceneId) {
      setActiveSceneId(tour.scenes[0].id);
    }
  }, [tour, activeSceneId]);

  const activeScene = tour?.scenes?.find((s: any) => s.id === activeSceneId);

  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center text-white">Cargando Tour...</div>;
  if (!tour) return <div className="h-screen bg-black flex items-center justify-center text-white">Tour no encontrado.</div>;

  return (
    <div className="h-screen relative overflow-hidden bg-black flex flex-col">
      {/* Header Info */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto">
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white max-w-sm">
            <h1 className="text-lg font-bold font-headline">{tour.name}</h1>
            <p className="text-sm text-white/60 flex items-center gap-1">
              <Info className="w-3 h-3" /> {activeScene?.name || 'Escena'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
          <Button variant="secondary" size="icon" className="rounded-full bg-black/40 backdrop-blur-md border-white/10 text-white">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full bg-black/40 backdrop-blur-md border-white/10 text-white">
             <Globe className="w-4 h-4" />
          </Button>
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
        <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-8 text-white">
           <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
              <ChevronUp className="w-4 h-4" />
              <span className="text-sm font-medium">Escenas</span>
           </div>
           
           <div 
             className={`flex items-center gap-2 cursor-pointer transition-colors ${showFloorPlan ? 'text-primary' : 'hover:text-primary'}`}
             onClick={() => setShowFloorPlan(!showFloorPlan)}
           >
              <Map className="w-4 h-4" />
              <span className="text-sm font-medium">Plano</span>
           </div>
        </div>
      </div>

      {/* Floor Plan Overlay */}
      {showFloorPlan && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-8">
           <div className="bg-white rounded-3xl p-8 max-w-3xl w-full relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4"
                onClick={() => setShowFloorPlan(false)}
              >
                ×
              </Button>
              <h2 className="text-2xl font-bold font-headline mb-4 text-primary">Mapa de Navegación</h2>
              <div className="aspect-video bg-muted rounded-xl overflow-hidden relative">
                 <img 
                   src={tour.floorPlanUrl || "https://picsum.photos/seed/plan1/800/600"} 
                   alt="Plano" 
                   className="w-full h-full object-contain"
                   data-ai-hint="house floorplan"
                 />
                 <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-primary rounded-full border-4 border-white shadow-lg animate-bounce"></div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground text-center">Haz clic en una ubicación para saltar a esa escena.</p>
           </div>
        </div>
      )}

      {/* Branding */}
      <div className="absolute bottom-4 right-8 z-20 pointer-events-none opacity-40">
        <span className="text-white text-xs font-bold tracking-widest uppercase">Potenciado por Tour Weaver</span>
      </div>
    </div>
  );
}
