"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Scene, Hotspot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ThreeSixtyViewer } from '@/components/ThreeSixtyViewer';
import { 
  Plus, 
  Save, 
  Trash2, 
  ArrowLeft, 
  ImageIcon, 
  Link as LinkIcon,
  PlusCircle,
  Map as MapIcon,
  Upload,
  Loader2,
  Check,
  AlertCircle,
  MapPin
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
import { doc, collection, writeBatch, deleteDoc, setDoc } from 'firebase/firestore';

export default function TourEditor() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const [localScenes, setLocalScenes] = useState<Scene[]>([]);
  const [deletedSceneIds, setDeletedSceneIds] = useState<string[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (serverScenes && localScenes.length === 0) {
      setLocalScenes(serverScenes);
      if (serverScenes.length > 0 && !activeSceneId) {
        setActiveSceneId(serverScenes[0].id);
      }
    }
  }, [serverScenes]);

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

        let compressed = canvas.toDataURL('image/jpeg', quality);
        
        if (compressed.length > 700000) {
          compressed = canvas.toDataURL('image/jpeg', 0.5);
        }
        
        if (compressed.length > 700000) {
          canvas.width = width / 2;
          canvas.height = height / 2;
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          compressed = canvas.toDataURL('image/jpeg', 0.4);
        }

        resolve(compressed);
      };
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const updateLocalScene = (updates: Partial<Scene>) => {
    if (!activeSceneId) return;
    setLocalScenes(prev => prev.map(s => s.id === activeSceneId ? { ...s, ...updates } : s));
    setHasUnsavedChanges(true);
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
      
      // 1. Guardar o actualizar estancias actuales
      for (const scene of localScenes) {
        const sceneDocRef = doc(firestore, 'tours', id as string, 'scenes', scene.id);
        batch.set(sceneDocRef, scene, { merge: true });
      }

      // 2. Eliminar estancias marcadas
      for (const sceneIdToDelete of deletedSceneIds) {
        const sceneDocRef = doc(firestore, 'tours', id as string, 'scenes', sceneIdToDelete);
        batch.delete(sceneDocRef);
      }

      // 3. Actualizar miniatura del tour si hay estancias
      if (localScenes.length > 0 && tourRef) {
        batch.set(tourRef, { thumbnailUrl: localScenes[0].imageUrl, updatedAt: Date.now() }, { merge: true });
      }

      await batch.commit();

      setDeletedSceneIds([]); // Limpiar cola de eliminación
      setHasUnsavedChanges(false);
      setIsSaving(false);
      toast({ 
        title: "Proyecto Guardado", 
        description: "Todos los cambios han sido sincronizados.",
      });
    } catch (error) {
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
      // Si la escena ya existía en el servidor, añadirla a la cola de eliminación física
      if (serverScenes?.some(s => s.id === activeSceneId)) {
        setDeletedSceneIds(prev => [...prev, activeSceneId]);
      }
      
      const filtered = localScenes.filter(s => s.id !== activeSceneId);
      setLocalScenes(filtered);
      setActiveSceneId(filtered[0]?.id || null);
      setHasUnsavedChanges(true);
      toast({ title: "Estancia removida de la lista", description: "Presiona Guardar Todo para aplicar el borrado permanente." });
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
  
  if (!tour) return <div className="p-8">Proyecto no encontrado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-headline">{tour.name}</h1>
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
        <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-0 lg:pr-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Portafolio de Escenas
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-2 mb-4">
             <Button 
                variant="outline" 
                size="sm" 
                className="gap-2" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
             >
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {isUploading ? 'Procesando...' : 'Añadir Panorámica'}
             </Button>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="space-y-2 max-h-[300px] lg:max-h-none overflow-y-auto">
            {localScenes.map((scene) => (
              <Card 
                key={scene.id} 
                className={`cursor-pointer transition-all border-2 ${activeSceneId === scene.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'}`}
                onClick={() => setActiveSceneId(scene.id)}
              >
                <div className="p-3 flex items-center gap-3">
                  <div className="w-16 h-10 rounded bg-muted overflow-hidden">
                    <img src={scene.imageUrl} className="w-full h-full object-cover" alt={scene.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{scene.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{(scene.hotspots || []).length} enlaces</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

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
          
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="py-3 px-4 flex items-center gap-4">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                <PlusCircle className="w-4 h-4 text-accent" />
              </div>
              <p className="text-xs sm:text-sm text-accent-foreground">
                <span className="font-bold">Modo Tejedor:</span> Toca en la vista 360 para crear un enlace hacia otra estancia.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4 overflow-y-auto pl-0 lg:pl-2">
          <Tabs defaultValue="details">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="hotspots">Enlaces</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label>Nombre de Estancia</Label>
                <Input 
                  value={activeScene?.name || ''} 
                  placeholder="ej. Salón Principal" 
                  onChange={(e) => updateLocalScene({ name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notas de Escena</Label>
                <Textarea 
                  value={activeScene?.description || ''} 
                  placeholder="Detalles adicionales sobre esta zona..." 
                  className="resize-none h-24" 
                  onChange={(e) => updateLocalScene({ description: e.target.value })}
                />
              </div>
              <Separator />
              <Button 
                variant="outline" 
                className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={deleteActiveScene}
              >
                <Trash2 className="w-4 h-4" /> Eliminar Estancia
              </Button>
            </TabsContent>

            <TabsContent value="hotspots" className="pt-4 space-y-4">
              {(!activeScene?.hotspots || activeScene.hotspots.length === 0) ? (
                <div className="text-center py-10 opacity-50 border rounded-xl border-dashed">
                   <LinkIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                   <p className="text-sm">Sin enlaces en esta estancia</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeScene?.hotspots.map((h: any) => (
                    <Card key={h.id} className="p-4 bg-white border-2 border-muted shadow-sm hover:border-primary/20 transition-colors">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase text-primary tracking-widest">Enlace de Navegación</p>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-destructive h-7 w-7 hover:bg-destructive/10" 
                            onClick={() => removeHotspot(h.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase">Etiqueta del Botón</Label>
                          <Input 
                            value={h.label} 
                            placeholder="ej. Ir a Cocina"
                            className="h-9 text-sm" 
                            onChange={(e) => updateHotspot(h.id, { label: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-muted-foreground uppercase">Destino</Label>
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
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Selecciona destino..." />
                            </SelectTrigger>
                            <SelectContent>
                              {localScenes.filter(s => s.id !== activeSceneId).map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <p className="text-[9px] text-muted-foreground font-mono flex gap-3 opacity-70">
                            <span>YAW: {Math.round(h.yaw)}°</span>
                            <span>PITCH: {Math.round(h.pitch)}°</span>
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
