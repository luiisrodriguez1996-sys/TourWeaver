"use client";

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { 
  BarChart3, 
  Users, 
  Clock,
  ArrowLeft,
  Calendar,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Phone,
  Mail,
  Zap,
  Info,
  ExternalLink,
  Share2,
  MapPin,
  MousePointer2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TourAnalytics() {
  const { id } = useParams();
  const firestore = useFirestore();
  
  const tourRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'tours', id as string);
  }, [firestore, id]);
  const { data: tour, isLoading: isTourLoading } = useDoc(tourRef);

  const visitsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'tourVisits'), where('tourId', '==', id));
  }, [firestore, id]);
  const { data: visits, isLoading: isVisitsLoading } = useCollection(visitsQuery);

  const stats = useMemo(() => {
    if (!visits) return null;

    const totalVisits = visits.length;
    const visitsWithDuration = visits.filter(v => v.duration && v.duration > 0);
    const avgDuration = visitsWithDuration.length > 0 
      ? Math.round(visitsWithDuration.reduce((acc, v) => acc + (v.duration || 0), 0) / visitsWithDuration.length)
      : 0;

    // Grupo 1: Conversión Directa (Contactos explicitos solicitados por el usuario)
    const directContactVisits = visits.filter(v => 
      v.contactMethods?.some((m: string) => ['whatsapp', 'phone', 'email'].includes(m))
    ).length;
    const contactRate = totalVisits > 0 ? Math.round((directContactVisits / totalVisits) * 100) : 0;

    // Grupo 2: Interés Secundario (Engagement e info general)
    const engagementVisits = visits.filter(v => 
      v.contactMethods?.some((m: string) => ['location', 'share', 'info_request'].includes(m))
    ).length;
    const engagementRate = totalVisits > 0 ? Math.round((engagementVisits / totalVisits) * 100) : 0;

    const formatDuration = (sec: number) => {
      if (!sec) return '---';
      if (sec < 60) return `${sec}s`;
      const mins = Math.floor(sec / 60);
      const remainingSecs = sec % 60;
      return `${mins}m ${remainingSecs}s`;
    };

    const sortedVisits = [...visits].sort((a, b) => b.timestamp - a.timestamp);

    return {
      totalVisits,
      avgDuration: formatDuration(avgDuration),
      directContactVisits,
      contactRate,
      engagementVisits,
      engagementRate,
      sortedVisits,
      formatDuration
    };
  }, [visits]);

  const getDeviceIcon = (ua: string) => {
    const userAgent = (ua || '').toLowerCase();
    if (userAgent.includes('tablet') || userAgent.includes('ipad') || userAgent.includes('playbook') || userAgent.includes('silk')) {
      return <Tablet className="w-4 h-4 text-muted-foreground" title="Tablet" />;
    }
    if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone') || userAgent.includes('phone')) {
      return <Smartphone className="w-4 h-4 text-muted-foreground" title="Móvil" />;
    }
    return <Monitor className="w-4 h-4 text-muted-foreground" title="Escritorio" />;
  };

  if (isTourLoading || isVisitsLoading) {
    return (
      <div className="space-y-8 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Propiedad no encontrada</h2>
        <Link href="/admin/analytics" className="mt-4">
          <Button variant="outline" className="rounded-xl">Volver a Estadísticas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/admin/analytics">
            <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold font-headline truncate">
              {tour.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px]">
                {tour.clientName || 'Sin Cliente'}
              </Badge>
              {tour.published ? (
                <Badge className="bg-green-500 gap-1 text-[10px]"><CheckCircle2 className="w-3 h-3" /> Publicado</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">Borrador</Badge>
              )}
              <Badge variant="ghost" className="text-[9px] text-muted-foreground gap-1">
                <Calendar className="w-2.5 h-2.5" /> Registrado: {tour.createdAt ? format(new Date(tour.createdAt), 'dd/MM/yy') : '---'}
              </Badge>
            </div>
          </div>
        </div>
        
        <Link href={`/tour/${tour.slug}`} target="_blank" className="w-full md:w-auto">
          <Button className="w-full md:w-auto rounded-xl gap-2 h-11">
            <ExternalLink className="w-4 h-4" /> Ver Tour Público
          </Button>
        </Link>
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-2">
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
                      <p className="text-xs">Número total de veces que se ha accedido a esta propiedad específica.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <p className="text-3xl font-bold">{stats?.totalVisits || 0}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Aperturas Totales</p>
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
                      <p className="text-xs">Promedio de tiempo que los visitantes pasan explorando las estancias de este tour.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <p className="text-3xl font-bold">{stats?.avgDuration}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Permanencia Media</p>
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
                      <p className="text-xs">Porcentaje de visitantes que utilizaron los métodos de contacto directo: WhatsApp, Llamada o Email.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold">{stats?.contactRate}%</p>
                <p className="text-[10px] text-muted-foreground font-bold">({stats?.directContactVisits})</p>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Conversión Directa</p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-md bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MousePointer2 className="text-blue-500 w-5 h-5" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] rounded-xl p-3">
                      <p className="text-xs">Porcentaje de visitantes que interactuaron con el tour: solicitar información general, ver ubicación o compartir.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold">{stats?.engagementRate}%</p>
                <p className="text-[10px] text-muted-foreground font-bold">({stats?.engagementVisits})</p>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Interés en Propiedad</p>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>

      <Card className="md:rounded-[2.5rem] rounded-3xl border-none shadow-xl overflow-hidden bg-white mx-2">
        <CardHeader className="bg-primary/5 p-6">
          <CardTitle className="text-lg">Historial de Visitas</CardTitle>
          <CardDescription className="text-xs">Registro individual de cada acceso y contacto detectado.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 md:pl-8 text-[11px] uppercase font-bold">Fecha / Hora</TableHead>
                  <TableHead className="text-center text-[11px] uppercase font-bold">Dispositivo</TableHead>
                  <TableHead className="text-center text-[11px] uppercase font-bold">Interacción</TableHead>
                  <TableHead className="text-right pr-6 md:pr-8 text-[11px] uppercase font-bold">Duración</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.sortedVisits && stats.sortedVisits.length > 0 ? stats.sortedVisits.map((visit) => (
                  <TableRow key={visit.id} className="group hover:bg-gray-50/50">
                    <TableCell className="pl-6 md:pl-8 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {format(new Date(visit.timestamp), "d MMM yyyy", { locale: es })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(visit.timestamp), "HH:mm")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center" title={visit.userAgent}>
                        {getDeviceIcon(visit.userAgent)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {visit.contacted ? (
                          <>
                            {visit.contactMethods?.includes('info_request') && (
                              <Zap className="w-4 h-4 text-primary" title="Solicitud Información" />
                            )}
                            {visit.contactMethods?.includes('whatsapp') && (
                              <MessageCircle className="w-4 h-4 text-green-500 fill-green-500" title="WhatsApp Directo" />
                            )}
                            {visit.contactMethods?.includes('phone') && <Phone className="w-4 h-4 text-primary" title="Llamada" />}
                            {visit.contactMethods?.includes('email') && <Mail className="w-4 h-4 text-accent" title="Email" />}
                            {visit.contactMethods?.includes('location') && <MapPin className="w-4 h-4 text-blue-500" title="Ver Ubicación" />}
                            {visit.contactMethods?.includes('share') && <Share2 className="w-4 h-4 text-orange-500" title="Compartido" />}
                          </>
                        ) : (
                          <span className="text-[9px] text-muted-foreground/30 italic">Sin clic</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 md:pr-8">
                      {visit.duration ? (
                        <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-[9px] px-2 py-0">
                          {stats.formatDuration(visit.duration)}
                        </Badge>
                      ) : (
                        <span className="text-[9px] text-muted-foreground italic">Breve</span>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic text-sm">
                      No hay visitas registradas aún.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
