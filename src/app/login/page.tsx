"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { initiateEmailSignIn } from '@/firebase';
import { useAuth } from '@/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      initiateEmailSignIn(auth, email, password);
      // El redireccionamiento se maneja en el layout o aquí tras el éxito de auth si fuera necesario
      router.push('/admin');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <div>
            <CardTitle className="text-2xl font-headline font-bold">Portal Administrativo</CardTitle>
            <CardDescription>Ingresa tus credenciales para gestionar tours</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@tourweaver.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Autenticando...' : 'Iniciar Sesión'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Al iniciar sesión, aceptas nuestros Términos de Servicio.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
