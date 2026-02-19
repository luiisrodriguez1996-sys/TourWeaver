
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Scene, Hotspot, Tour, Floor, Annotation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ThreeSixtyViewer } from '@/components/ThreeSixtyViewer';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Save, 
  Trash2, 
  ImageIcon, 
  PlusCircle,
  MapPin,
  Settings,
  Crosshair,
  User,
  ExternalLink,
  Loader2,
  AlertCircle,
  Upload,
  Search,
  ChevronUp,
  ChevronDown,
  Info,
  Layers,
  ImageOff,
  AlignLeft,
  XCircle,
  Link as LinkIcon,
  StickyNote,
  Phone,
  Mail,
  MessageSquare,
  LayoutGrid,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, writeBatch, collection, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

function sanitizeForFirestore(data: any): any {
  if (data === null || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore);
  }

  const sanitized: any = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value === undefined) {
      sanitized[key] = null;
    } else {
      sanitized[key] = sanitizeForFirestore(value);
    }
  });
  return sanitized;
}

export default function TourEditor() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const sceneFileInputRef = useRef<HTMLInputElement>(null);
  
  const tourRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'tours', id as string);
  }, [firestore, id]);

  const scenesRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return collection(firestore, 'tours', id as string, 'scenes');
  }, [firestore, id]);

  const { data: tour, isLoading: isTourLoading } = useDoc(tourRef);
  const { data: serverScenes, isLoading: isScenesLoading } = useCollection(scenesRef);
  
  const [localTourInfo, setLocalTourInfo] = useState({
    name: '',
    clientName: '',
    slug: '',
    description: '',
    published: false,
    floors: [] as Floor[],
    showFloorPlan: false,
    showInPortfolio: false,
    address: '',
    googleMapsUrl: '',
    contactPhone: '',
    contactEmail: '',
    contactWhatsApp: ''
  });

  const [localScenes, setLocalScenes] = useState<Scene[]>([]);
  const [deletedSceneIds, setDeletedSceneIds] = useState<string[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [mainEditorTab, setMainEditorTab] = useState('space');
  const [editorMode, setEditorMode] = useState<'hotspot' | 'annotation'>('hotspot');
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (tour) {
      setLocalTourInfo({
        name: tour.name || '',
        clientName: tour.clientName || '',
        slug: tour.slug || '',
        description: tour.description || '',
        published: !!tour.published,
        floors: tour.floors || [],
        showFloorPlan: !!tour.showFloorPlan,
        showInPortfolio: !!tour.showInPortfolio,
        address: tour.address || '',
        googleMapsUrl: tour.googleMapsUrl || '',
        contactPhone: tour.contactPhone || '',
        contactEmail: tour.contactEmail || '',
        contactWhatsApp: tour.contactWhatsApp || ''
      });
    }
  }, [tour]);

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
      
      setLocalScenes(sorted);
      if (sorted.length > 0 && !activeSceneId) {
        setActiveSceneId(sorted[0].id);
      }
    }
  }, [serverScenes, tour]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__IS_DIRTY__ = hasUnsavedChanges;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm("Tienes cambios sin guardar. ¿Estás seguro de que quieres volver?");
        if (!confirmLeave) {
          window.history.pushState(null, '', window.location.href);
        } else {
          (window as any).__IS_DIRTY__ = false;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    if (hasUnsavedChanges) {
      window.history.pushState(null, '', window.location.href);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      if (typeof window !== 'undefined') {
        (window as any).__IS_DIRTY__ = false;
      }
    };
  }, [hasUnsavedChanges]);

  const activeScene = localScenes.find((s) => s.id === activeSceneId);
  const activeFloor = localTourInfo.floors.find(f => f.id === activeScene?.floorId);

  const compressImage = (dataUrl: string, maxWidth = 3072, initialQuality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        let currentQuality = initialQuality;
        let result = canvas.toDataURL('image/jpeg', currentQuality);
        
        while (result.length > 950000 && currentQuality > 0.3) {
          currentQuality -= 0.05;
          result = canvas.toDataURL('image/jpeg', currentQuality);
        }
        
        resolve(result);
      };
    });
  };

  const handleSceneFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && id) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const imageUrl = await compressImage(reader.result as string);
          
          const sceneId = Math.random().toString(36).substr(2, 9);
          const newScene: Scene = {
            id: sceneId,
            tourId: id as string,
            name: 'Nueva Estancia',
            description: '',
            imageUrl: imageUrl,
            hotspots: [],
            annotations: [],
            floorId: localTourInfo.floors[0]?.id || undefined
          };
          setLocalScenes(prev => [...prev, newScene]);
          setActiveSceneId(sceneId);
          setHasUnsavedChanges(true);
          setIsUploading(false);
          toast({ title: "Estancia añadida con calidad optimizada" });
        } catch (error) {
          setIsUploading(false);
          toast({ variant: "destructive", title: "Error al procesar imagen" });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const moveScene = (index: number, direction: 'up' | 'down') => {
    const newScenes = [...localScenes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newScenes.length) return;
    [newScenes[index], newScenes[targetIndex]] = [newScenes[targetIndex], newScenes[index]];
    setLocalScenes(newScenes);
    setHasUnsavedChanges(true);
  };

  const addFloor = () => {
    const newFloor: Floor = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Planta ${localTourInfo.floors.length + 1}`,
      imageUrl: ''
    };
    setLocalTourInfo(prev => ({ ...prev, floors: [...prev.floors, newFloor], showFloorPlan: true }));
    setHasUnsavedChanges(true);
  };

  const updateFloor = (floorId: string, updates: Partial<Floor>) => {
    setLocalTourInfo(prev => ({
      ...prev,
      floors: prev.floors.map(f => f.id === floorId ? { ...f, ...updates } : f)
    }));
    setHasUnsavedChanges(true);
  };

  const removeFloor = (floorId: string) => {
    setLocalTourInfo(prev => ({
      ...prev,
      floors: prev.floors.filter(f => f.id !== floorId)
    }));
    setLocalScenes(prev => prev.map(s => s.floorId === floorId ? { ...s, floorId: null as any, floorPlanX: null as any, floorPlanY: null as any } : s));
    setHasUnsavedChanges(true);
  };

  const handleFloorImageUpload = async (floorId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const imageUrl = await compressImage(reader.result as string, 1500, 0.7);
          updateFloor(floorId, { imageUrl });
          setIsUploading(false);
        } catch (error) {
          setIsUploading(false);
          toast({ variant: "destructive", title: "Error al subir plano" });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateLocalScene = (updates: Partial<Scene>) => {
    if (!activeSceneId) return;
    const sanitizedUpdates = { ...updates };
    Object.keys(sanitizedUpdates).forEach(key => {
      if ((sanitizedUpdates as any)[key] === undefined) {
        (sanitizedUpdates as any)[key] = null;
      }
    });
    setLocalScenes(prev => prev.map(s => s.id === activeSceneId ? { ...s, ...sanitizedUpdates } : s));
    setHasUnsavedChanges(true);
  };

  const handleDeleteScene = () => {
    if (!activeSceneId) return;
    
    const idToDelete = activeSceneId;
    
    // 1. Agregar a la lista de eliminados para el batch de Firestore
    setDeletedSceneIds(prev => [...prev, idToDelete]);
    
    // 2. Filtrar localScenes y LIMPIAR enlaces rotos en otras escenas
    setLocalScenes(prev => {
      return prev
        .filter(s => s.id !== idToDelete)
        .map(s => ({
          ...s,
          hotspots: s.hotspots.filter(h => h.targetSceneId !== idToDelete)
        }));
    });

    // 3. Cambiar la escena activa a la primera disponible o null
    const remainingScenes = localScenes.filter(s => s.id !== idToDelete);
    setActiveSceneId(remainingScenes.length > 0 ? remainingScenes[0].id : null);
    
    // 4. Marcar que hay cambios sin guardar para habilitar el botón
    setHasUnsavedChanges(true);
    
    toast({ 
      title: "Estancia eliminada", 
      description: "Se han limpiado automáticamente los enlaces que apuntaban a esta habitación." 
    });
  };

  const handleFloorPlanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeSceneId || !activeFloor || !activeFloor.imageUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    updateLocalScene({ floorPlanX: x, floorPlanY: y });
  };

  const clearSceneLocation = () => {
    if (!activeSceneId) return;
    updateLocalScene({ floorPlanX: null as any, floorPlanY: null as any });
    toast({ title: "Ubicación eliminada" });
  };

  const handleSceneClick = (yaw: number, pitch: number) => {
    if (!activeSceneId) return;
    
    if (editorMode === 'hotspot') {
      if (localScenes.length < 2) {
        toast({ title: "Necesitas al menos 2 estancias para crear un enlace." });
        return;
      }
      const targetScene = localScenes.find(s => s.id !== activeSceneId);
      const newHotspot: Hotspot = {
        id: Math.random().toString(36).substr(2, 9),
        sceneId: activeSceneId,
        targetSceneId: targetScene?.id || '',
        label: `Ir a ${targetScene?.name || 'Siguiente Estancia'}`,
        yaw: Math.round(yaw),
        pitch: Math.round(pitch)
      };
      updateLocalScene({ hotspots: [...(activeScene?.hotspots || []), newHotspot] });
      setActiveTab('links');
      setHighlightedElementId(newHotspot.id);
    } else {
      const newAnnotation: Annotation = {
        id: Math.random().toString(36).substr(2, 9),
        sceneId: activeSceneId,
        title: 'Nueva Nota',
        content: '',
        yaw: Math.round(yaw),
        pitch: Math.round(pitch)
      };
      updateLocalScene({ annotations: [...(activeScene?.annotations || []), newAnnotation] });
      setActiveTab('annotations');
      setHighlightedElementId(newAnnotation.id);
    }
  };

  const removeHotspot = (hotspotId: string) => {
    updateLocalScene({ hotspots: activeScene?.hotspots.filter(h => h.id !== hotspotId) || [] });
  };

  const removeAnnotation = (annotationId: string) => {
    updateLocalScene({ annotations: activeScene?.annotations?.filter(a => a.id !== annotationId) || [] });
  };

  const updateHotspot = (hotspotId: string, updates: Partial<Hotspot>) => {
    if (!activeScene) return;
    updateLocalScene({
      hotspots: activeScene.hotspots.map(h => h.id === hotspotId ? { ...h, ...updates } : h)
    });
  };

  const updateAnnotation = (annotationId: string, updates: Partial<Annotation>) => {
    if (!activeScene) return;
    updateLocalScene({
      annotations: activeScene.annotations?.map(a => a.id === annotationId ? { ...a, ...updates } : a) || []
    });
  };

  const handleSaveAll = async () => {
    if (!firestore || !id || !tour) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(firestore);
      
      // Manejo de cambio de Slug si ha ocurrido
      if (localTourInfo.slug !== tour.slug) {
        const slugRegistryRef = doc(firestore, 'slug_registry', localTourInfo.slug);
        const slugSnapshot = await getDoc(slugRegistryRef);

        if (slugSnapshot.exists()) {
          setIsSaving(false);
          toast({
            variant: "destructive",
            title: "URL No Disponible",
            description: "Este Identificador de URL ya está en uso. Elige uno diferente.",
          });
          return;
        }

        // Eliminar slug antiguo y registrar el nuevo
        batch.delete(doc(firestore, 'slug_registry', tour.slug));
        batch.set(slugRegistryRef, { tourId: id });
      }

      for (const scene of localScenes) {
        const sceneDocRef = doc(firestore, 'tours', id as string, 'scenes', scene.id);
        batch.set(sceneDocRef, sanitizeForFirestore(scene), { merge: true });
      }
      
      for (const sceneIdToDelete of deletedSceneIds) {
        const sceneDocRef = doc(firestore, 'tours', id as string, 'scenes', sceneIdToDelete);
        batch.delete(sceneDocRef);
      }
      
      if (tourRef) {
        const sanitizedTourInfo = sanitizeForFirestore({ 
          ...localTourInfo,
          thumbnailUrl: localScenes[0]?.imageUrl || '',
          sceneIds: localScenes.map(s => s.id),
          updatedAt: Date.now() 
        });
        
        batch.set(tourRef, sanitizedTourInfo, { merge: true });
      }
      
      await batch.commit();
      setDeletedSceneIds([]);
      setHasUnsavedChanges(false);
      if (typeof window !== 'undefined') (window as any).__IS_DIRTY__ = false;
      setIsSaving(false);
      toast({ title: "Guardado con éxito" });
    } catch (error: any) {
      console.error("Error al guardar:", error);
      setIsSaving(false);
      let errorMsg = "Error al guardar";
      if (error?.code === 'out-of-range' || error?.message?.includes('longer than')) {
        errorMsg = "Una de las estancias es demasiado pesada a pesar de la compresión. Intenta subir una imagen con menos detalles.";
      }
      toast({ variant: "destructive", title: errorMsg });
    }
  };

  if (isTourLoading || isScenesLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  const VisibilityToggle = () => (
    <div 
      className="h-11 w-24 bg-white/60 backdrop-blur-md border rounded-xl p-1 relative cursor-pointer flex items-center shadow-sm hover:border-primary/30 transition-all group"
      onClick={() => {
        setLocalTourInfo(prev => ({ ...prev, published: !prev.published }));
        setHasUnsavedChanges(true);
      }}
      title={localTourInfo.published ? "Actualmente Público" : "Actualmente Privado"}
    >
      <div 
        className={cn(
          "absolute h-9 w-[44px] rounded-lg transition-all duration-300 ease-in-out shadow-sm",
          localTourInfo.published 
            ? "translate-x-[42px] bg-green-500" 
            : "translate-x-0 bg-amber-500"
        )}
      />
      <div className="flex w-full h-full relative z-10">
        <div className="flex-1 flex items-center justify-center">
          <Lock className={cn("w-4 h-4 transition-colors duration-300", !localTourInfo.published ? "text-white" : "text-muted-foreground/40")} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Eye className={cn("w-4 h-4 transition-colors duration-300", localTourInfo.published ? "text-white" : "text-muted-foreground/40")} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-[64px] z-40 bg-transparent pb-4">
        <div className="flex items-center gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase"><User className="w-3 h-3" /> {localTourInfo.clientName}</div>
            <h1 className="text-xl md:text-2xl font-bold truncate">{localTourInfo.name}</h1>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <VisibilityToggle />
          <Tabs value={mainEditorTab} onValueChange={setMainEditorTab}>
            <TabsList className="bg-white border rounded-xl p-1 h-11">
              <TabsTrigger value="space" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><LayoutGrid className="w-4 h-4" /> Espacio</TabsTrigger>
              <TabsTrigger value="details" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><Settings className="w-4 h-4" /> Detalles</TabsTrigger>
              <TabsTrigger value="contact" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><MessageSquare className="w-4 h-4" /> Contacto</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button className="bg-primary h-11 px-6 rounded-xl gap-2 shadow-lg shadow-primary/20" onClick={handleSaveAll} disabled={isSaving || !hasUnsavedChanges}>
            {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />} Guardar Todo
          </Button>
        </div>
      </div>

      <div className="lg:hidden flex items-center gap-2 sticky top-[120px] z-40 bg-transparent mb-4">
        <VisibilityToggle />
        <Tabs value={mainEditorTab} onValueChange={setMainEditorTab} className="flex-1">
          <TabsList className="w-full bg-white/60 backdrop-blur-md border rounded-xl p-1 h-11">
            <TabsTrigger value="space" className="flex-1 rounded-lg"><LayoutGrid className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="details" className="flex-1 rounded-lg"><Settings className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="contact" className="flex-1 rounded-lg"><MessageSquare className="w-4 h-4" /></TabsTrigger>
          </TabsList>
        </Tabs>
        <Button 
          size="icon" 
          className="bg-primary h-11 w-11 rounded-xl shadow-lg shadow-primary/20 shrink-0" 
          onClick={handleSaveAll} 
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
        </Button>
      </div>

      {mainEditorTab === 'space' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-3 space-y-4 bg-white rounded-3xl p-4 border shadow-sm max-h-[calc(100vh-250px)] overflow-y-auto">
              <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Estancias</h3>
              <Button variant="outline" className="w-full gap-2 border-dashed h-12" onClick={() => sceneFileInputRef.current?.click()}>
                {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />} Añadir Estancia
              </Button>
              <input type="file" ref={sceneFileInputRef} className="hidden" accept="image/*" onChange={handleSceneFileChange} />
              
              <div className="space-y-2">
                {localScenes.map((scene, index) => (
                  <Card 
                    key={scene.id} 
                    className={cn(
                      "p-2 transition-all cursor-pointer border-2 hover:bg-muted/50", 
                      activeSceneId === scene.id ? 'border-primary bg-primary/5' : 'border-transparent'
                    )}
                    onClick={() => setActiveSceneId(scene.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                        <img src={scene.imageUrl} className="w-full h-full object-cover" alt={scene.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{scene.name}</p>
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-0.5 leading-tight">
                          <span className="truncate flex-1 pr-1 font-medium italic">
                            {localTourInfo.floors.find(f => f.id === scene.floorId)?.name || ''}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {scene.floorId && <Layers className="w-2.5 h-2.5" />}
                            {scene.floorPlanX !== undefined && scene.floorPlanX !== null && <MapPin className="w-2.5 h-2.5 text-primary" />}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === 0} onClick={() => moveScene(index, 'up')}><ChevronUp className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === localScenes.length - 1} onClick={() => moveScene(index, 'down')}><ChevronDown className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="rounded-3xl overflow-hidden shadow-xl border relative bg-black aspect-[4/5] w-full max-h-[calc(100vh-250px)] flex items-center justify-center">
                {activeScene && (
                  <ThreeSixtyViewer 
                    imageUrl={activeScene.imageUrl} 
                    hotspots={activeScene.hotspots || []}
                    annotations={activeScene.annotations || []}
                    isEditing={true}
                    onSceneClick={handleSceneClick}
                    onHotspotClick={(tid, hid) => { setActiveTab('links'); setHighlightedElementId(hid); }}
                    onAnnotationClick={(aid) => { setActiveTab('annotations'); setHighlightedElementId(aid); }}
                  />
                )}
                
                <div className="absolute top-4 left-4 z-50 flex bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/20">
                   <Button 
                    variant={editorMode === 'hotspot' ? 'default' : 'ghost'} 
                    size="sm" 
                    className={cn("rounded-full h-8 text-[10px]", editorMode === 'hotspot' && "bg-accent hover:bg-accent/90")}
                    onClick={() => setEditorMode('hotspot')}
                   >
                     <LinkIcon className="w-3 h-3 mr-1" /> Enlaces
                   </Button>
                   <Button 
                    variant={editorMode === 'annotation' ? 'default' : 'ghost'} 
                    size="sm" 
                    className={cn("rounded-full h-8 text-[10px] text-white", editorMode === 'annotation' && "bg-blue-500 hover:bg-blue-600")}
                    onClick={() => setEditorMode('annotation')}
                   >
                     <StickyNote className="w-3 h-3 mr-1" /> Notas
                   </Button>
                </div>

                <div className="absolute bottom-1.5 left-4 z-30 pointer-events-none">
                  <span className="text-neutral-700 text-[8px] md:text-[10px] font-bold tracking-widest uppercase">
                    Configurando Espacio
                  </span>
                </div>
              </div>
              <div className="p-3 bg-primary/5 rounded-2xl flex items-center gap-3 text-[10px] font-medium text-primary border border-primary/20">
                <Info className="w-4 h-4" /> 
                {editorMode === 'hotspot' 
                  ? 'Toca en la vista 360 para crear un punto de navegación entre estancias.' 
                  : 'Toca en la vista 360 para añadir una nota informativa sobre algún detalle.'}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4 bg-white rounded-3xl p-4 border shadow-sm max-h-[calc(100vh-250px)] overflow-y-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="details" className="text-[10px]">Estancia</TabsTrigger>
                  <TabsTrigger value="links" className="text-[10px]">Enlaces</TabsTrigger>
                  <TabsTrigger value="annotations" className="text-[10px]">Notas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="pt-4 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Nombre de la Estancia</Label>
                      <Input value={activeScene?.name || ''} onChange={e => updateLocalScene({ name: e.target.value })} />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Descripción</Label>
                      <Textarea 
                        value={activeScene?.description || ''} 
                        onChange={e => updateLocalScene({ description: e.target.value })} 
                        placeholder="Describe los detalles destacados de esta habitación..." 
                        className="text-xs min-h-[120px] resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Planta / Piso</Label>
                      <Select value={activeScene?.floorId || 'none'} onValueChange={val => updateLocalScene({ floorId: val === 'none' ? undefined : val })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar planta..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin planta</SelectItem>
                          {localTourInfo.floors.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {activeFloor && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold flex items-center gap-2">
                            <Crosshair className="w-3.5 h-3.5" /> Ubicación en {activeFloor.name}
                          </Label>
                          {activeScene?.floorPlanX !== undefined && activeScene?.floorPlanX !== null && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={clearSceneLocation}
                            >
                              <XCircle className="w-3 h-3 mr-1" /> Quitar ubicación
                            </Button>
                          )}
                        </div>
                        {activeFloor.imageUrl ? (
                          <div className="relative aspect-video bg-muted rounded-xl border-2 border-primary/20 cursor-crosshair overflow-hidden" onClick={handleFloorPlanClick}>
                            <img src={activeFloor.imageUrl} className="w-full h-full object-contain pointer-events-none" alt="Plano" />
                            {localScenes.filter(s => s.floorId === activeScene?.floorId).map(s => s.floorPlanX !== undefined && s.floorPlanX !== null && (
                              <div key={s.id} className={cn("absolute w-3 h-3 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2", s.id === activeSceneId ? 'bg-primary scale-150 z-20' : 'bg-muted-foreground/50 z-10')} style={{ left: `${s.floorPlanX}%`, top: `${s.floorPlanY}%` }} />
                            ))}
                          </div>
                        ) : (
                          <div className="aspect-video bg-muted/40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center">
                            <ImageOff className="w-6 h-6 text-muted-foreground mb-2" />
                            <p className="text-[10px] text-muted-foreground">Sube un plano en la sección de plantas para ubicar la estancia.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive border-destructive/20 mt-6" 
                    onClick={handleDeleteScene}
                  >
                    Eliminar Estancia
                  </Button>
                </TabsContent>

                <TabsContent value="links" className="pt-4 space-y-3">
                  {activeScene?.hotspots.map(h => (
                    <Card key={h.id} className={cn("p-3 border-2", highlightedElementId === h.id ? 'border-accent' : 'border-muted')}>
                      <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-bold uppercase text-accent">Enlace</span><Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeHotspot(h.id)}><Trash2 className="w-3 h-3" /></Button></div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-muted-foreground">Yaw (Horizontal)</Label>
                          <Input 
                            type="number" 
                            step="1" 
                            value={Math.round(h.yaw)} 
                            className="h-7 text-[10px]" 
                            onChange={e => updateHotspot(h.id, { yaw: parseInt(e.target.value) || 0 })} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-muted-foreground">Pitch (Vertical)</Label>
                          <Input 
                            type="number" 
                            step="1" 
                            value={Math.round(h.pitch)} 
                            className="h-7 text-[10px]" 
                            onChange={e => updateHotspot(h.id, { pitch: parseInt(e.target.value) || 0 })} 
                          />
                        </div>
                      </div>
                      <Input value={h.label} className="h-7 text-xs mb-2" onChange={e => updateHotspot(h.id, { label: e.target.value })} />
                      <Select value={h.targetSceneId} onValueChange={val => updateHotspot(h.id, { targetSceneId: val })}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{localScenes.filter(s => s.id !== activeSceneId).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </Card>
                  ))}
                  {(!activeScene?.hotspots || activeScene.hotspots.length === 0) && (
                    <div className="text-center py-10 text-muted-foreground">
                      <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-[10px]">No hay enlaces de navegación.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="annotations" className="pt-4 space-y-3">
                  {activeScene?.annotations?.map(a => (
                    <Card key={a.id} className={cn("p-3 border-2", highlightedElementId === a.id ? 'border-blue-500' : 'border-muted')}>
                      <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-bold uppercase text-blue-500">Nota Informativa</span><Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeAnnotation(a.id)}><Trash2 className="w-3 h-3" /></Button></div>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] uppercase font-bold text-muted-foreground">Título</Label>
                          <Input value={a.title} className="h-7 text-xs" onChange={e => updateAnnotation(a.id, { title: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] uppercase font-bold text-muted-foreground">Contenido</Label>
                          <Textarea value={a.content} className="text-[10px] min-h-[80px]" onChange={e => updateAnnotation(a.id, { content: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[9px] uppercase font-bold text-muted-foreground">Yaw</Label>
                            <Input type="number" step="1" value={Math.round(a.yaw)} className="h-7 text-[10px]" onChange={e => updateAnnotation(a.id, { yaw: parseInt(e.target.value) || 0 })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] uppercase font-bold text-muted-foreground">Pitch</Label>
                            <Input type="number" step="1" value={Math.round(a.pitch)} className="h-7 text-[10px]" onChange={e => updateAnnotation(a.id, { pitch: parseInt(e.target.value) || 0 })} />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {(!activeScene?.annotations || activeScene.annotations.length === 0) && (
                    <div className="text-center py-10 text-muted-foreground">
                      <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-[10px]">No hay notas informativas.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <Card className="rounded-3xl border shadow-md overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Gestión de Plantas y Planos</CardTitle>
                <CardDescription>Organiza los niveles de la propiedad y carga planos interactivos.</CardDescription>
              </div>
              <Button size="sm" onClick={addFloor} className="h-8 gap-1 rounded-xl"><Plus className="w-3 h-3" /> Añadir Planta</Button>
            </CardHeader>
            <CardContent className="pt-6">
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {localTourInfo.floors.map(floor => (
                    <Card key={floor.id} className="p-4 border-muted hover:border-primary/20 transition-colors bg-gray-50/50">
                      <div className="flex items-center justify-between mb-4">
                        <Input value={floor.name} className="h-8 font-bold border-none bg-white w-2/3" onChange={e => updateFloor(floor.id, { name: e.target.value })} />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFloor(floor.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                      <div className="relative aspect-video bg-white rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:bg-muted/10 transition-colors" onClick={() => document.getElementById(`floor-input-${floor.id}`)?.click()}>
                        {floor.imageUrl ? (
                          <img src={floor.imageUrl} className="w-full h-full object-contain" alt={floor.name} />
                        ) : (
                          <div className="text-center p-4">
                            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                            <span className="text-[10px] text-muted-foreground">Subir plano (Opcional)</span>
                          </div>
                        )}
                        <input id={`floor-input-${floor.id}`} type="file" className="hidden" accept="image/*" onChange={e => handleFloorImageUpload(floor.id, e)} />
                      </div>
                    </Card>
                  ))}
                  {localTourInfo.floors.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                      <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Añade plantas para organizar tus estancias y cargar planos interactivos.</p>
                    </div>
                  )}
               </div>
               {localTourInfo.floors.length > 0 && (
                  <div className="mt-8 flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <MapIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Mostrar selector de planos</p>
                        <p className="text-[10px] text-muted-foreground">Permite a los visitantes navegar usando el mapa de la propiedad.</p>
                      </div>
                    </div>
                    <Switch checked={localTourInfo.showFloorPlan} onCheckedChange={checked => { setLocalTourInfo({...localTourInfo, showFloorPlan: checked}); setHasUnsavedChanges(true); }} />
                  </div>
               )}
            </CardContent>
          </Card>
        </div>
      )}

      {mainEditorTab === 'details' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="rounded-[2.5rem] border shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/5 pb-8 pt-8">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Settings className="text-primary w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-bold">Detalles de la Propiedad</CardTitle>
              <CardDescription>Configuración principal y metadatos del tour virtual.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Cliente / Propietario</Label>
                  <Input value={localTourInfo.clientName} placeholder="Nombre de la inmobiliaria o cliente..." onChange={e => { setLocalTourInfo({...localTourInfo, clientName: e.target.value}); setHasUnsavedChanges(true); }} className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold">Nombre del Tour</Label>
                  <Input value={localTourInfo.name} placeholder="ej. Apartamento de Lujo en la Costa" onChange={e => { setLocalTourInfo({...localTourInfo, name: e.target.value}); setHasUnsavedChanges(true); }} className="rounded-xl h-11" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Identificador de URL (Slug)</Label>
                <div className="flex items-center gap-2">
                   <span className="hidden sm:inline text-xs font-mono text-muted-foreground bg-muted px-3 py-2.5 rounded-xl border">/tour/</span>
                   <Input 
                    value={localTourInfo.slug} 
                    placeholder="identificador-unico" 
                    onChange={e => {
                      const newSlug = e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
                      setLocalTourInfo({...localTourInfo, slug: newSlug});
                      setHasUnsavedChanges(true);
                    }} 
                    className="rounded-xl h-11 font-mono" 
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Importante: Cambiar el identificador romperá los enlaces compartidos anteriormente.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center gap-2"><AlignLeft className="w-4 h-4 text-primary" /> Descripción General</Label>
                <Textarea value={localTourInfo.description} placeholder="Proporciona una descripción atractiva para los visitantes..." rows={4} onChange={e => { setLocalTourInfo({...localTourInfo, description: e.target.value}); setHasUnsavedChanges(true); }} className="rounded-xl resize-none" />
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Ubicación Geográfica</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Dirección Física (Texto)</Label>
                    <Input value={localTourInfo.address} placeholder="ej. Calle Falsa 123, Madrid, España" onChange={e => { setLocalTourInfo({...localTourInfo, address: e.target.value}); setHasUnsavedChanges(true); }} className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Enlace de Google Maps</Label>
                    <Input value={localTourInfo.googleMapsUrl} placeholder="Pega el enlace de Google Maps aquí..." onChange={e => { setLocalTourInfo({...localTourInfo, googleMapsUrl: e.target.value}); setHasUnsavedChanges(true); }} className="rounded-xl h-11" />
                    <p className="text-[10px] text-muted-foreground">Esto permitirá a los usuarios ver la ubicación exacta desde el tour.</p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> Opciones de Portafolio</h3>
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div>
                    <p className="text-sm font-bold">Mostrar en Portafolio</p>
                    <p className="text-[10px] text-muted-foreground">Hace que esta propiedad aparezca destacada en la página de inicio pública.</p>
                  </div>
                  <Switch checked={localTourInfo.showInPortfolio} onCheckedChange={checked => { setLocalTourInfo({...localTourInfo, showInPortfolio: checked}); setHasUnsavedChanges(true); }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {mainEditorTab === 'contact' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="rounded-[2.5rem] border shadow-xl overflow-hidden">
            <CardHeader className="bg-accent/5 pb-8 pt-8">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare className="text-accent w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-bold">Medios de Contacto</CardTitle>
              <CardDescription>Configura cómo los visitantes pueden contactarte directamente.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              <div className="bg-accent/5 border border-accent/10 rounded-2xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0 text-white">
                  <MessageCircleIcon className="w-6 h-6" />
                </div>
                <div className="space-y-2 flex-1">
                  <Label className="text-sm font-bold">WhatsApp Directo</Label>
                  <Input 
                    value={localTourInfo.contactWhatsApp} 
                    placeholder="Solo números, con prefijo internacional (ej: 34600123456)" 
                    onChange={e => { setLocalTourInfo({...localTourInfo, contactWhatsApp: e.target.value}); setHasUnsavedChanges(true); }} 
                    className="rounded-xl h-11"
                  />
                  <p className="text-[10px] text-muted-foreground">Se creará un botón flotante que envía un mensaje automático mencionando esta propiedad.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-sm font-bold flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> Teléfono de Contacto</Label>
                  <Input 
                    value={localTourInfo.contactPhone} 
                    placeholder="ej: +34 600 123 456" 
                    onChange={e => { setLocalTourInfo({...localTourInfo, contactPhone: e.target.value}); setHasUnsavedChanges(true); }} 
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Correo Electrónico</Label>
                  <Input 
                    type="email"
                    value={localTourInfo.contactEmail} 
                    placeholder="ej: comercial@ejemplo.com" 
                    onChange={e => { setLocalTourInfo({...localTourInfo, contactEmail: e.target.value}); setHasUnsavedChanges(true); }} 
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 1 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 1 1 1.788 0z" />
      <path d="M15 5.764v15" />
      <path d="M9 3.236v15" />
    </svg>
  );
}

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}
