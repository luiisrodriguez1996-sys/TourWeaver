"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Languages, CheckCircle2, Phone, Mail, MessageSquare, BarChart3, ShieldCheck, AlertTriangle, Trash2, Loader2, Search } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  
  const siteConfigRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'siteConfigurations', 'default');
  }, [firestore]);

  const { data: siteConfig, isLoading } = useDoc(siteConfigRef);

  const updateConfig = (updates: any) => {
    if (!siteConfigRef) return;
    
    setDocumentNonBlocking(siteConfigRef, {
      id: 'default',
      ...updates
    }, { merge: true });

    toast({
      title: "Configuración Guardada",
      description: "Los cambios se han aplicado correctamente.",
    });
  };

  const handleLanguageChange = (value: string) => {
    updateConfig({ defaultLanguage: value });
  };

  const handleResetStats = async () => {
    if (!firestore) return;
    setIsResetting(true);
    
    try {
      const visitsRef = collection(firestore, 'tourVisits');
      const snapshot = await getDocs(visitsRef);
      
      if (snapshot.empty) {
        toast({ title: "Sin datos", description: "No hay registros de estadísticas para borrar." });
        setIsResetting(false);
        return;
      }

      const batch = writeBatch(firestore);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      toast({
        title: "Estadísticas Reiniciadas",
        description: "Todos los registros de visitas han sido eliminados correctamente.",
      });
    } catch (error) {
      console.error("Error al borrar estadísticas:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron borrar las estadísticas. Inténtalo de nuevo.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando configuración...</div>;

  const currentLang = siteConfig?.defaultLanguage || 'es';

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-headline">Configuración del Sitio</h1>
        <p className="text-muted-foreground">Administra las preferencias globales y datos de contacto de Tour Weaver</p>
      </div>

      <div className="grid gap-8">
        {/* Idioma */}
        <Card className="border-none shadow-md overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Languages className="text-primary w-5 h-5" />
              </div>
              <div>
                <CardTitle>Idioma Predeterminado</CardTitle>
                <CardDescription>Selecciona el idioma principal para los visitantes del sitio.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <RadioGroup 
              defaultValue={currentLang} 
              onValueChange={handleLanguageChange}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="es" id="es" className="peer sr-only" />
                <Label
                  htmlFor="es"
                  className="flex flex-col items-center justify-between h-full rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🇪🇸</span>
                    <span className="font-bold text-lg">Español</span>
                  </div>
                  {currentLang === 'es' && <CheckCircle2 className="w-5 h-5 text-primary mt-4" />}
                </Label>
              </div>

              <div>
                <RadioGroupItem value="en" id="en" className="peer sr-only" />
                <Label
                  htmlFor="en"
                  className="flex flex-col items-center justify-between h-full rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all cursor-pointer"
                >
                   <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🇺🇸</span>
                    <span className="font-bold text-lg">English</span>
                  </div>
                  {currentLang === 'en' && <CheckCircle2 className="w-5 h-5 text-primary mt-4" />}
                </Label>
              </div>

              <div>
                <RadioGroupItem value="pt" id="pt" className="peer sr-only" />
                <Label
                  htmlFor="pt"
                  className="flex flex-col items-center justify-between h-full rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all cursor-pointer"
                >
                   <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🇧🇷</span>
                    <span className="font-bold text-lg">Português</span>
                  </div>
                  {currentLang === 'pt' && <CheckCircle2 className="w-5 h-5 text-primary mt-4" />}
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Contacto Global */}
        <Card className="border-none shadow-md overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Phone className="text-primary w-5 h-5" />
              </div>
              <div>
                <CardTitle>Contacto del Negocio (Home)</CardTitle>
                <CardDescription>Estos datos se usarán en la página de inicio. Si están vacíos, no aparecerán botones de contacto.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold"><MessageSquare className="w-4 h-4 text-green-500" /> WhatsApp para Home</Label>
                <input 
                  type="text"
                  placeholder="ej: 34600000000 (sin +)" 
                  defaultValue={siteConfig?.contactWhatsApp || ''}
                  onBlur={(e) => updateConfig({ contactWhatsApp: e.currentTarget.value })}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold"><Phone className="w-4 h-4 text-primary" /> Teléfono Público</Label>
                <input 
                  type="text"
                  placeholder="ej: +34 900 000 000" 
                  defaultValue={siteConfig?.contactPhone || ''}
                  onBlur={(e) => updateConfig({ contactPhone: e.currentTarget.value })}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-bold"><Mail className="w-4 h-4 text-primary" /> Email de Contacto</Label>
              <input 
                type="email"
                placeholder="ej: hola@tourweaver.com" 
                defaultValue={siteConfig?.contactEmail || ''}
                onBlur={(e) => updateConfig({ contactEmail: e.currentTarget.value })}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50/50 text-[10px] text-muted-foreground border-t">
            Nota: Los datos de contacto individuales de cada tour se configuran dentro de cada propiedad.
          </CardFooter>
        </Card>

        {/* Google Tools */}
        <Card className="border-none shadow-md overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-accent/5">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-accent/10 rounded-lg">
                <BarChart3 className="text-accent w-5 h-5" />
              </div>
              <div>
                <CardTitle>Herramientas de Google</CardTitle>
                <CardDescription>Configura Analytics y la verificación de Search Console.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2">
                ID de Medición de GA4
                <Badge variant="outline" className="font-normal text-[9px] uppercase tracking-tighter">Recomendado</Badge>
              </Label>
              <input 
                type="text"
                placeholder="ej: G-XXXXXXXXXX" 
                defaultValue={siteConfig?.googleAnalyticsId || ''}
                onBlur={(e) => updateConfig({ googleAnalyticsId: e.currentTarget.value })}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Rastreo automático de visitas y clics de contacto.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-dashed">
              <Label className="font-bold flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" /> Verificación de Google Search Console
              </Label>
              <input 
                type="text"
                placeholder="Pega aquí el código de verificación (content='...')" 
                defaultValue={siteConfig?.googleSearchConsoleCode || ''}
                onBlur={(e) => updateConfig({ googleSearchConsoleCode: e.currentTarget.value })}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="bg-muted/30 p-3 rounded-xl space-y-2">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  <strong>Instrucciones:</strong> En Search Console, elige <strong>Prefijo de URL</strong> &gt; <strong>Etiqueta HTML</strong>. 
                  Copia solo el valor del atributo <code>content</code> (ej: <code>PagIUOTwGh...</code>) y pégalo arriba.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50/50 text-[10px] text-muted-foreground border-t">
            El meta tag de verificación se inyectará automáticamente en todas las páginas.
          </CardFooter>
        </Card>

        {/* Zona de Peligro / Mantenimiento */}
        <Card className="border-destructive/20 border-2 shadow-md overflow-hidden rounded-[2rem] bg-destructive/5">
          <CardHeader className="bg-destructive/10">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-destructive/20 rounded-lg">
                <AlertTriangle className="text-destructive w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                <CardDescription className="text-destructive/70">Acciones irreversibles sobre los datos de la plataforma.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm">Reiniciar Estadísticas Internas</p>
                <p className="text-xs text-muted-foreground">Esta acción borrará permanentemente todo el historial de visitas registradas en Firestore.</p>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="rounded-xl gap-2 h-11" disabled={isResetting}>
                    {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Borrar Historial de Visitas
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2rem]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                      <AlertTriangle className="text-destructive w-6 h-6" /> ¿Estás completamente seguro?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base pt-2">
                      Esta acción es **irreversible**. Se eliminarán todos los registros de visitas y el panel de estadísticas volverá a estar a cero.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 sm:gap-0 pt-4">
                    <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleResetStats}
                      className="bg-destructive hover:bg-destructive/90 rounded-xl"
                    >
                      Sí, borrar estadísticas
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
