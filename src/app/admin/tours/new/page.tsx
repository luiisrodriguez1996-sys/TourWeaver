
"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Globe, ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function NewTour() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!firestore) return;

    try {
      const tourData = {
        ...formData,
        published: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        scenes: []
      };
      
      const docRef = await addDocumentNonBlocking(collection(firestore, 'tours'), tourData);
      if (docRef) {
        toast({ title: "Proyecto Inicializado", description: "Ahora añade tus escenas 360°." });
        router.push(`/admin/tours/${docRef.id}`);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a Tours
      </Link>

      <Card className="border-none shadow-xl">
        <CardHeader>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
             <Globe className="text-primary w-6 h-6" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">Crear Nuevo Proyecto</CardTitle>
          <CardDescription>Configura los detalles del encargo inmobiliario.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Propiedad</Label>
              <Input 
                id="name" 
                placeholder="ej. Penthouse Torre Skyline" 
                required 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Identificador de URL (Slug)</Label>
              <div className="flex items-center gap-2">
                 <span className="hidden sm:inline text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">tourweaver.com/tour/</span>
                 <Input 
                  id="slug" 
                  placeholder="propiedad-exclusiva" 
                  required 
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notas del Proyecto</Label>
              <Textarea 
                id="description" 
                placeholder="Detalles sobre la propiedad, broker o requisitos especiales..." 
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Añadir Escena Inicial</Label>
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 border-dashed border-2 hover:bg-primary/5 hover:border-primary/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-6 h-6 text-primary" />
                  <span>Subir Panorámica 360°</span>
                </Button>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Te recomendamos usar fotos panorámicas 2:1 para la mejor experiencia inmersiva.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-primary hover:bg-primary/90 text-lg py-6" disabled={isLoading} type="submit">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Inicializando...
                </>
              ) : 'Crear Proyecto y Empezar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
