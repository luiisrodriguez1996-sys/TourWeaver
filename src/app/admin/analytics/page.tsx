
"use client";

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { 
  BarChart3, 
  Users, 
  MousePointer2, 
  Globe, 
  TrendingUp,
  Clock,
  ArrowRight,
  History,
  Loader2,
  Info,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer
} from 'recharts';
import { useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

export default function AnalyticsDashboard() {
  const firestore = useFirestore();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const toursRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tours');
  }, [firestore]);
  const { data: tours, isLoading: isToursLoading } = useCollection(toursRef);

  const visitsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tourVisits');
  }, [firestore]);
  const { data: visits, isLoading: isVisitsLoading } = useCollection(visitsRef);

  const handleNavigate = (path: string, id: string) => {
    setIsNavigating(id);
    router.push(path);
  };

  const stats = useMemo(() => {
    if (!visits || !tours) return null;

    const totalVisits = visits.length;
    
    // Calcular duración media
    const visitsWithDuration = visits.filter(v => v.duration && v.duration > 0);
    const avgDuration = visitsWithDuration.length > 0 
      ? Math.round(visitsWithDuration.reduce((acc, v) => acc + (v.duration || 0), 0) / visitsWithDuration.length)
      : 0;

    // Calcular tasa de conversión global
    const contactedVisits = visits.filter(v => v.contacted === true).length;
    const conversionRate = totalVisits > 0 ? Math.round((contactedVisits / totalVisits) * 100) : 0;

    const formatDuration = (sec: number) => {
      if (sec < 60) return `${sec}s`;
      const mins = Math.floor(sec / 60);
      const remainingSecs = sec % 60;
      return `${mins}m ${remainingSecs}s`;
    };

    const visitsByTour: Record<string, number> = {};
    visits.forEach(v => {
      visitsByTour[v.tourId] = (visitsByTour[v.tourId] || 0) + 1;
    });

    const topTours = tours
      .map(t => ({
        id: t.id,
        name: t.name,
        views: visitsByTour[t.id] || 0,
        rate: visitsByTour[t.id] ? Math.min(100, Math.round((visitsByTour[t.id] / totalVisits) * 100)) : 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dateStr: d.toLocaleDateString('es-ES', { weekday: 'short' }),
        fullDate: d.toDateString(),
        count: 0
      };
    });

    visits.forEach(v => {
      const vDate = new Date(v.timestamp).toDateString();
      const dayIndex = last7Days.findIndex(d => d.fullDate === vDate);
      if (dayIndex !== -1) {
        last7Days[dayIndex].count++;
      }
    });

    const chartData = last7Days.map(d => ({
      name: d.dateStr,
      visits: d.count
    }));

    return {
      totalVisits,
      avgDuration: formatDuration(avgDuration),
      conversionRate,
      contactedVisits,
      topTours,
      chartData,
      totalTours: tours.length,
      publishedTours: tours.filter(t => t.published).length,
      visitsByTour
    };
  }, [visits, tours]);

  const paginatedTours = useMemo(() => {
    if (!tours) return [];
    const sortedTours = [...tours].sort((a, b) => {
      const visitsA = stats?.visitsByTour[a.id] || 0;
      const visitsB = stats?.visitsByTour[b.id] || 0;
      return visitsB - visitsA;
    });
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTours.slice(start, start + itemsPerPage);
  }, [tours, currentPage, stats]);

  const totalPages = Math.ceil((tours?.length || 0) / itemsPerPage);

  const isLoading = isToursLoading || isVisitsLoading;

  if (isLoading) {
    return (
      <div className="space-y-8 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <BarChart3 className="text-primary w-8 h-8" /> Estadísticas Generales
          </h1>
          <p className="text-muted-foreground">Rendimiento global de tus propiedades y engagement de usuarios.</p>
        </div>
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="rounded-[2rem] border-none shadow-md bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="text-primary w-5 h-5" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] rounded-xl p-3">
                      <p className="text-xs">Suma total de veces que tus tours han sido abiertos por visitantes únicos o recurrentes.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <TrendingUp className="text-green-500 w-4 h-4" />
              </div>
              <p className="text-3xl font-bold">{stats?.totalVisits || 0}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Aperturas Totales</p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-md bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="text-accent w-5 h-5" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] rounded-xl p-3">
                      <p className="text-xs">Tiempo promedio que un usuario permanece interactuando con el tour 360°.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <p className="text-3xl font-bold">{stats?.avgDuration || '0s'}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Permanencia Media</p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-md bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="text-yellow-500 w-5 h-5" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] rounded-xl p-3">
                      <p className="text-xs">Porcentaje de visitas que pulsaron al menos un botón de contacto (WhatsApp, Teléfono o Email).</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold">{stats?.conversionRate || 0}%</p>
                <p className="text-xs text-muted-foreground font-bold">({stats?.contactedVisits})</p>
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tasa de Conversión</p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-md bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="text-blue-500 w-5 h-5" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] rounded-xl p-3">
                      <p className="text-xs">Propiedades que están actualmente en estado "Publicado" y son accesibles por el público.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <p className="text-3xl font-bold">{stats?.publishedTours || 0}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tours Activos</p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-md bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MousePointer2 className="text-orange-500 w-5 h-5" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] rounded-xl p-3">
                      <p className="text-xs">Promedio de visitas recibidas por cada propiedad registrada en la plataforma.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <p className="text-3xl font-bold">{stats?.totalVisits ? Math.round((stats.totalVisits / (stats.totalTours || 1)) * 10) / 10 : 0}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Interacciones / Tour</p>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
          <CardHeader className="bg-primary/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Tráfico de los Últimos 7 Días</CardTitle>
              <CardDescription>Actividad reciente detectada en la plataforma.</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl gap-2 h-9"
              onClick={() => handleNavigate('/admin/analytics/traffic', 'traffic-history')}
              disabled={isNavigating === 'traffic-history'}
            >
              {isNavigating === 'traffic-history' ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
              Historial Completo
            </Button>
          </CardHeader>
          <CardContent className="pt-10">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.chartData || []}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" x1="0" x2="0" y2="1">
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
                  <ChartTooltip 
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
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Top 5 Populares</CardTitle>
            <CardDescription>Propiedades con más aperturas totales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {stats?.topTours && stats.topTours.length > 0 ? stats.topTours.map((tour, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{tour.name}</p>
                  <p className="text-[10px] text-muted-foreground">{tour.views} aperturas totales</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleNavigate(`/admin/analytics/tours/${tour.id}`, `popular-${tour.id}`)}
                  disabled={isNavigating === `popular-${tour.id}`}
                >
                  {isNavigating === `popular-${tour.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-10 italic">Aún no hay visitas registradas.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-[2.5rem] border p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" /> Todas las Propiedades
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-lg"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-medium text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-lg"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {paginatedTours.map(tour => (
            <Card 
              key={tour.id} 
              className="hover:border-primary transition-all cursor-pointer group bg-gray-50/50 border-transparent border-2"
              onClick={() => handleNavigate(`/admin/analytics/tours/${tour.id}`, `list-${tour.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{tour.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">{tour.clientName || 'Sin Cliente'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 md:gap-12">
                  <div className="text-right">
                    <p className="text-sm font-bold">{stats?.visitsByTour[tour.id] || 0}</p>
                    <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Visitas</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold">{visits?.filter(v => v.tourId === tour.id && v.contacted).length || 0}</p>
                    <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Interacciones</p>
                  </div>
                  <div className="w-8 flex justify-center">
                    {isNavigating === `list-${tour.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!tours || tours.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-10 italic">No hay propiedades registradas para mostrar.</p>
          )}
        </div>
      </div>
    </div>
  );
}
