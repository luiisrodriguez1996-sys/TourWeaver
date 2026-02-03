"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tour, Scene, Hotspot } from '@/lib/types';
import { MOCK_TOURS } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThreeSixtyViewer } from '@/components/ThreeSixtyViewer';
import { 
  Plus, 
  Save, 
  Trash2, 
  ArrowLeft, 
  Layout, 
  ImageIcon, 
  Zap, 
  Link as LinkIcon,
  PlusCircle,
  Map as MapIcon,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { suggestSceneLinks } from '@/ai/flows/ai-suggest-scene-links';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export default function TourEditor() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [tour, setTour] = useState<Tour | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    // In a real app, fetch from Firebase
    const found = MOCK_TOURS.find(t => t.id === id);
    if (found) {
      setTour(found);
      setActiveSceneId(found.scenes[0]?.id || null);
    }
  }, [id]);

  const activeScene = tour?.scenes.find(s => s.id === activeSceneId);

  const addHotspot = (yaw: number, pitch: number) => {
    if (!activeSceneId || !tour) return;
    
    const newHotspot: Hotspot = {
      id: Math.random().toString(36).substr(2, 9),
      sceneId: activeSceneId,
      targetSceneId: tour.scenes.find(s => s.id !== activeSceneId)?.id || '',
      label: 'New Link',
      yaw,
      pitch
    };

    const updatedScenes = tour.scenes.map(s => {
      if (s.id === activeSceneId) {
        return { ...s, hotspots: [...s.hotspots, newHotspot] };
      }
      return s;
    });

    setTour({ ...tour, scenes: updatedScenes });
    toast({ title: "Hotspot Added", description: "You can now select its destination." });
  };

  const handleAiSuggest = async () => {
    if (!tour || tour.scenes.length < 2) {
      toast({ 
        variant: "destructive",
        title: "Insufficient Scenes", 
        description: "Add at least two scenes for AI suggestions." 
      });
      return;
    }

    setIsAiLoading(true);
    try {
      // Mocking image data URI for the AI as picsum URLs won't be readable by AI
      // In a real app, these would be base64 strings from storage or previous uploads
      const inputScenes = tour.scenes.map(s => ({
        id: s.id,
        description: s.description || s.name,
        imageDataUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElUWFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqGhc4SFxlNWVlsZ2iPj50mJqpGSk5SFxwdJhoc4iJipjKlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD/AD/AP/Z' // Tiny black pixel
      }));

      const suggestions = await suggestSceneLinks({ scenes: inputScenes });
      
      // Map suggestions back to hotspots
      const updatedScenes = [...tour.scenes];
      suggestions.forEach(sug => {
        const sceneIndex = updatedScenes.findIndex(s => s.id === sug.sourceSceneId);
        if (sceneIndex !== -1) {
          const newHotspot: Hotspot = {
            id: 'ai-' + Math.random().toString(36).substr(2, 9),
            sceneId: sug.sourceSceneId,
            targetSceneId: sug.targetSceneId,
            label: `Go to ${tour.scenes.find(sc => sc.id === sug.targetSceneId)?.name || 'Next Scene'}`,
            yaw: Math.random() * 360, // Randomish but usually AI would analyze pixels
            pitch: 0
          };
          updatedScenes[sceneIndex].hotspots.push(newHotspot);
        }
      });

      setTour({ ...tour, scenes: updatedScenes });
      toast({ 
        title: "AI Analysis Complete", 
        description: `Suggested ${suggestions.length} connections based on scene visual context.` 
      });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to generate suggestions." });
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!tour) return <div className="p-8">Loading editor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-headline">{tour.name}</h1>
            <p className="text-sm text-muted-foreground">Tour Editor • {tour.scenes.length} Scenes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleAiSuggest} disabled={isAiLoading}>
            <Sparkles className={`w-4 h-4 text-accent ${isAiLoading ? 'animate-spin' : ''}`} />
            {isAiLoading ? 'AI Weaving...' : 'AI Scene Linker'}
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
        {/* Left Sidebar: Scene List */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Scenes
            </h3>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary">
              <PlusCircle className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {tour.scenes.map(scene => (
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
                    <p className="text-xs text-muted-foreground truncate">{scene.hotspots.length} hotspots</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MapIcon className="w-4 h-4" /> Floor Plan
            </h3>
            <Card className="bg-muted/30 border-dashed border-2 flex flex-col items-center justify-center p-6 gap-2 text-center">
              <MapIcon className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">Upload 2D plan to provide context</p>
              <Button variant="outline" size="sm" className="mt-2">Upload Plan</Button>
            </Card>
          </div>
        </div>

        {/* Center: 360 Viewer */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex-grow rounded-3xl overflow-hidden shadow-xl border">
            {activeScene ? (
              <ThreeSixtyViewer 
                imageUrl={activeScene.imageUrl} 
                hotspots={activeScene.hotspots}
                isEditing={true}
                onSceneClick={addHotspot}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <p>Select a scene to edit</p>
              </div>
            )}
          </div>
          
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="py-3 px-4 flex items-center gap-4">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
              <p className="text-sm text-accent-foreground">
                <span className="font-bold">Pro Tip:</span> Click anywhere in the 360 view above to place a new navigation hotspot.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Details & Hotspots Editor */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto pl-2">
          <Tabs defaultValue="details">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label>Scene Name</Label>
                <Input value={activeScene?.name || ''} placeholder="e.g. Master Bedroom" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={activeScene?.description || ''} placeholder="Add context for visitors..." />
              </div>
              <Separator />
              <div className="space-y-2">
                 <Label>Panoramic Image URL</Label>
                 <Input value={activeScene?.imageUrl || ''} readOnly className="bg-muted text-xs" />
              </div>
              <Button variant="destructive" className="w-full gap-2">
                <Trash2 className="w-4 h-4" /> Delete Scene
              </Button>
            </TabsContent>

            <TabsContent value="hotspots" className="pt-4 space-y-4">
              {activeScene?.hotspots.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                   <LinkIcon className="w-8 h-8 mx-auto mb-2" />
                   <p className="text-sm">No hotspots in this scene</p>
                </div>
              ) : (
                activeScene?.hotspots.map(h => (
                  <Card key={h.id} className="p-3 bg-white border">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold uppercase text-primary">Hotspot</span>
                         <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive">
                           <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Label</Label>
                        <Input size={1} value={h.label} className="h-8 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Destination Scene</Label>
                        <select className="w-full h-8 text-xs rounded-md border border-input bg-background px-3">
                           {tour.scenes.map(s => (
                             <option key={s.id} value={s.id} selected={h.targetSceneId === s.id}>
                               {s.name}
                             </option>
                           ))}
                        </select>
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