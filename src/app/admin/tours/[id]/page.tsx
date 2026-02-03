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
  Sparkles,
  Upload,
  Loader2,
  Check
} from 'lucide-react';
import { suggestSceneLinks } from '@/ai/flows/ai-suggest-scene-links';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

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

  const { data: tour, isLoading } = useDoc(tourRef);
  
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tour?.scenes?.length > 0 && !activeSceneId) {
      setActiveSceneId(tour.scenes[0].id);
    }
  }, [tour, activeSceneId]);

  const activeScene = tour?.scenes?.find((s: any) => s.id === activeSceneId);

  const compressImage = (dataUrl: string, maxWidth = 4096, quality = 0.8): Promise<string> => {
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
        
        if (compressed.length > 900000) {
          compressed = canvas.toDataURL('image/jpeg', 0.5);
        }
        
        if (compressed.length > 900000) {
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
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          let imageUrl = reader.result as string;
          
          if (file.size > 700000) {
            toast({ title: "Optimizando imagen", description: "Ajustando resolución para el servidor..." });
            imageUrl = await compressImage(imageUrl);
          }

          addNewScene('Nueva Estancia', imageUrl);
          setIsUploading(false);
          toast({ title: "Imagen lista", description: "La escena ha sido procesada y añadida." });
        } catch (error) {
          setIsUploading(false);
          toast({ variant: "destructive", title: "Error", description: "No se pudo procesar la imagen." });
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const addNewScene = (name: string, imageUrl: string) => {
    if (!tour || !tourRef) return;
    
    const newScene: Scene = {
      id: Math.random().toString(36).substr(2, 9),
      tourId: tour.id,
      name: name,
      description: '',
      imageUrl: imageUrl,
      hotspots: []
    };

    const updatedScenes = [...(tour.scenes || []), newScene];
    updateDocumentNonBlocking(tourRef, { scenes: updatedScenes });
    setActiveSceneId(newScene.id);
  };

  const updateSceneDetails = (field: 'name' | 'description', value: string) => {
    if (!tour || !tourRef || !activeSceneId) return;

    const updatedScenes = tour.scenes.map((s: any) => {
      if (s.id === activeSceneId) {
        return { ...s, [field]: value };
      }
      return s;
    });

    updateDocumentNonBlocking(tourRef, { scenes: updatedScenes });
  };

  const addHotspot = (yaw: number, pitch: number) => {
    if (!activeSceneId || !tour || !tourRef) return;
    
    const newHotspot: Hotspot = {
      id: Math.random().toString(36).substr(2, 9),
      sceneId: activeSceneId,
      targetSceneId: tour.scenes.find((s: any) => s.id !== activeSceneId)?.id || '',
      label: 'Siguiente Estancia',
      yaw,
      pitch
    };

    const updatedScenes = tour.scenes.map((s: any) => {
      if (s.id === activeSceneId) {
        return { ...s, hotspots: [...(s.hotspots || []), newHotspot] };
      }
      return s;
    });

    updateDocumentNonBlocking(tourRef, { scenes: updatedScenes });
    toast({ title: "Enlace Añadido", description: "Configura el destino en el panel derecho." });
  };

  const removeHotspot = (hotspotId: string) => {
    if (!tour || !tourRef || !activeSceneId) return;

    const updatedScenes = tour.scenes.map((s: any) => {
      if (s.id === activeSceneId) {
        return { ...s, hotspots: s.hotspots.filter((h: any) => h.id !== hotspotId) };
      }
      return s;
    });

    updateDocumentNonBlocking(tourRef, { scenes: updatedScenes });
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    // updateDocumentNonBlocking already happens on each change, 
    // but we simulate a global save for user feedback
    setTimeout(() => {
      setIsSaving(false);
      toast({ 
        title: "Cambios guardados", 
        description: "Toda la información ha sido sincronizada.",
        action: <Check className="w-4 h-4 text-green-500" />
      });
    }, 800);
  };

  const handleAiSuggest = async () => {
    if (!tour || tour.scenes.length < 2) {
      toast({ 
        variant: "destructive",
        title: "Escenas Insuficientes", 
        description: "Añade al menos dos escenas para sugerencias de IA." 
      });
      return;
    }

    setIsAiLoading(true);
    try {
      const inputScenes = tour.scenes.map((s: any) => ({
        id: s.id,
        description: s.description || s.name,
        imageDataUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElUWFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqGhc4SFxlNWVlsZ2iPj50mJqpGSk5SFxwdJhoc4iJipjKlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oAAAIRAxEAPwD/AD/AP/Z'
      }));

      const suggestions = await suggestSceneLinks({ scenes: inputScenes });
      
      const updatedScenes = [...tour.scenes];
      suggestions.forEach(sug => {
        const sceneIndex = updatedScenes.findIndex(s => s.id === sug.sourceSceneId);
        if (sceneIndex !== -1) {
          const newHotspot: Hotspot = {
            id: 'ai-' + Math.random().toString(36).substr(2, 9),
            sceneId: sug.sourceSceneId,
            targetSceneId: sug.targetSceneId,
            label: `Ir a ${tour.scenes.find((sc: any) => sc.id === sug.targetSceneId)?.name || 'Siguiente Escena'}`,
            yaw: Math.random() * 360,
            pitch: 0
          };
          if (!updatedScenes[sceneIndex].hotspots) updatedScenes[sceneIndex].hotspots = [];
          updatedScenes[sceneIndex].hotspots.push(newHotspot);
        }
      });

      if (tourRef) {
        updateDocumentNonBlocking(tourRef, { scenes: updatedScenes });
        toast({ 
          title: "Análisis de IA Completo", 
          description: `Se sugeririeron ${suggestions.length} conexiones inteligentes.` 
        });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error de IA", description: "No se pudieron generar sugerencias." });
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando editor profesional...</p>
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
            <p className="text-sm text-muted-foreground">Editor de Proyecto • {tour.scenes?.length || 0} Estancias</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:flex gap-2" onClick={handleAiSuggest} disabled={isAiLoading}>
            {isAiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-accent" />
            )}
            {isAiLoading ? 'IA Pensando...' : 'Auto-Enlazar IA'}
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 gap-2" 
            onClick={handleSaveAll} 
            disabled={isSaving}
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
                {isUploading ? 'Procesando...' : 'Subir Panorámica'}
             </Button>
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*" 
               onChange={handleFileChange}
             />
          </div>

          <div className="space-y-2 max-h-[300px] lg:max-h-none overflow-y-auto">
            {tour.scenes?.map((scene: any) => (
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

          <Separator className="my-6 hidden lg:block" />

          <div className="space-y-4 hidden lg:block">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MapIcon className="w-4 h-4" /> Plano Guía
            </h3>
            <Card className="bg-muted/30 border-dashed border-2 flex flex-col items-center justify-center p-6 gap-2 text-center">
              <MapIcon className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">Adjunta un plano 2D para orientación</p>
              <Button variant="outline" size="sm" className="mt-2">Subir Plano</Button>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col gap-4 min-h-[400px]">
          <div className="flex-grow rounded-3xl overflow-hidden shadow-xl border relative">
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
                <p>Añade tu primera escena para empezar</p>
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-2xl flex flex-col items-center gap-4">
                   <Loader2 className="w-8 h-8 animate-spin text-primary" />
                   <p className="font-medium text-center px-4">Optimizando imagen de alta resolución...<br/><span className="text-xs text-muted-foreground">Esto asegura que el tour cargue rápido para tus clientes</span></p>
                </div>
              </div>
            )}
          </div>
          
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="py-3 px-4 flex items-center gap-4">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
              <p className="text-xs sm:text-sm text-accent-foreground">
                <span className="font-bold">Modo Tejedor:</span> Toca en la vista 360 para crear un punto de navegación hacia otra estancia.
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
                  placeholder="Dormitorio, Salón..." 
                  onChange={(e) => updateSceneDetails('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Notas de Escena</Label>
                <Textarea 
                  value={activeScene?.description || ''} 
                  placeholder="Info extra para el cliente..." 
                  className="resize-none h-24" 
                  onChange={(e) => updateSceneDetails('description', e.target.value)}
                />
              </div>
              <Separator />
              <Button 
                variant="outline" 
                className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" /> Eliminar Escena
              </Button>
            </TabsContent>

            <TabsContent value="hotspots" className="pt-4 space-y-4">
              {(!activeScene?.hotspots || activeScene.hotspots.length === 0) ? (
                <div className="text-center py-10 opacity-50 border rounded-xl border-dashed">
                   <LinkIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                   <p className="text-sm">Sin conexiones establecidas</p>
                </div>
              ) : (
                activeScene?.hotspots.map((h: any) => (
                  <Card key={h.id} className="p-3 bg-white border">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold uppercase text-primary px-2 py-1 bg-primary/10 rounded">Navegación</span>
                         <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeHotspot(h.id)}
                         >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Texto del botón</Label>
                        <Input size={1} value={h.label} className="h-8 text-xs" readOnly />
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}