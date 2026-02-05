
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  BarChart3, 
  Users, 
  MousePointer2, 
  Clock, 
  Globe, 
  ExternalLink, 
  ArrowUpRight,
  TrendingUp,
  Layout
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// Mock data for the dashboard (In a real app, this would come from GA Data API)
const mockData = [
  { name: 'Lun', visits: 120, tours: 45 },
  { name: 'Mar', visits: 150, tours: 52 },
  { name: 'Mie', visits: 200, tours: 80 },
  { name: 'Jue', visits: 180, tours: 65 },
  { name: 'Vie', visits: 250, tours: 110 },
  { name: 'Sab', visits: 320, tours: 140 },
  { name: 'Dom', visits: 280, tours: 125 },
];

const mockTours = [
  { name: 'Villa del Mar', views: 850, avgTime: '4m 12s', rate: 92 },
  { name: 'Penthouse Skyline', views: 640, avgTime: '3m 45s', rate: 78 },
  { name: 'Casa Loft Moderno', views: 420, avgTime: '5m 10s', rate: 85 },
  { name: 'Oficinas Central', views: 310, avgTime: '2m 30s', rate: 60 },
];

export default function AnalyticsDashboard() {
  const firestore = useFirestore();
  
  const siteConfigRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'siteConfigurations', 'default');
  }, [firestore]);

  const { data: siteConfig, isLoading } = useDoc(siteConfigRef);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    );
  }

  const gaId = siteConfig?.googleAnalyticsId;

  if (!gaId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-[2.5rem] border border-dashed border-muted-foreground/30">
        <BarChart3 className="w-16 h-16 text-muted-foreground/20 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Google Analytics no vinculado</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Configura tu ID de medición en los ajustes del sitio para comenzar a visualizar las estadísticas de tus tours.
        </p>
        <a href="/admin/settings">
          <Badge className="px-6 py-2 text-sm cursor-pointer hover:bg-primary/90">Ir a Configuración</Badge>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <BarChart3 className="text-primary w-8 h-8" /> Panel de Rendimiento
          </h1>
          <p className="text-muted-foreground">Estadísticas vinculadas a la propiedad: <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{gaId}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-200">
            Rastreo Activo
          </Badge>
          <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-bold flex items-center gap-1 hover:underline">
            Consola GA4 <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[2rem] border-none shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-primary w-5 h-5" />
              <Badge className="bg-green-500 text-[10px]">+12%</Badge>
            </div>
            <p className="text-3xl font-bold">1,452</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Visitas Totales</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <MousePointer2 className="text-accent w-5 h-5" />
              <Badge className="bg-green-500 text-[10px]">+5%</Badge>
            </div>
            <p className="text-3xl font-bold">524</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Clicks en Hotspots</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-blue-500 w-5 h-5" />
              <Badge variant="outline" className="text-[10px]">Promedio</Badge>
            </div>
            <p className="text-3xl font-bold">3:42</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tiempo en Tour</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-orange-500 w-5 h-5" />
              <Badge className="bg-green-500 text-[10px]">+22%</Badge>
            </div>
            <p className="text-3xl font-bold">84%</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tasa de Engagement</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-lg">Tráfico de los Últimos 7 Días</CardTitle>
            <CardDescription>Visualización de visitas únicas y aperturas de tours.</CardDescription>
          </CardHeader>
          <CardContent className="pt-10">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#29ABE2" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#29ABE2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#888'}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#888'}} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="visits" 
                    stroke="#29ABE2" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVisits)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tours" 
                    stroke="#F2994A" 
                    strokeWidth={3}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Tours más Vistos</CardTitle>
            <CardDescription>Rendimiento por propiedad individual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {mockTours.map((tour, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{tour.name}</p>
                  <p className="text-[10px] text-muted-foreground">{tour.views} vistas • {tour.avgTime} prom.</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-green-500">{tour.rate}%</div>
                  <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full" style={{ width: `${tour.rate}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 p-6 bg-accent/5 rounded-[2rem] border border-accent/10">
        <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center shrink-0">
          <Globe className="text-accent w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">Datos en tiempo real</p>
          <p className="text-xs text-muted-foreground">Google Analytics recolecta datos cada vez que un usuario interactúa con un tour. El panel de GA4 oficial ofrece análisis más profundos sobre la procedencia geográfica y dispositivos.</p>
        </div>
        <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">
          <Badge className="bg-accent hover:bg-accent/90 cursor-pointer">Abrir Consola GA4</Badge>
        </a>
      </div>
    </div>
  );
}
