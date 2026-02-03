import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Map, Zap, ShieldCheck, Globe, Building2, UserCheck, Layout } from 'lucide-react';

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
            <Link href="#servicios" className="hover:text-primary transition-colors">Servicios</Link>
            <Link href="#portafolio" className="hover:text-primary transition-colors">Portafolio</Link>
            <Link href="#contacto" className="hover:text-primary transition-colors">Contacto</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Acceso Propietario</Button>
            </Link>
            <Button className="hidden sm:flex">Solicitar Presupuesto</Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-white to-background">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <Badge variant="secondary" className="mb-4 py-1 px-4 text-primary bg-primary/10 border-primary/20">
                Servicio Profesional para Real Estate
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-bold font-headline leading-tight mb-6">
                Vende Propiedades con <span className="text-primary">Tours 360°</span> de Alta Gama
              </h1>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                Ayudo a agentes inmobiliarios y brokers a destacar sus propiedades. Creo experiencias inmersivas que permiten a tus clientes visitar su futuro hogar desde cualquier lugar del mundo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="#contacto">
                  <Button size="lg" className="px-8 text-lg bg-accent hover:bg-accent/90">Contratar Servicio</Button>
                </Link>
                <Link href="#portafolio">
                  <Button size="lg" variant="outline" className="px-8 text-lg border-primary text-primary hover:bg-primary/5">Ver Portafolio</Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full"></div>
          </div>
        </section>

        {/* Services Section */}
        <section id="servicios" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold font-headline mb-4">Soluciones de Visualización Inmobiliaria</h2>
              <p className="text-muted-foreground">Ofrezco un servicio integral de captura y creación de tours virtuales optimizados para la venta de inmuebles.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-none shadow-sm bg-background/50 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <Camera className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Captura de Alta Fidelidad</h3>
                  <p className="text-muted-foreground">Fotografía panorámica profesional con post-procesamiento para que cada estancia luzca impecable y luminosa.</p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-sm bg-background/50 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                    <Layout className="text-accent w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Navegación Fluida</h3>
                  <p className="text-muted-foreground">Diseño una interfaz personalizada e intuitiva para que los compradores naveguen por la propiedad de forma natural.</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-background/50 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <Building2 className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Enfoque Comercial</h3>
                  <p className="text-muted-foreground">Tours diseñados específicamente para brokers, incluyendo información relevante y puntos de contacto directos.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Portfolio Section placeholder */}
        <section id="portafolio" className="py-24 bg-background/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold font-headline mb-4">Últimos Trabajos Realizados</h2>
              <p className="text-muted-foreground">Explora algunos de los tours virtuales que he creado para mis clientes del sector inmobiliario.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="group relative aspect-video rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                    <img 
                      src={`https://picsum.photos/seed/real-estate-${i}/800/600`} 
                      alt={`Proyecto ${i}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div>
                        <p className="text-white font-bold">Residencia Luxury {i}</p>
                        <p className="text-white/70 text-sm">Servicio de Tour Completo</p>
                      </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contacto" className="py-24">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-3xl p-12 lg:p-20 text-white flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-6">¿Interesado en potenciar tus listados?</h2>
                <p className="text-xl text-white/80 mb-8">Ofrezco paquetes personalizados para agencias y brokers individuales. Mejora el engagement de tus anuncios hoy mismo.</p>
                <div className="flex gap-4">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90">Contactar por WhatsApp</Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Ver Tarifas</Button>
                </div>
              </div>
              <div className="flex-1 relative aspect-square w-full max-w-sm bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                 <div className="text-center">
                    <UserCheck className="w-20 h-20 mx-auto mb-4 text-white" />
                    <p className="text-2xl font-bold">Servicio Garantizado</p>
                    <p className="text-white/60">Calidad Profesional</p>
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
          <p className="text-sm text-muted-foreground">© 2024 Tour Weaver - Servicios de Visualización 360°. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Servicios</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Badge({ children, variant, className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
