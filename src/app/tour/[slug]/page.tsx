"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MOCK_TOURS } from '@/lib/mock-data';
import { Tour } from '@/lib/types';
import { ThreeSixtyViewer } from '@/components/ThreeSixtyViewer';
import { Button } from '@/components/ui/button';
import { Globe, Map, ChevronUp, Share2, Info } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function PublicTourViewer() {
  const { slug } = useParams();
  const [tour, setTour] = useState<Tour | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);

  useEffect(() => {
    // Real app: fetch tour by slug
    const found = MOCK_TOURS.find(t => t.slug === slug);
    if (found) {
      setTour(found);
      setActiveSceneId(found.scenes[0]?.id || null);
    }
  }, [slug]);

  const activeScene = tour?.scenes.find(s => s.id === activeSceneId);

  if (!tour) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading Tour...</div>;

  return (
    <div className="h-screen relative overflow-hidden bg-black flex flex-col">
      {/* Header Info */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto">
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white max-w-sm">
            <h1 className="text-lg font-bold font-headline">{tour.name}</h1>
            <p className="text-sm text-white/60 flex items-center gap-1">
              <Info className="w-3 h-3" /> {activeScene?.name}
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
            hotspots={activeScene.hotspots}
            onHotspotClick={(targetId) => setActiveSceneId(targetId)}
          />
        )}
      </div>

      {/* Controls Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-8 text-white">
           <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
              <ChevronUp className="w-4 h-4" />
              <span className="text-sm font-medium">Scenes</span>
           </div>
           
           <div 
             className={`flex items-center gap-2 cursor-pointer transition-colors ${showFloorPlan ? 'text-primary' : 'hover:text-primary'}`}
             onClick={() => setShowFloorPlan(!showFloorPlan)}
           >
              <Map className="w-4 h-4" />
              <span className="text-sm font-medium">Floor Plan</span>
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
              <h2 className="text-2xl font-bold font-headline mb-4 text-primary">Navigation Map</h2>
              <div className="aspect-video bg-muted rounded-xl overflow-hidden relative">
                 <img 
                   src="https://picsum.photos/seed/plan1/800/600" 
                   alt="Floor Plan" 
                   className="w-full h-full object-contain"
                   data-ai-hint="house floorplan"
                 />
                 {/* Mock map pins */}
                 <div className="absolute top-1/4 left-1/3 w-6 h-6 bg-primary rounded-full border-4 border-white shadow-lg animate-bounce"></div>
                 <div className="absolute top-1/2 left-2/3 w-4 h-4 bg-gray-400 rounded-full border-2 border-white shadow-md cursor-pointer hover:bg-primary transition-colors"></div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground text-center">Click on a location to jump to that scene.</p>
           </div>
        </div>
      )}

      {/* Branding */}
      <div className="absolute bottom-4 right-8 z-20 pointer-events-none opacity-40">
        <span className="text-white text-xs font-bold tracking-widest uppercase">Powered by Tour Weaver</span>
      </div>
    </div>
  );
}