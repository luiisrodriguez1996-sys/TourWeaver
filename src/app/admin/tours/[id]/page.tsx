
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Scene, Hotspot, Tour, Floor } from '@/lib/types';
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
  Search,
  ChevronUp,
  ChevronDown,
  Info,
  Layers,
  ImageOff
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
import { cn } from '@/lib/utils';

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
    description: '',
    floors: [] as Floor[],
    showFloorPlan: false,
    address: '',
    googleMapsUrl: ''
  });

  const [localScenes, setLocalScenes] = useState<Scene[]>([]);
  const [deletedSceneIds, setDeletedSceneIds] = useState<string[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [highlightedHotspotId, setHighlightedHotspotId] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (tour) {
      setLocalTourInfo({
        name: tour.name || '',
        clientName: tour.clientName || '',
        description: tour.description || '',
        floors: tour.floors || [],
        showFloorPlan: !!tour.showFloorPlan,
        address: tour.address || '',
        googleMapsUrl: tour.googleMapsUrl || ''
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

  const activeScene = localScenes.find((s) => s.id === activeSceneId);
  const activeFloor = localTourInfo.floors.find(f => f.id === activeScene?.floorId);

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
            hotspots: [],
            floorId: localTourInfo.floors[0]?.id || undefined
          };
          setLocalScenes(prev => [...prev, newScene]);
          setActiveSceneId(sceneId);
          setHasUnsavedChanges(true);
          setIsUploading(false);
          toast({ title: "Estancia añadida" });
        } catch (error) {
          setIsUploading(false);
          toast({ variant: "destructive", title: "Error" });
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
    setLocalScenes(prev => prev.map(s => s.floorId === floorId ? { ...s, floorId: undefined, floorPlanX: undefined, floorPlanY: undefined } : s));
    setHasUnsavedChanges(true);
  };

  const handleFloorImageUpload = async (floorId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          let imageUrl = reader.result as string;
          if (file.size > 300000) {
            imageUrl = await compressImage(imageUrl, 1500, 0.7);
          }
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
    setLocalScenes(prev => prev.map(s => s.id === activeSceneId ? { ...s, ...updates } : s));
    setHasUnsavedChanges(true);
  };

  const handleFloorPlanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeSceneId || !activeFloor || !activeFloor.imageUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    updateLocalScene({ floorPlanX: x, floorPlanY: y });
  };

  const addHotspot = (yaw: number, pitch: number) => {
    if (!activeSceneId || localScenes.length < 2) return;
    const targetScene = localScenes.find(s => s.id !== activeSceneId);
    const newHotspot: Hotspot = {
      id: Math.random().toString(36).substr(2, 9),
      sceneId: activeSceneId,
      targetSceneId: targetScene?.id || '',
      label: `Ir a ${targetScene?.name || 'Siguiente Estancia'}`,
      yaw,
      pitch
    };
    updateLocalScene({ hotspots: [...(activeScene?.hotspots || []), newHotspot] });
    setActiveTab('links');
    setHighlightedHotspotId(newHotspot.id);
  };

  const removeHotspot = (hotspotId: string) => {
    updateLocalScene({ hotspots: activeScene?.hotspots.filter(h => h.id !== hotspotId) || [] });
  };

  const updateHotspot = (hotspotId: string, updates: Partial<Hotspot>) => {
    if (!activeScene) return;
    updateLocalScene({
      hotspots: activeScene.hotspots.map(h => h.id === hotspotId ? { ...h, ...updates } : h)
    });
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
      if (tourRef) {
        batch.set(tourRef, { 
          ...localTourInfo,
          thumbnailUrl: localScenes[0]?.imageUrl || '',
          sceneIds: localScenes.map(s => s.id),
          updatedAt: Date.now() 
        }, { merge: true });
      }
      await batch.commit();
      setDeletedSceneIds([]);
      setHasUnsavedChanges(false);
      setIsSaving(false);
      toast({ title: "Guardado con éxito" });
    } catch (error) {
      setIsSaving(false);
      toast({ variant: "destructive", title: "Error al guardar" });
    }
  };

  if (isTourLoading || isScenesLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase"><User className="w-3 h-3" /> {localTourInfo.clientName}</div>
            <h1 className="text-2xl font-bold">{localTourInfo.name}</h1>
          </div>
        </div>
        <Button className="bg-primary gap-2" onClick={handleSaveAll} disabled={isSaving || !hasUnsavedChanges}>
          {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />} Guardar Todo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Scenes List */}
        <div className="lg:col-span-3 space-y-4 bg-white rounded-3xl p-4 border shadow-sm max-h-[calc(100vh-220px)] overflow-y-auto">
          <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Estancias</h3>
          <Button variant="outline" className="w-full gap-2 border-dashed h-12" onClick={() => sceneFileInputRef.current?.click()}>
            {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />} Añadir Estancia
          </Button>
          <input type="file" ref={sceneFileInputRef} className="hidden" accept="image/*" onChange={handleSceneFileChange} />
          
          <div className="space-y-2">
            {localScenes.map((scene, index) => (
              <Card key={scene.id} className={cn("p-2 transition-all cursor-pointer border-2", activeSceneId === scene.id ? 'border-primary bg-primary/5' : 'border-transparent')}>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-10 rounded bg-muted overflow-hidden flex-shrink-0" onClick={() => setActiveSceneId(scene.id)}>
                    <img src={scene.imageUrl} className="w-full h-full object-cover" alt={scene.name} />
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => setActiveSceneId(scene.id)}>
                    <p className="text-xs font-bold truncate">{scene.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      {scene.floorId && <Layers className="w-2.5 h-2.5" />}
                      {scene.floorPlanX !== undefined && <MapPin className="w-2.5 h-2.5 text-primary" />}
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === 0} onClick={() => moveScene(index, 'up')}><ChevronUp className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" disabled={index === localScenes.length - 1} onClick={() => moveScene(index, 'down')}><ChevronDown className="w-3 h-3" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Center: Viewer */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="rounded-3xl overflow-hidden shadow-xl border relative bg-black aspect-[4/5] w-full max-h-[calc(100vh-220px)] flex items-center justify-center">
            {activeScene && (
              <ThreeSixtyViewer 
                imageUrl={activeScene.imageUrl} 
                hotspots={activeScene.hotspots || []}
                isEditing={true}
                onSceneClick={addHotspot}
                onHotspotClick={(tid, hid) => { setActiveTab('links'); setHighlightedHotspotId(hid); }}
              />
            )}
          </div>
          <div className="p-3 bg-primary/5 rounded-2xl flex items-center gap-3 text-[10px] font-medium text-primary border border-primary/20">
            <Info className="w-4 h-4" /> Toca en la vista 360 para tejer un enlace entre estancias.
          </div>
        </div>

        {/* Right: Scene/Links Details */}
        <div className="lg:col-span-3 space-y-4 bg-white rounded-3xl p-4 border shadow-sm max-h-[calc(100vh-220px)] overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2"><TabsTrigger value="details">Estancia</TabsTrigger><TabsTrigger value="links">Enlaces</TabsTrigger></TabsList>
            
            <TabsContent value="details" className="pt-4 space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5"><Label className="text-xs">Nombre</Label><Input value={activeScene?.name || ''} onChange={e => updateLocalScene({ name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Planta / Piso</Label>
                  <Select value={activeScene?.floorId || 'none'} onValueChange={val => updateLocalScene({ floorId: val === 'none' ? undefined : val })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar planta..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin planta</SelectItem>
                      {localTourInfo.floors.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                {activeFloor && (
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2"><Crosshair className="w-3 h-3" /> Ubicación en {activeFloor.name}</Label>
                    {activeFloor.imageUrl ? (
                      <div className="relative aspect-video bg-muted rounded-xl border-2 border-primary/20 cursor-crosshair overflow-hidden" onClick={handleFloorPlanClick}>
                        <img src={activeFloor.imageUrl} className="w-full h-full object-contain pointer-events-none" alt="Plano" />
                        {localScenes.filter(s => s.floorId === activeScene?.floorId).map(s => s.floorPlanX !== undefined && (
                          <div key={s.id} className={cn("absolute w-3 h-3 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2", s.id === activeSceneId ? 'bg-primary scale-150 z-20' : 'bg-muted-foreground/50 z-10')} style={{ left: `${s.floorPlanX}%`, top: `${s.floorPlanY}%` }} />
                        ))}
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted/40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center">
                        <ImageOff className="w-6 h-6 text-muted-foreground mb-2" />
                        <p className="text-[10px] text-muted-foreground">Esta planta no tiene plano cargado. Sube uno en "Gestión de Plantas" para ubicar estancias.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button variant="outline" className="w-full text-destructive border-destructive/20 mt-4" onClick={() => { if(activeSceneId) { setDeletedSceneIds(prev => [...prev, activeSceneId]); setLocalScenes(prev => prev.filter(s => s.id !== activeSceneId)); setActiveSceneId(localScenes[0]?.id || null); } }}>Eliminar Estancia</Button>
            </TabsContent>

            <TabsContent value="links" className="pt-4 space-y-3">
              {activeScene?.hotspots.map(h => (
                <Card key={h.id} className={cn("p-3 border-2", highlightedHotspotId === h.id ? 'border-primary' : 'border-muted')}>
                  <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-bold uppercase text-primary">Enlace</span><Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeHotspot(h.id)}><Trash2 className="w-3 h-3" /></Button></div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground">Yaw (H)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={h.yaw.toFixed(2)} 
                        className="h-7 text-[10px]" 
                        onChange={e => updateHotspot(h.id, { yaw: parseFloat(e.target.value) || 0 })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground">Pitch (V)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={h.pitch.toFixed(2)} 
                        className="h-7 text-[10px]" 
                        onChange={e => updateHotspot(h.id, { pitch: parseFloat(e.target.value) || 0 })} 
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
                  <PlusCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-[10px]">No hay enlaces en esta estancia.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom: General Configuration */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-3xl border shadow-md">
          <CardHeader className="bg-primary/5 pb-4"><CardTitle className="text-sm">Detalles de Propiedad</CardTitle></CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5"><Label className="text-xs font-bold">Cliente</Label><Input value={localTourInfo.clientName} onChange={e => { setLocalTourInfo({...localTourInfo, clientName: e.target.value}); setHasUnsavedChanges(true); }} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Nombre del Tour</Label><Input value={localTourInfo.name} onChange={e => { setLocalTourInfo({...localTourInfo, name: e.target.value}); setHasUnsavedChanges(true); }} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Descripción</Label><Textarea value={localTourInfo.description} onChange={e => { setLocalTourInfo({...localTourInfo, description: e.target.value}); setHasUnsavedChanges(true); }} /></div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-3xl border shadow-md">
          <CardHeader className="bg-primary/5 pb-4 flex flex-row items-center justify-between"><CardTitle className="text-sm">Gestión de Plantas y Planos</CardTitle><Button size="sm" onClick={addFloor} className="h-8 gap-1"><Plus className="w-3 h-3" /> Añadir Planta</Button></CardHeader>
          <CardContent className="pt-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localTourInfo.floors.map(floor => (
                  <Card key={floor.id} className="p-4 border-muted">
                    <div className="flex items-center justify-between mb-4">
                      <Input value={floor.name} className="h-8 font-bold border-none bg-muted/50 w-2/3" onChange={e => updateFloor(floor.id, { name: e.target.value })} />
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFloor(floor.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    <div className="relative aspect-video bg-muted rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:bg-muted/80" onClick={() => document.getElementById(`floor-input-${floor.id}`)?.click()}>
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
                  <div className="col-span-full py-10 text-center border-2 border-dashed rounded-2xl bg-muted/20">
                    <p className="text-xs text-muted-foreground">Añade plantas para organizar tus estancias y cargar planos opcionales.</p>
                  </div>
                )}
             </div>
             {localTourInfo.floors.length > 0 && (
                <div className="mt-6 flex items-center justify-between p-3 bg-muted/40 rounded-2xl border">
                  <Label className="text-xs font-bold">Mostrar selector de planos en el sitio público</Label>
                  <Switch checked={localTourInfo.showFloorPlan} onCheckedChange={checked => { setLocalTourInfo({...localTourInfo, showFloorPlan: checked}); setHasUnsavedChanges(true); }} />
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
