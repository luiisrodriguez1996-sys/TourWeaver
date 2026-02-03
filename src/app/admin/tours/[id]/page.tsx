
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Scene, Hotspot, Tour } from '@/lib/types';
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
  ArrowLeft, 
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
  Link as LinkIcon,
  Search
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
import { doc, collection, writeBatch } from 'firebase/firestore';

export default function TourEditor() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const sceneFileInputRef = useRef<HTMLInputElement>(null);
  const floorPlanFileInputRef = useRef<HTMLInputElement>(null);
  
  const tourRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'tours', id as string);
  }, [firestore, id]);

  const scenesRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return collection(firestore, 'tours', id as string, 'scenes');
  }, [firestore, id]);

  // Obtener todos los tours para sugerencias de clientes
  const allToursRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tours');
  }, [firestore]);

  const { data: tour, isLoading: isTourLoading } = useDoc(tourRef);
  const { data: serverScenes, isLoading: isScenesLoading } = useCollection(scenesRef);
  const { data: allTours } = useCollection(allToursRef);
  
  const [localTourInfo, setLocalTourInfo] = useState({
    name: '',
    clientName: '',
    description: '',
    floorPlanUrl: '',
    showFloorPlan: false,
    address: '',
    googleMapsUrl: ''
  });

  const [localScenes, setLocalScenes] = useState<Scene[]>([]);
  const [deletedSceneIds, setDeletedSceneIds] = useState<string[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (tour) {
      setLocalTourInfo({
        name: tour.name || '',
        clientName: tour.clientName || '',
        description: tour.description || '',
        floorPlanUrl: tour.floorPlanUrl || '',
        showFloorPlan: !!tour.showFloorPlan,
        address: tour.address || '',
        googleMapsUrl: tour.googleMapsUrl || ''
      });
    }
  }, [tour]);

  useEffect(() => {
    if (serverScenes && localScenes.length === 0) {
      setLocalScenes(serverScenes);
      if (serverScenes.length > 0 && !activeSceneId) {
        setActiveSceneId(serverScenes[0].id);
      }
    }
  }, [serverScenes]);

  const existingClients = allTours 
    ? Array.from(new Set(allTours.map((t: any) => t.clientName).filter(Boolean)))
    : [];

  const activeScene = localScenes.find((s) => s.id === activeSceneId);

  const compressImage = (dataUrl: string, maxWidth = 4096, quality = 0.7): Promise<string> => {
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
        let compressed = canvas.width > 2048 ? canvas.toDataURL('image/jpeg', 0.6) : canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
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
          let imageUrl = reader.result as string;
          if (file.size > 500000) {
            imageUrl = await compressImage(imageUrl);
          }
          const sceneId = Math.random().toString(36).substr(2, 9);
          const newScene: Scene = {
            id: sceneId,
            tourId: id as string,
            name: 'Nueva Estancia',
            description: '',
            imageUrl: imageUrl,
            hotspots: []
          };
          setLocalScenes(prev => [...prev, newScene]);
          setActiveSceneId(sceneId);
          setHasUnsavedChanges(true);
          setIsUploading(false);
          toast({ title: "Estancia añadida", description: "Recuerda guardar para confirmar los cambios." });
        } catch (error) {
          setIsUploading(false);
          toast({ variant: "destructive", title: "Error", description: "No se pudo procesar la imagen." });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFloorPlanFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          let imageUrl = reader.result as string;
          if (file.size > 300000) {
            imageUrl = await compressImage(imageUrl, 1024, 0.7);
          }
          setLocalTourInfo(prev => ({ ...prev, floorPlanUrl: imageUrl, showFloorPlan: true }));
          setHasUnsavedChanges(true);
          setIsUploading(false);
          toast({ title: "Plano cargado", description: "El plano ha sido añadido al proyecto." });
        } catch (error) {
          setIsUploading(false);
          toast({ variant: "destructive", title: "Error", description: "No se pudo procesar el plano." });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateLocalScene = (updates: Partial<Scene>) => {
    if (!activeSceneId) return;
    setLocalScenes(prev => prev.map(s => s.id === activeSceneId ? { ...s, ...updates } : s));
    setHasUnsavedChanges(true);
  };

  const handleFloorPlanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeSceneId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    updateLocalScene({ floorPlanX: x, floorPlanY: y });
    toast({ title: "Ubicación marcada", description: `Posición fijada para ${activeScene?.name}` });
  };

  const updateHotspot = (hotspotId: string, updates: Partial<Hotspot>) => {
    if (!activeScene) return;
    const updatedHotspots = activeScene.hotspots.map(h => 
      h.id === hotspotId ? { ...h, ...updates } : h
    );
    updateLocalScene({ hotspots: updatedHotspots });
  };

  const addHotspot = (yaw: number, pitch: number) => {
    if (!activeSceneId || localScenes.length < 2) {
       toast({ variant: "destructive", title: "Acción no permitida", description: "Necesitas al menos dos estancias para crear un enlace." });
       return;
    }
    const targetScene = localScenes.find(s => s.id !== activeSceneId);
    const newHotspot: Hotspot = {
      id: Math.random().toString(36).substr(2, 9),
      sceneId: activeSceneId,
      targetSceneId: targetScene?.id || '',
      label: `Ir a ${targetScene?.name || 'Siguiente Estancia'}`,
      yaw,
      pitch
    };
    const updatedHotspots = [...(activeScene?.hotspots || []), newHotspot];
    updateLocalScene({ hotspots: updatedHotspots });
  };

  const removeHotspot = (hotspotId: string) => {
    const updatedHotspots = activeScene?.hotspots.filter((h: any) => h.id !== hotspotId) || [];
    updateLocalScene({ hotspots: updatedHotspots });
  };

  const handleSaveAll = async () => {
    if (!firestore || !id) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(firestore);
      for (const scene of localScenes) {
        const sceneDocRef = doc(firestore, 'tours', id as string, 'scenes', scene.id);
        batch.set(sceneDocRef, scene, { merge: true });
      }
      for (const sceneIdToDelete of deletedSceneIds) {
        const sceneDocRef = doc(firestore, 'tours', id as string, 'scenes', sceneIdToDelete);
        batch.delete(sceneDocRef);
      }
      if (tourRef && tour) {
        batch.set(tourRef, { 
          name: localTourInfo.name,
          clientName: localTourInfo.clientName,
          description: localTourInfo.description,
          floorPlanUrl: localTourInfo.floorPlanUrl,
          showFloorPlan: localTourInfo.showFloorPlan,
          address: localTourInfo.address,
          googleMapsUrl: localTourInfo.googleMapsUrl,
          thumbnailUrl: localScenes.length > 0 ? localScenes[0].imageUrl : tour.thumbnailUrl || '',
          updatedAt: Date.now() 
        }, { merge: true });
      }
      await batch.commit();
      setDeletedSceneIds([]);
      setHasUnsavedChanges(false);
      setIsSaving(false);
      toast({ title: "Proyecto Guardado", description: "Todos los cambios han sido sincronizados." });
    } catch (error) {
      console.error(error);
      setIsSaving(false);
      toast({ variant: "destructive", title: "Error al guardar", description: "Ocurrió un problema al subir los datos." });
    }
  };

  const deleteActiveScene = () => {
    if (localScenes.length <= 1) {
       toast({ variant: "destructive", title: "Error", description: "Un tour debe tener al menos una estancia." });
       return;
    }
    if (activeSceneId) {
      if (serverScenes?.some(s => s.id === activeSceneId)) {
        setDeletedSceneIds(prev => [...prev, activeSceneId]);
      }
      const filtered = localScenes.filter(s => s.id !== activeSceneId);
      setLocalScenes(filtered);
      setActiveSceneId(filtered[0]?.id || null);
      setHasUnsavedChanges(true);
      toast({ title: "Estancia removida", description: "Presiona Guardar Todo para aplicar los cambios." });
    }
  };

  if (isTourLoading || isScenesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Cargando editor profesional...</p>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md">
          <h1 className="text-2xl font-bold mb-2">Proyecto no encontrado</h1>
          <p className="text-muted-foreground mb-8">El tour que intentas editar no existe o no tienes permisos para acceder.</p>
          <Button onClick={() => router.push('/admin')}>Volver al Panel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase">
              <User className="w-3 h-3" /> {localTourInfo.clientName}
            </div>
            <h1 className="text-2xl font-bold font-headline">{localTourInfo.name || tour.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Editor de Proyecto • {localScenes.length} Estancias
              {hasUnsavedChanges && (
                <span className="flex items-center gap-1 text-accent font-bold animate-pulse">
                  <AlertCircle className="w-3 h-3" /> Cambios sin guardar
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            className="bg-primary hover:bg-primary/90 gap-2" 
            onClick={handleSaveAll} 
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Guardando...' : 'Guardar Todo'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[calc(100vh-180px)]">
        {/* PANEL IZQUIERDO: Portafolio y Configuración Global */}
        <div className="lg:col-span-3 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          <section className="space-y-4">
            <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Portafolio de Escenas
            </h3>
            <div className="grid grid-cols-1 gap-2">
               <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-dashed h-12" 
                  onClick={() => sceneFileInputRef.current?.click()}
                  disabled={isUploading}
               >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isUploading ? 'Procesando...' : 'Añadir Estancia'}
               </Button>
               <input type="file" ref={sceneFileInputRef} className="hidden" accept="image/*" onChange={handleSceneFileChange} />
            </div>
            <div className="space-y-2">
              {localScenes.map((scene) => (
                <Card 
                  key={scene.id} 
                  className={`cursor-pointer transition-all border-2 relative ${activeSceneId === scene.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'}`}
                  onClick={() => setActiveSceneId(scene.id)}
                >
                  <div className="p-2 flex items-center gap-3">
                    <div className="w-14 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                      <img src={scene.imageUrl} className="w-full h-full object-cover" alt={scene.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{scene.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{(scene.hotspots || []).length} enlaces</span>
                        {scene.floorPlanX !== undefined && <MapPin className="w-2.5 h-2.5 text-primary" />}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <Separator />

          <section className="space-y-4 pb-10">
            <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Settings className="w-4 h-4" /> Configuración del Proyecto
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Cliente (Privado)</Label>
                <div className="relative">
                  <Input 
                    list="edit-clients-list"
                    value={localTourInfo.clientName} 
                    className="h-8 text-xs pr-8"
                    onChange={(e) => {
                      setLocalTourInfo({ ...localTourInfo, clientName: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                  />
                  <Search className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <datalist id="edit-clients-list">
                    {existingClients.map((client: any) => (
                      <option key={client} value={client} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre Público</Label>
                <Input 
                  value={localTourInfo.name} 
                  className="h-8 text-xs"
                  onChange={(e) => {
                    setLocalTourInfo({ ...localTourInfo, name: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descripción</Label>
                <Textarea 
                  value={localTourInfo.description} 
                  className="h-20 text-xs resize-none"
                  onChange={(e) => {
                    setLocalTourInfo({ ...localTourInfo, description: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>
              
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-primary" /> Dirección de la Propiedad (Texto)
                  </Label>
                  <div className="relative">
                    <Input 
                      value={localTourInfo.address} 
                      placeholder="ej. Av. Corrientes 1234, CABA"
                      className="h-8 text-xs pr-8"
                      onChange={(e) => {
                        setLocalTourInfo({ ...localTourInfo, address: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                    {localTourInfo.address && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-0 top-0 h-8 w-8 text-primary"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localTourInfo.address)}`, '_blank')}
                        title="Ver en Google Maps"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-2">
                    <LinkIcon className="w-3 h-3 text-primary" /> Enlace Manual Google Maps
                  </Label>
                  <Input 
                    value={localTourInfo.googleMapsUrl} 
                    placeholder="Pega el enlace directo aquí..."
                    className="h-8 text-xs"
                    onChange={(e) => {
                      setLocalTourInfo({ ...localTourInfo, googleMapsUrl: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                  />
                  {localTourInfo.googleMapsUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-[10px] text-primary gap-1 px-1"
                      onClick={() => window.open(localTourInfo.googleMapsUrl, '_blank')}
                    >
                      <ExternalLink className="w-2.5 h-2.5" /> Probar Enlace
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                <Label className="text-xs cursor-pointer" htmlFor="floorplan-toggle">Habilitar Plano</Label>
                <Switch 
                  id="floorplan-toggle"
                  checked={localTourInfo.showFloorPlan} 
                  onCheckedChange={(checked) => {
                    setLocalTourInfo({ ...localTourInfo, showFloorPlan: checked });
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>
              {localTourInfo.showFloorPlan && (
                <div className="space-y-2">
                  <div 
                    className="aspect-video bg-muted rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors overflow-hidden relative"
                    onClick={() => floorPlanFileInputRef.current?.click()}
                  >
                    {localTourInfo.floorPlanUrl ? (
                      <img src={localTourInfo.floorPlanUrl} className="w-full h-full object-contain" alt="Plano" />
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                        <span className="text-[10px] text-muted-foreground">Subir Plano</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={floorPlanFileInputRef} className="hidden" accept="image/*" onChange={handleFloorPlanFileChange} />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* PANEL CENTRAL: Visor 360 */}
        <div className="lg:col-span-6 flex flex-col gap-4 min-h-[400px]">
          <div className="flex-grow rounded-3xl overflow-hidden shadow-xl border relative bg-black">
            {activeScene ? (
              <ThreeSixtyViewer 
                imageUrl={activeScene.imageUrl} 
                hotspots={activeScene.hotspots || []}
                isEditing={true}
                onSceneClick={addHotspot}
                onHotspotClick={(targetId) => setActiveSceneId(targetId)}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <p>Añade una estancia para empezar</p>
              </div>
            )}
          </div>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-2.5 px-4 flex items-center gap-3">
              <PlusCircle className="w-4 h-4 text-primary" />
              <p className="text-[11px] text-primary-foreground/80">
                <span className="font-bold">Modo Tejedor:</span> Toca en la vista 360 para enlazar con otra estancia.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* PANEL DERECHO: Detalles de Estancia y Ubicación */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto pl-2 custom-scrollbar">
          <Tabs defaultValue="details">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="details">Estancia</TabsTrigger>
              <TabsTrigger value="links">Enlaces</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="pt-4 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre de la Estancia</Label>
                  <Input 
                    value={activeScene?.name || ''} 
                    placeholder="ej. Cocina Americana" 
                    onChange={(e) => updateLocalScene({ name: e.target.value })}
                  />
                </div>
                
                {localTourInfo.showFloorPlan && localTourInfo.floorPlanUrl && (
                  <div className="space-y-3">
                    <Label className="text-xs flex items-center gap-2">
                      <Crosshair className="w-3 h-3 text-primary" /> Ubicación en el Plano
                    </Label>
                    <div 
                      className="relative aspect-video bg-muted rounded-xl border-2 border-primary/20 cursor-crosshair overflow-hidden group"
                      onClick={handleFloorPlanClick}
                    >
                      <img src={localTourInfo.floorPlanUrl} className="w-full h-full object-contain pointer-events-none" alt="Mini Plano" />
                      {/* Marcadores de todas las escenas */}
                      {localScenes.map(s => s.floorPlanX !== undefined && (
                        <div 
                          key={s.id}
                          className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-sm -translate-x-1/2 -translate-y-1/2 transition-all ${s.id === activeSceneId ? 'bg-primary scale-150 z-20' : 'bg-muted-foreground/60 z-10'}`}
                          style={{ left: `${s.floorPlanX}%`, top: `${s.floorPlanY}%` }}
                        />
                      ))}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                         <p className="text-[10px] text-white font-bold">Haz clic para marcar posición</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">Toca el mapa para situar esta estancia.</p>
                  </div>
                )}
              </div>
              
              <Separator />
              <Button 
                variant="outline" 
                className="w-full gap-2 text-destructive border-destructive/10 hover:bg-destructive/10 h-9 text-xs"
                onClick={deleteActiveScene}
              >
                <Trash2 className="w-4 h-4" /> Eliminar Estancia
              </Button>
            </TabsContent>

            <TabsContent value="links" className="pt-4 space-y-4">
              {(!activeScene?.hotspots || activeScene.hotspots.length === 0) ? (
                <div className="text-center py-12 opacity-40 border rounded-2xl border-dashed">
                   <PlusCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                   <p className="text-xs">Usa la vista 360 para crear enlaces</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeScene?.hotspots.map((h) => (
                    <Card key={h.id} className="p-3 bg-white border-2 border-muted shadow-sm">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black uppercase text-primary">Navegación</p>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-destructive h-6 w-6" 
                            onClick={() => removeHotspot(h.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground font-bold">Etiqueta</Label>
                          <Input 
                            value={h.label} 
                            className="h-7 text-xs"
                            onChange={(e) => updateHotspot(h.id, { label: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground font-bold">Destino</Label>
                          <Select 
                            value={h.targetSceneId} 
                            onValueChange={(val) => {
                              const target = localScenes.find(s => s.id === val);
                              updateHotspot(h.id, { 
                                targetSceneId: val,
                                label: h.label.startsWith('Ir a') ? `Ir a ${target?.name}` : h.label 
                              });
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Elegir..." />
                            </SelectTrigger>
                            <SelectContent>
                              {localScenes.filter(s => s.id !== activeSceneId).map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
                          <p className="text-[8px] text-muted-foreground font-mono opacity-60">
                            YAW: {Math.round(h.yaw)}° • PITCH: {Math.round(h.pitch)}°
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
