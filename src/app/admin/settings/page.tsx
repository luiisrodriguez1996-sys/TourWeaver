
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Languages, CheckCircle2, Phone, Mail, MessageSquare, BarChart3, ShieldCheck } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
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

  if (isLoading) return <div className="p-8">Cargando configuración...</div>;

  const currentLang = siteConfig?.defaultLanguage || 'es';

  return (
    <div className="max-w-4xl space-y-8">
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
                <Input 
                  placeholder="ej: 34600000000 (sin +)" 
                  defaultValue={siteConfig?.contactWhatsApp || ''}
                  onBlur={(e) => updateConfig({ contactWhatsApp: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold"><Phone className="w-4 h-4 text-primary" /> Teléfono Público</Label>
                <Input 
                  placeholder="ej: +34 900 000 000" 
                  defaultValue={siteConfig?.contactPhone || ''}
                  onBlur={(e) => updateConfig({ contactPhone: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-bold"><Mail className="w-4 h-4 text-primary" /> Email de Contacto</Label>
              <Input 
                type="email"
                placeholder="ej: hola@tourweaver.com" 
                defaultValue={siteConfig?.contactEmail || ''}
                onBlur={(e) => updateConfig({ contactEmail: e.target.value })}
                className="rounded-xl h-11"
              />
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50/50 text-[10px] text-muted-foreground border-t">
            Nota: Los datos de contacto individuales de cada tour se configuran dentro de cada propiedad.
          </CardFooter>
        </Card>

        {/* Google Analytics Integration */}
        <Card className="border-none shadow-md overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-accent/5">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-accent/10 rounded-lg">
                <BarChart3 className="text-accent w-5 h-5" />
              </div>
              <div>
                <CardTitle>Google Analytics</CardTitle>
                <CardDescription>Víncula tu propiedad de Google Analytics 4 para rastrear visitas a tus tours.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2">
                ID de Medición de GA4
                <Badge variant="outline" className="font-normal text-[9px] uppercase tracking-tighter">Recomendado</Badge>
              </Label>
              <Input 
                placeholder="ej: G-XXXXXXXXXX" 
                defaultValue={siteConfig?.googleAnalyticsId || ''}
                onBlur={(e) => updateConfig({ googleAnalyticsId: e.target.value })}
                className="rounded-xl h-11"
              />
              <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Una vez configurado, aparecerá una nueva pestaña de "Analytics" en tu panel lateral.
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50/50 text-[10px] text-muted-foreground border-t">
            El rastreo se aplicará automáticamente a todas tus páginas públicas y tours activos.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
