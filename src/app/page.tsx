"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Map, Zap, ShieldCheck, Globe, Building2, UserCheck, Layout, Languages, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VersionIndicator } from '@/components/VersionIndicator';

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
    ctaWa: "Contactar por WhatsApp",
    ctaRates: "Ver Tarifas",
    ctaGuarantee: "Servicio Garantizado",
    ctaQuality: "Calidad Profesional",
    footerCopy: "© 2026 Tour Weaver - Servicios de Visualización 360°. Todos los derechos reservados.",
    footerTerms: "Condiciones de Uso",
    footerPrivacy: "Privacidad"
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
    ctaWa: "Contact via WhatsApp",
    ctaRates: "See Rates",
    ctaGuarantee: "Guaranteed Service",
    ctaQuality: "Professional Quality",
    footerCopy: "© 2026 Tour Weaver - 360° Visualization Services. All rights reserved.",
    footerTerms: "Terms of Use",
    footerPrivacy: "Privacy"
  },
  pt: {
    heroBadge: "Serviço Profissional para Real Estate",
    heroTitle: "Mostre Propriedades com",
    heroTitleHighlight: "Tours 360°",
    heroTitleEnd: "de Alta Gama",
    heroDesc: "Ajudamos corretores e imobiliárias a destacar suas propiedades como um negocio innovador. Criamos experiências imersivas que permitem aos seus clientes visitar seu futuro lar de qualquer lugar do mundo.",
    btnPresupuesto: "Solicitar Orçamento",
    btnContratar: "Contratar Serviço",
    btnPortafolio: "Ver Portfólio",
    servicios: "Serviços",
    portafolio: "Portfólio",
    contacto: "Contato",
    servTitle: "Soluções de Visualização Imobiliária",
    servDesc: "Oferecemos um servicio integral de captura e criação de tours virtuais otimizados para as suas listagens de imóveis.",
    serv1Title: "Captura de Alta Fidelidade",
    serv1Desc: "Fotografia panorâmica profesional com pós-processamento para que cada ambiente pareça impecável e luminoso.",
    serv2Title: "Navegação Fluida",
    serv2Desc: "Desenhamos uma interface personalizada e intuitiva para que seus clientes naveguem pela propriedade de forma natural.",
    serv3Title: "Foco Comercial",
    serv3Desc: "Tours desenhados especificamente para corretores, incluindo informações relevantes e pontos de contato diretos.",
    ctaTitle: "Interessado em impulsionar seus anúncios?",
    ctaDesc: "Oferecemos pacotes personalizados para agências e corretores individuais. Melhore o engajamento dos seus anúncios hoje mesmo.",
    ctaWa: "Contato via WhatsApp",
    ctaRates: "Ver Tarifas",
    ctaGuarantee: "Serviço Garantizado",
    ctaQuality: "Qualidade Profissional",
    footerCopy: "© 2026 Tour Weaver - Serviços de Visualização 360°. Todos los derechos reservados.",
    footerTerms: "Termos de Uso",
    footerPrivacy: "Privacidade"
  }
};

type Language = 'es' | 'en' | 'pt';

export default function Home() {
  const [lang, setLang] = useState<Language>('es');

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

  return (
    <div className="min-h-screen flex flex-col">
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
            <Link href="#contacto" className="hover:text-primary transition-colors">{t.contacto}</Link>
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
            <Button className="hidden sm:flex">{t.btnPresupuesto}</Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-white to-background">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <Badge variant="secondary" className="mb-4 py-1 px-4 text-primary bg-primary/10 border-primary/20">
                {t.heroBadge}
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-bold font-headline leading-tight mb-6">
                {t.heroTitle} <span className="text-primary">{t.heroTitleHighlight}</span> {t.heroTitleEnd}
              </h1>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                {t.heroDesc}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="#contacto">
                  <Button size="lg" className="px-8 text-lg bg-accent hover:bg-accent/90">{t.btnContratar}</Button>
                </Link>
                <Link href="#portafolio">
                  <Button size="lg" variant="outline" className="px-8 text-lg border-primary text-primary hover:bg-primary/5">{t.btnPortafolio}</Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full"></div>
          </div>
        </section>

        <section id="servicios" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold font-headline mb-4">{t.servTitle}</h2>
              <p className="text-muted-foreground">{t.servDesc}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-none shadow-sm bg-background/50 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <Camera className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{t.serv1Title}</h3>
                  <p className="text-muted-foreground">{t.serv1Desc}</p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-sm bg-background/50 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                    <Layout className="text-accent w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{t.serv2Title}</h3>
                  <p className="text-muted-foreground">{t.serv2Desc}</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-background/50 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <Building2 className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{t.serv3Title}</h3>
                  <p className="text-muted-foreground">{t.serv3Desc}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="contacto" className="py-24">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-3xl p-12 lg:p-20 text-white flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-6">{t.ctaTitle}</h2>
                <p className="text-xl text-white/80 mb-8">{t.ctaDesc}</p>
                <div className="flex gap-4">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90">{t.ctaWa}</Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">{t.ctaRates}</Button>
                </div>
              </div>
              <div className="flex-1 relative aspect-square w-full max-w-sm bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                 <div className="text-center">
                    <UserCheck className="w-20 h-20 mx-auto mb-4 text-white" />
                    <p className="text-2xl font-bold">{t.ctaGuarantee}</p>
                    <p className="text-white/60">{t.ctaQuality}</p>
                 </div>
              </div>
            </div>
          </div>
        </section>
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
              <Link href="#contacto" className="text-sm text-muted-foreground hover:text-primary">{t.contacto}</Link>
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

function Badge({ children, variant, className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
