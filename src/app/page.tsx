"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Camera, 
  Map, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Building2, 
  UserCheck, 
  Layout, 
  Languages, 
  ChevronDown, 
  MessageCircle, 
  ExternalLink, 
  ArrowRight, 
  Phone, 
  Mail,
  Loader2 as LoaderIcon 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VersionIndicator } from '@/components/VersionIndicator';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const translations = {
  es: {
    heroBadge: "Servicio Profesional para Real Estate",
    heroTitle: "Muestra Propiedades con",
    heroTitleHighlight: "Tours 360°",
    heroTitleEnd: "de Alta Gama",
    heroDesc: "Ayudamos a agentes inmobiliarios y brokers a destacar sus propiedades como negocio innovador. Creamos experiencias inmersivas que permiten a tus clientes visitar su futuro hogar desde cualquier lugar del mundo.",
    btnPresupuesto: "Solicitar Presupuesto",
    btnContratar: "Contratar Servicio",
    btnPortafolio: "Ver Portafolio",
    servicios: "Servicios",
    portafolio: "Portafolio",
    contacto: "Contacto",
    servTitle: "Soluciones de Visualización Inmobiliaria",
    servDesc: "Ofrecemos un servicio integral de captura y creación de tours virtuales optimizados para tus listados inmobiliarios.",
    serv1Title: "Captura de Alta Fidelidad",
    serv1Desc: "Fotografía panorámica profesional con post-procesamiento para que cada estancia luzca impecable y luminosa.",
    serv2Title: "Navegación Fluida",
    serv2Desc: "Diseñamos una interfaz personalizada e intuitiva para que tus clientes naveguen por la propiedad de forma natural.",
    serv3Title: "Enfoque Comercial",
    serv3Desc: "Tours diseñados específicamente para brokers, incluyendo información relevante y puntos de contacto directos.",
    ctaTitle: "¿Interesado en potenciar tus listados?",
    ctaDesc: "Ofrecemos paquetes personalizados para agencias y brokers individuales. Mejora el engagement de tus anuncios hoy mismo.",
    ctaWa: "Hablar por WhatsApp",
    ctaRates: "Ver Tarifas",
    ctaGuarantee: "Servicio Garantizado",
    ctaQuality: "Calidad Profesional",
    footerCopy: "© 2026 Tour Weaver - Servicios de Visualización 360°. Todos los derechos reservados.",
    footerTerms: "Condiciones de Uso",
    footerPrivacy: "Privacidad",
    viewTour: "Ver Tour Virtual"
  },
  en: {
    heroBadge: "Professional Real Estate Service",
    heroTitle: "Show Properties with",
    heroTitleHighlight: "360° Tours",
    heroTitleEnd: "High-End",
    heroDesc: "We help real estate agents and brokers stand out with their properties as an innovative business. We create immersive experiences that allow your clients to visit their future home from anywhere in the world.",
    btnPresupuesto: "Request Quote",
    btnContratar: "Hire Service",
    btnPortafolio: "View Portfolio",
    servicios: "Services",
    portafolio: "Portfolio",
    contacto: "Contact",
    servTitle: "Real Estate Visualization Solutions",
    servDesc: "We offer a comprehensive service of capturing and creating virtual tours optimized for your real estate listings.",
    serv1Title: "High Fidelity Capture",
    serv1Desc: "Professional panoramic photography with post-processing so that each room looks impeccable and bright.",
    serv2Title: "Fluid Navigation",
    serv2Desc: "We design a personalized and intuitive interface so that your clients navigate the property naturally.",
    serv3Title: "Commercial Focus",
    serv3Desc: "Tours designed specifically for brokers, including relevant information and direct contact points.",
    ctaTitle: "Interested in boosting your listings?",
    ctaDesc: "We offer personalized packages for agencies and individual brokers. Improve the engagement of your ads today.",
    ctaWa: "Chat on WhatsApp",
    ctaRates: "See Rates",
    ctaGuarantee: "Guaranteed Service",
    ctaQuality: "Professional Quality",
    footerCopy: "© 2026 Tour Weaver - 360° Visualization Services. All rights reserved.",
    footerTerms: "Terms of Use",
    footerPrivacy: "Privacy",
    viewTour: "View Virtual Tour"
  },
  pt: {
    heroBadge: "Serviço Profissional para Real Estate",
    heroTitle: "Mostre Propriedades com",
    heroTitleHighlight: "Tours 360°",
    heroTitleEnd: "de Alta Gama",
    heroDesc: "Ajudamos corretores e imobiliárias a destacar suas propiedades como um negocio innovador. Criamos experiências imersivas que permiten aos seus clientes visitar seu futuro lar de qualquer lugar do mundo.",
    btnPresupuesto: "Solicitar Orçamento",
    btnContratar: "Contratar Serviço",
    btnPortafolio: "Ver Portfólio",
    servicios: "Serviços",
    portafolio: "Portfólio",
    contacto: "Contato",
    servTitle: "Soluções de Visualización Imobiliária",
    servDesc: "Oferecemos um servicio integral de captura e criação de tours virtuais otimizados para as suas listagens de imóveis.",
    serv1Title: "Captura de Alta Fidelidade",
    serv1Desc: "Fotografia panorâmica profesional com pós-processamento para que cada ambiente pareça impecável e luminoso.",
    serv2Title: "Navegação Fluida",
    serv2Desc: "Desenhamos uma interface personalizada e intuitiva para que seus clientes naveguem pela propriedade de forma natural.",
    serv3Title: "Foco Comercial",
    serv3Desc: "Tours desenhados especificamente para corretores, incluyendo informações relevantes e pontos de contato diretos.",
    ctaTitle: "Interessado em impulsionar seus anúncios?",
    ctaDesc: "Oferecemos pacotes personalizados para agências e corretores individuales. Melhore o engajamento dos seus anúncios hoy mismo.",
    ctaWa: "Contato via WhatsApp",
    ctaRates: "Ver Tarifas",
    ctaGuarantee: "Serviço Garantizado",
    ctaQuality: "Qualidade Profissional",
    footerCopy: "© 2026 Tour Weaver - Servicios de Visualización 360°. Todos los derechos reservados.",
    footerTerms: "Termos de Uso",
    footerPrivacy: "Privacidade",
    viewTour: "Ver Tour Virtual"
  }
};

