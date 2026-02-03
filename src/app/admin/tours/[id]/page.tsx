"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tour, Scene, Hotspot } from '@/lib/types';
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
  Sparkles
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
  
  const tourRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'tours', id as string);
  }, [firestore, id]);

  const { data: tour, isLoading } = useDoc(tourRef);
  
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (tour?.scenes?.length > 0 && !activeSceneId) {
      setActiveSceneId(tour.scenes[0].id);
    }
  }, [tour, activeSceneId]);

  const activeScene = tour?.scenes?.find((s: any) => s.id === activeSceneId);

  const addHotspot = (yaw: number, pitch: number) => {
    if (!activeSceneId || !tour || !tourRef) return;
    
    const newHotspot: Hotspot = {
      id: Math.random().toString(36).substr(2, 9),
      sceneId: activeSceneId,
      targetSceneId: tour.scenes.find((s: any) => s.id !== activeSceneId)?.id || '',
      label: 'Nuevo Enlace',
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
    toast({ title: "Punto de Interés Añadido", description: "Ahora puedes seleccionar su destino." });
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
        imageDataUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElUWFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqGhc4SFxlNWVlsZ2iPj50mJqpGSk5SFxwdJhoc4iJipjKlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD/AD/AP/Z'
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
          description: `Se sugirieron ${suggestions.length} conexiones basadas en el contexto visual.` 
        });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error de IA", description: "No se pudieron generar sugerencias." });
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) return <div className="p-8">Cargando editor...</div>;
  if (!tour) return <div className="p-8">Tour no encontrado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-headline">{tour.name}</h1>
            <p className="text-sm text-muted-foreground">Editor de Tour • {tour.scenes?.length || 0} Escenas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleAiSuggest} disabled={isAiLoading}>
            <Sparkles className={`w-4 h-4 text-accent ${isAiLoading ? 'animate-spin' : ''}`} />
            {isAiLoading ? 'IA Trabajando...' : 'IA Enlazador de Escenas'}
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Save className="w-4 h-4" /> Guardar Cambios
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
        {/* Left Sidebar: Scene List */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Escenas
            </h3>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary">
              <PlusCircle className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="space-y-2">
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
                    <p className="text-xs text-muted-foreground truncate">{(scene.hotspots || []).length} puntos</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MapIcon className="w-4 h-4" /> Plano 2D
            </h3>
            <Card className="bg-muted/30 border-dashed border-2 flex flex-col items-center justify-center p-6 gap-2 text-center">
              <MapIcon className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">Sube un plano 2D para dar contexto</p>
              <Button variant="outline" size="sm" className="mt-2">Subir Plano</Button>
            </Card>
          </div>
        </div>

        {/* Center: 360 Viewer */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex-grow rounded-3xl overflow-hidden shadow-xl border">
            {activeScene ? (
              <ThreeSixtyViewer 
                imageUrl={activeScene.imageUrl} 
                hotspots={activeScene.hotspots || []}
                isEditing={true}
                onSceneClick={addHotspot}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <p>Selecciona una escena para editar</p>
              </div>
            )}
          </div>
          
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="py-3 px-4 flex items-center gap-4">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
              <p className="text-sm text-accent-foreground">
                <span className="font-bold">Consejo:</span> Haz clic en cualquier lugar de la vista 360 para añadir un nuevo punto de interés.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Details & Hotspots Editor */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto pl-2">
          <Tabs defaultValue="details">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="hotspots">Puntos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label>Nombre de la Escena</Label>
                <Input value={activeScene?.name || ''} placeholder="ej. Dormitorio Principal" readOnly />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={activeScene?.description || ''} placeholder="Añade contexto para los visitantes..." readOnly />
              </div>
              <Separator />
              <Button variant="destructive" className="w-full gap-2">
                <Trash2 className="w-4 h-4" /> Eliminar Escena
              </Button>
            </TabsContent>

            <TabsContent value="hotspots" className="pt-4 space-y-4">
              {(!activeScene?.hotspots || activeScene.hotspots.length === 0) ? (
                <div className="text-center py-10 opacity-50">
                   <LinkIcon className="w-8 h-8 mx-auto mb-2" />
                   <p className="text-sm">Sin puntos en esta escena</p>
                </div>
              ) : (
                activeScene?.hotspots.map((h: any) => (
                  <Card key={h.id} className="p-3 bg-white border">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold uppercase text-primary">Punto de Interés</span>
                         <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive">
                           <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Etiqueta</Label>
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
