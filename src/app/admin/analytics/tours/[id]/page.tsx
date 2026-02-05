
"use client";

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { 
  BarChart3, 
  Users, 
  MousePointer2, 
  Clock,
  ArrowLeft,
  Layout,
  ExternalLink,
  Calendar,
  Smartphone,
  CheckCircle2,
  AlertCircle
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

    const formatDuration = (sec: number) => {
      if (!sec) return '---';
      if (sec < 60) return `${sec}s`;
      const mins = Math.floor(sec / 60);
      const remainingSecs = sec % 60;
      return `${mins}m ${remainingSecs}s`;
    };

    // Ordenar visitas por fecha descendente para la tabla
    const sortedVisits = [...visits].sort((a, b) => b.timestamp - a.timestamp);

    return {
      totalVisits,
      avgDuration: formatDuration(avgDuration),
      sortedVisits,
      formatDuration
    };
  }, [visits]);

  if (isTourLoading || isVisitsLoading) {
    return (
      <div className="space-y-8 p-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Propiedad no encontrada</h2>
        <Link href="/admin/analytics" className="mt-4">
          <Button variant="outline" className="rounded-xl">Volver a Estadísticas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/analytics">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-headline truncate max-w-md">
              {tour.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {tour.clientName || 'Sin Cliente'}
              </Badge>
              {tour.published ? (
                <Badge className="bg-green-500 gap-1"><CheckCircle2 className="w-3 h-3" /> Publicado</Badge>
              ) : (
                <Badge variant="secondary">Borrador</Badge>
              )}
            </div>
          </div>
        </div>
        
        <Link href={`/tour/${tour.slug}`} target="_blank">
          <Button className="rounded-xl gap-2 h-11">
            <ExternalLink className="w-4 h-4" /> Ver Tour Público
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-none shadow-md bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-primary w-5 h-5" />
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
            <p className="text-3xl font-bold">{stats?.avgDuration}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Permanencia Media</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-md bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="text-blue-500 w-5 h-5" />
            </div>
            <p className="text-lg font-bold">
              {tour.createdAt ? format(new Date(tour.createdAt), 'dd/MM/yyyy') : '---'}
            </p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Fecha de Creación</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-lg">Historial de Visitas</CardTitle>
          <CardDescription>Registro individualizado de cada acceso detectado para esta propiedad.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8">Fecha y Hora</TableHead>
                  <TableHead>Dispositivo / Navegador</TableHead>
                  <TableHead className="text-right pr-8">Duración</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.sortedVisits && stats.sortedVisits.length > 0 ? stats.sortedVisits.map((visit) => (
                  <TableRow key={visit.id} className="group">
                    <TableCell className="pl-8 font-medium">
                      {format(new Date(visit.timestamp), "d MMM yyyy, HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground max-w-xs truncate" title={visit.userAgent}>
                        <Smartphone className="w-3 h-3 flex-shrink-0" />
                        {visit.userAgent}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      {visit.duration ? (
                        <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                          {stats.formatDuration(visit.duration)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Visita activa/breve</span>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground italic">
                      Aún no se han registrado visitas para esta propiedad.
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
