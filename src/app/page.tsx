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
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#showcase" className="hover:text-primary transition-colors">Showcase</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Admin Login</Button>
            </Link>
            <Link href="/admin">
              <Button>Dashboard</Button>
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
                Craft Immersive <span className="text-primary">360° Experiences</span> in Minutes
              </h1>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                Tour Weaver empowers creators to build professional virtual tours with ease. AI-powered scene linking, interactive hotspots, and seamless navigation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/admin/tours/new">
                  <Button size="lg" className="px-8 text-lg bg-accent hover:bg-accent/90">Start Your First Tour</Button>
                </Link>
                <Link href="#showcase">
                  <Button size="lg" variant="outline" className="px-8 text-lg border-primary text-primary hover:bg-primary/5">View Examples</Button>
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
              <h2 className="text-3xl font-bold font-headline mb-4">Everything you need to weave stories</h2>
              <p className="text-muted-foreground">Our powerful toolset makes complex virtual tour creation simple for everyone.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-none shadow-sm bg-background/50">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <Camera className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">360° Image Support</h3>
                  <p className="text-muted-foreground">Upload high-resolution equirectangular panoramas and let us handle the rendering.</p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-sm bg-background/50">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                    <Zap className="text-accent w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">AI Suggestions</h3>
                  <p className="text-muted-foreground">Let our AI analyze your scenes and suggest optimal paths for natural navigation.</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-background/50">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <Map className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Floor Plan Integration</h3>
                  <p className="text-muted-foreground">Add a 2D map to provide spatial context and help visitors orient themselves.</p>
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
                <h2 className="text-4xl font-bold mb-6">Ready to publish?</h2>
                <p className="text-xl text-white/80 mb-8">Join thousands of real estate agents, museum curators, and business owners showcasing their spaces in immersive 3D.</p>
                <Link href="/admin">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90">Go to Dashboard</Button>
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
          <p className="text-sm text-muted-foreground">© 2024 Tour Weaver Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}