type Language = 'es' | 'en' | 'pt';

export default function Home() {
  const [lang, setLang] = useState<Language>('es');
  const firestore = useFirestore();

  const siteConfigRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'siteConfigurations', 'default');
  }, [firestore]);
  const { data: siteConfig } = useDoc(siteConfigRef);

  const portfolioQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'tours'),
      where('published', '==', true),
      where('showInPortfolio', '==', true)
    );
  }, [firestore]);
  const { data: portfolioTours, isLoading: isPortfolioLoading } = useCollection(portfolioQuery);

  useEffect(() => {
    const savedLang = localStorage.getItem('tour-weaver-lang') as Language;
    if (savedLang && translations[savedLang]) {
      setLang(savedLang);
    } else {
      const browserLang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] as Language : 'es';
      if (translations[browserLang]) {
        setLang(browserLang);
      }
    }
  }, []);

  const changeLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('tour-weaver-lang', newLang);
  };

  const t = translations[lang];

  const hasContactInfo = !!(siteConfig?.contactWhatsApp || siteConfig?.contactPhone || siteConfig?.contactEmail);

  const getWhatsAppLink = () => {
    if (!siteConfig?.contactWhatsApp) return null;
    const message = encodeURIComponent("Hola, me gustaría solicitar un presupuesto para un tour virtual 360°.");
    return `https://wa.me/${siteConfig.contactWhatsApp.replace(/\D/g, '')}?text=${message}`;
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Globe className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold font-headline tracking-tight text-primary">Tour Weaver</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#servicios" className="hover:text-primary transition-colors">{t.servicios}</Link>
            <Link href="#portafolio" className="hover:text-primary transition-colors">{t.portafolio}</Link>
            {hasContactInfo && <Link href="#contacto" className="hover:text-primary transition-colors">{t.contacto}</Link>}
          </nav>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Languages className="w-4 h-4" />
                  <span className="uppercase">{lang}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLang('es')}>Español</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang('en')}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLang('pt')}>Português</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {hasContactInfo && (
              <Link href={getWhatsAppLink() || '#contacto'} target={getWhatsAppLink() ? "_blank" : "_self"}>
                <Button size="sm" className="hidden sm:flex">{t.btnPresupuesto}</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="relative py-16 lg:py-32 overflow-hidden bg-gradient-to-b from-white to-background">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold mb-4 text-primary bg-primary/10 border border-primary/20">
                {t.heroBadge}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold font-headline leading-tight mb-6">
                {t.heroTitle} <span className="text-primary">{t.heroTitleHighlight}</span> {t.heroTitleEnd}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
                {t.heroDesc}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {hasContactInfo && (
                  <Link href="#contacto">
                    <Button size="lg" className="px-8 text-lg bg-accent hover:bg-accent/90 w-full sm:w-auto">{t.btnContratar}</Button>
                  </Link>
                )}
                <Link href="#portafolio">
                  <Button size="lg" variant="outline" className="px-8 text-lg border-primary text-primary hover:bg-primary/5 w-full sm:w-auto">{t.btnPortafolio}</Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full"></div>
          </div>
        </section>

        <section id="servicios" className="py-20 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-2xl md:text-3xl font-bold font-headline mb-4">{t.servTitle}</h2>
              <p className="text-sm md:text-base text-muted-foreground">{t.servDesc}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-none shadow-sm bg-background/50 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <Camera className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-3">{t.serv1Title}</h3>
                  <p className="text-sm text-muted-foreground">{t.serv1Desc}</p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-sm bg-background/50 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                    <Layout className="text-accent w-6 h-6" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-3">{t.serv2Title}</h3>
                  <p className="text-sm text-muted-foreground">{t.serv2Desc}</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-background/50 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <Building2 className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-3">{t.serv3Title}</h3>
                  <p className="text-sm text-muted-foreground">{t.serv3Desc}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="portafolio" className="py-20 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-2xl md:text-3xl font-bold font-headline mb-4">{t.portafolio}</h2>
              <p className="text-sm md:text-base text-muted-foreground">Explora algunos de nuestros últimos proyectos realizados para brokers exclusivos.</p>
            </div>

            {isPortfolioLoading ? (
              <div className="flex justify-center py-20">
                <LoaderIcon className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : portfolioTours && portfolioTours.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-8">
                {portfolioTours.map((tour: any) => (
                  <Card key={tour.id} className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.35rem)] max-w-sm overflow-hidden group hover:shadow-xl transition-all duration-300 border-none shadow-md rounded-2xl flex flex-col">
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      <img 
                        src={tour.thumbnailUrl || 'https://picsum.photos/seed/placeholder/600/400'} 
                        alt={tour.name} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        data-ai-hint="virtual tour"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl line-clamp-1">{tour.name}</CardTitle>
                    </CardHeader>
                    <CardFooter className="mt-auto pt-4 pb-6">
                      <Link href={`/tour/${tour.slug}`} className="w-full">
                        <Button className="w-full gap-2 rounded-xl h-11">
                          {t.viewTour} <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground italic border-2 border-dashed rounded-3xl">
                Próximamente más proyectos destacados.
              </div>
            )}
          </div>
        </section>

        {hasContactInfo && (
          <section id="contacto" className="py-20 md:py-24 bg-white">
            <div className="container mx-auto px-4">
              <div className="bg-primary rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 lg:p-20 text-white flex flex-col lg:flex-row items-center gap-12 overflow-hidden shadow-2xl">
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-2xl md:text-4xl font-bold mb-6">{t.ctaTitle}</h2>
                  <p className="text-lg md:text-xl text-white/80 mb-8">{t.ctaDesc}</p>
                  
                  <div className="flex flex-col gap-8">
                    {siteConfig?.contactWhatsApp && (
                      <Link href={getWhatsAppLink() || '#'} target="_blank">
                        <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto h-14 rounded-2xl gap-3 text-lg font-bold">
                          <MessageCircle className="w-6 h-6" /> {t.ctaWa}
                        </Button>
                      </Link>
                    )}

                    <div className="flex flex-col gap-4 text-left">
                      {siteConfig?.contactPhone && (
                        <div className="flex items-center gap-3 justify-center lg:justify-start">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-lg font-semibold">{siteConfig.contactPhone}</span>
                        </div>
                      )}
                      {siteConfig?.contactEmail && (
                        <div className="flex items-center gap-3 justify-center lg:justify-start">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-lg font-semibold">{siteConfig.contactEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-1 relative aspect-square w-full max-w-[260px] sm:max-w-sm bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                   <div className="text-center p-4">
                      <UserCheck className="w-12 h-12 md:w-20 md:h-20 mx-auto mb-4 text-white" />
                      <p className="text-xl md:text-2xl font-bold">{t.ctaGuarantee}</p>
                      <p className="text-xs md:text-base text-white/60">{t.ctaQuality}</p>
                   </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Globe className="text-white w-4 h-4" />
              </div>
              <span className="font-bold font-headline text-primary">Tour Weaver</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6">
              <Link href="#servicios" className="text-sm text-muted-foreground hover:text-primary">{t.servicios}</Link>
              <Link href="#portafolio" className="text-sm text-muted-foreground hover:text-primary">{t.portafolio}</Link>
              {hasContactInfo && <Link href="#contacto" className="text-sm text-muted-foreground hover:text-primary">{t.contacto}</Link>}
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">{t.footerTerms}</Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">{t.footerPrivacy}</Link>
            </nav>
          </div>
          <div className="border-t pt-8 text-center flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">{t.footerCopy}</p>
            <VersionIndicator />
          </div>
        </div>
      </footer>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("animate-spin", className)}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
