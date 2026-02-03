"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Globe, ArrowLeft, Upload } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function NewTour() {
  const router = useRouter();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
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
        router.push(`/admin/tours/${docRef.id}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
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
          <CardTitle className="text-3xl font-bold font-headline">Crear Nuevo Tour</CardTitle>
          <CardDescription>Configura los detalles básicos para tu experiencia virtual.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Tour</Label>
              <Input 
                id="name" 
                placeholder="ej. Villa Moderna Sunnyvale" 
                required 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug de URL Único</Label>
              <div className="flex items-center gap-2">
                 <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">tourweaver.com/tour/</span>
                 <Input 
                  id="slug" 
                  placeholder="mi-tour-cool" 
                  required 
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea 
                id="description" 
                placeholder="Proporciona una breve descripción del espacio..." 
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Carga de Escena Inicial (Imagen 360°)</Label>
              <div className="border-2 border-dashed border-primary/20 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:bg-primary/5 transition-colors cursor-pointer group">
                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="text-primary w-6 h-6" />
                 </div>
                 <div className="text-center">
                    <p className="font-medium">Haz clic o arrastra para subir imagen panorámica</p>
                    <p className="text-xs text-muted-foreground mt-1">Recomendado: 6000x3000 JPG, relación 2:1</p>
                 </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-primary hover:bg-primary/90 text-lg py-6" disabled={isLoading}>
              {isLoading ? 'Creando Experiencia...' : 'Inicializar Tour y Empezar a Tejer'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
