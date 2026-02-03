import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Map, Zap, ShieldCheck, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Globe className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold font-headline tracking-tight text-primary">Tour Weaver</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Características</Link>
            <Link href="#showcase" className="hover:text-primary transition-colors">Galería</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Acceso Admin</Button>
            </Link>
            <Link href="/admin">
              <Button>Panel de Control</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-white to-background">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-5xl lg:text-7xl font-bold font-headline leading-tight mb-6">
                Crea Experiencias <span className="text-primary">360° Inmersivas</span> en Minutos
              </h1>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                Tour Weaver permite a los creadores construir tours virtuales profesionales con facilidad. Enlazado de escenas mediante IA, puntos de interés interactivos y navegación fluida.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/admin/tours/new">
                  <Button size="lg" className="px-8 text-lg bg-accent hover:bg-accent/90">Empieza tu Primer Tour</Button>
                </Link>
                <Link href="#showcase">
                  <Button size="lg" variant="outline" className="px-8 text-lg border-primary text-primary hover:bg-primary/5">Ver Ejemplos</Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full"></div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold font-headline mb-4">Todo lo que necesitas para tejer historias</h2>
              <p className="text-muted-foreground">Nuestro potente conjunto de herramientas hace que la creación de tours virtuales sea sencilla para todos.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-none shadow-sm bg-background/50">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <Camera className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Soporte de Imágenes 360°</h3>
                  <p className="text-muted-foreground">Sube panorámicas equirrectangulares de alta resolución y nosotros nos encargamos del renderizado.</p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-sm bg-background/50">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                    <Zap className="text-accent w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Sugerencias por IA</h3>
                  <p className="text-muted-foreground">Deja que nuestra IA analice tus escenas y sugiera rutas óptimas para una navegación natural.</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-background/50">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <Map className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Integración de Planos</h3>
                  <p className="text-muted-foreground">Añade un mapa 2D para proporcionar contexto espacial y ayudar a los visitantes a orientarse.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Showcase Section */}
        <section id="showcase" className="py-24">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-3xl p-12 lg:p-20 text-white flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-6">¿Listo para publicar?</h2>
                <p className="text-xl text-white/80 mb-8">Únete a agentes inmobiliarios, curadores de museos y dueños de negocios que muestran sus espacios en 3D inmersivo.</p>
                <Link href="/admin">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90">Ir al Panel de Control</Button>
                </Link>
              </div>
              <div className="flex-1 relative aspect-video w-full max-w-xl bg-black/20 rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                 <img 
                   src="https://picsum.photos/seed/tour-show/1200/600" 
                   alt="Showcase" 
                   className="object-cover w-full h-full opacity-60"
                   data-ai-hint="virtual tour"
                 />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                       <Zap className="text-primary w-8 h-8 fill-primary" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Globe className="text-white w-4 h-4" />
            </div>
            <span className="font-bold font-headline text-primary">Tour Weaver</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 Tour Weaver Inc. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacidad</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
