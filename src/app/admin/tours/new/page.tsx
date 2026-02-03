
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Briefcase, ArrowLeft, Loader2, User, Search, MapPin, Link as LinkIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function NewTour() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    slug: '',
    description: '',
    address: '',
    googleMapsUrl: ''
  });

  // Obtener clientes existentes para sugerencias
  const toursRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tours');
  }, [firestore]);
  const { data: existingTours } = useCollection(toursRef);
  
  const existingClients = existingTours 
    ? Array.from(new Set(existingTours.map((t: any) => t.clientName).filter(Boolean)))
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!firestore) return;

    try {
      const tourData = {
        name: formData.name,
        clientName: formData.clientName,
        slug: formData.slug || formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''),
        description: formData.description,
        address: formData.address,
        googleMapsUrl: formData.googleMapsUrl,
        published: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const docRef = await addDocumentNonBlocking(collection(firestore, 'tours'), tourData);
      if (docRef) {
        toast({ title: "Propiedad Inicializada", description: "Ahora puedes añadir tus escenas 360° en el editor." });
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
        <ArrowLeft className="w-4 h-4" /> Volver a Propiedades
      </Link>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-primary/5 pb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
             <Briefcase className="text-primary w-6 h-6" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">Nuevo Encargo Inmobiliario</CardTitle>
          <CardDescription>Configura los detalles del cliente y la propiedad para comenzar.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="flex items-center gap-2 text-sm font-bold">
                <User className="w-4 h-4 text-primary" /> Cliente (Uso Interno)
              </Label>
              <div className="relative">
                <Input 
                  id="clientName" 
                  list="clients-list"
                  placeholder="Escribe el nombre del cliente o inmobiliaria..." 
                  required 
                  value={formData.clientName}
                  onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                  className="rounded-xl h-11 pr-10"
                />
                <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                <datalist id="clients-list">
                  {existingClients.map((client: any) => (
                    <option key={client} value={client} />
                  ))}
                </datalist>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-bold">Nombre público de la propiedad</Label>
              <Input 
                id="name" 
                placeholder="ej. Penthouse Torre Skyline" 
                required 
                value={formData.name}
                onChange={e => {
                  const name = e.target.value;
                  setFormData({ 
                    ...formData, 
                    name, 
                    slug: name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '') 
                  });
                }}
                className="rounded-xl h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-bold">Identificador de URL (Slug)</Label>
              <div className="flex items-center gap-2">
                 <span className="hidden sm:inline text-xs font-mono text-muted-foreground bg-muted px-3 py-2.5 rounded-xl border">/tour/</span>
                 <Input 
                  id="slug" 
                  placeholder="propiedad-exclusiva" 
                  required 
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-bold">Notas de la Propiedad</Label>
              <Textarea 
                id="description" 
                placeholder="Detalles sobre la propiedad..." 
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="rounded-xl resize-none"
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-bold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Dirección de la Propiedad (Texto)
                </Label>
                <Input 
                  id="address" 
                  placeholder="ej. Av. Corrientes 1234, CABA, Argentina" 
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleMapsUrl" className="text-sm font-bold flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-primary" /> Enlace Manual de Google Maps
                </Label>
                <Input 
                  id="googleMapsUrl" 
                  placeholder="Pega aquí el enlace de compartir de Google Maps..." 
                  value={formData.googleMapsUrl}
                  onChange={e => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                  className="rounded-xl h-11"
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Si pegas un enlace aquí, se usará directamente. Si no, se buscará por la dirección escrita.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50/50 p-8 border-t">
            <Button className="w-full bg-primary hover:bg-primary/90 text-lg py-7 rounded-2xl shadow-lg shadow-primary/20" disabled={isLoading} type="submit">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Inicializando...
                </>
              ) : 'Crear Propiedad e Ir al Editor'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
