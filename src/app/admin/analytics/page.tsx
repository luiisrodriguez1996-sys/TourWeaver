
"use client";

import React, { useMemo } from 'react';
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
  Eye
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import Link from 'next/link';

export default function AnalyticsDashboard() {
  const firestore = useFirestore();
  
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

  const stats = useMemo(() => {
    if (!visits || !tours) return null;

    const totalVisits = visits.length;
    
    // Calcular duración media
    const visitsWithDuration = visits.filter(v => v.duration && v.duration > 0);
    const avgDuration = visitsWithDuration.length > 0 
      ? Math.round(visitsWithDuration.reduce((acc, v) => acc + (v.duration || 0), 0) / visitsWithDuration.length)
      : 0;

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
      topTours,
      chartData,
      totalTours: tours.length,
      publishedTours: tours.filter(t => t.published).length
    };
  }, [visits, tours]);

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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <BarChart3 className="text-primary w-8 h-8" /> Estadísticas Generales
          </h1>
          <p className="text-muted-foreground">Rendimiento global de tus propiedades y engagement de usuarios.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[2rem] border-none shadow-md bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-primary w-5 h-5" />
              <TrendingUp className="text-green-500 w-4 h-4" />
            </div>
            <p className="text-3xl font-bold">{stats?.totalVisits || 0}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Aperturas Totales</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-md bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-accent w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{stats?.avgDuration || '0s'}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Permanencia Media</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-md bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Globe className="text-blue-500 w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{stats?.publishedTours || 0}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tours Activos</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-md bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <MousePointer2 className="text-orange-500 w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{stats?.totalVisits ? Math.round((stats.totalVisits / (stats.totalTours || 1)) * 10) / 10 : 0}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Interacciones / Tour</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
          <CardHeader className="bg-primary/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Tráfico de los Últimos 7 Días</CardTitle>
              <CardDescription>Actividad reciente detectada en la plataforma.</CardDescription>
            </div>
            <Link href="/admin/analytics/traffic">
              <Button variant="outline" size="sm" className="rounded-xl gap-2 h-9">
                <History className="w-4 h-4" /> Historial Completo
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-10">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.chartData || []}>
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
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Propiedades Populares</CardTitle>
            <CardDescription>Ranking basado en visualizaciones totales.</CardDescription>
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
                <Link href={`/admin/analytics/tours/${tour.id}`}>
                  <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-10 italic">Aún no hay visitas registradas.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-[2.5rem] border p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" /> Todas las Propiedades
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tours?.map(tour => (
            <Link key={tour.id} href={`/admin/analytics/tours/${tour.id}`}>
              <Card className="hover:border-primary transition-all cursor-pointer group bg-gray-50/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{tour.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{tour.clientName || 'Sin Cliente'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold">{visits?.filter(v => v.tourId === tour.id).length || 0}</p>
                      <p className="text-[8px] text-muted-foreground uppercase">Visitas</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
