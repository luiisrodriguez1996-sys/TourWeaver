"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Save, Languages, CheckCircle2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const siteConfigRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'siteConfigurations', 'default');
  }, [firestore]);

  const { data: siteConfig, isLoading } = useDoc(siteConfigRef);

  const handleLanguageChange = (value: string) => {
    if (!siteConfigRef) return;
    
    setDocumentNonBlocking(siteConfigRef, {
      id: 'default',
      defaultLanguage: value
    }, { merge: true });

    toast({
      title: "Settings Saved",
      description: `Default language set to ${value === 'es' ? 'Spanish' : 'English'}.`,
    });
  };

  if (isLoading) return <div className="p-8">Loading settings...</div>;

  const currentLang = siteConfig?.defaultLanguage || 'es';

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Configuración del Sitio</h1>
        <p className="text-muted-foreground">Administra las preferencias globales de Tour Weaver</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-md overflow-hidden">
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
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="es" id="es" className="peer sr-only" />
                <Label
                  htmlFor="es"
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🇪🇸</span>
                    <span className="font-bold text-lg">Español</span>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Idioma por defecto para todas las interfaces públicas.</p>
                  {currentLang === 'es' && <CheckCircle2 className="w-5 h-5 text-primary mt-4" />}
                </Label>
              </div>

              <div>
                <RadioGroupItem value="en" id="en" className="peer sr-only" />
                <Label
                  htmlFor="en"
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all cursor-pointer"
                >
                   <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🇺🇸</span>
                    <span className="font-bold text-lg">English</span>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Default language for all public interfaces.</p>
                  {currentLang === 'en' && <CheckCircle2 className="w-5 h-5 text-primary mt-4" />}
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter className="bg-gray-50/50 text-sm text-muted-foreground border-t">
            Nota: Esto afectará la visualización de todos los tours publicados.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
