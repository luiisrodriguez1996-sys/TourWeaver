"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, limit, doc, arrayUnion } from 'firebase/firestore';
import { ThreeSixtyViewer } from '@/components/ThreeSixtyViewer';
import { Button } from '@/components/ui/button';
import { Globe, Map, ChevronUp, ChevronDown, Share2, Info, Loader2, Check, MapPin, ArrowLeft, Shield, Layers, ImageOff, StickyNote, X, Lock, MessageCircle, Phone, Mail, Copy, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { VersionIndicator } from '@/components/VersionIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QRCodeSVG } from 'qrcode.react';

export default function PublicTourViewer() {
  const { slug } = useParams();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [highlightContact, setHighlightContact] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const visitIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const contactedMethodsRef = useRef<Set<string>>(new Set());
  const qrRef = useRef<SVGSVGElement>(null);

  const adminRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminRef);
  const isAdmin = adminData?.isAdmin === true;

  const tourQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    const toursCol = collection(firestore, 'tours');
    
    if (isAdmin) {
      return query(toursCol, where('slug', '==', slug), limit(1));
    }
    
    return query(toursCol, 
      where('slug', '==', slug), 
      where('published', '==', true), 
      limit(1)
    );
  }, [firestore, slug, isAdmin]);

  const { data: tours, isLoading: isTourLoading, error: tourError } = useCollection(tourQuery);
  const tour = tours?.[0];

  useEffect(() => {
    // Bloquear scroll del body solo cuando este componente está montado
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      // Restaurar scroll al salir
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, []);

  // Seguimiento de Visita y Duración mejorado
  useEffect(() => {
    if (isUserLoading || isAdminLoading || !tour || !firestore || isAdmin) return;

    const startTime = Date.now();
    startTimeRef.current = startTime;

    // 1. Crear el registro de visita inicial
    const createVisitRecord = async () => {
      try {
        const visitsRef = collection(firestore, 'tourVisits');
        const docRef = await addDocumentNonBlocking(visitsRef, {
          tourId: tour.id,
          timestamp: startTime,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          contacted: false,
          contactMethods: [],
          duration: 0
        });
        
        if (docRef) {
          visitIdRef.current = docRef.id;
        }
      } catch (err) {
        console.error("Error creating visit record:", err);
      }
    };

    createVisitRecord();

    // 2. Función para actualizar la duración (Heartbeat)
    const updateDuration = () => {
      if (!visitIdRef.current || !firestore) return;
      
      const currentTime = Date.now();
      const durationSeconds = Math.floor((currentTime - startTime) / 1000);
      
      if (durationSeconds > 0) {
        const docRef = doc(firestore, 'tourVisits', visitIdRef.current);
        updateDocumentNonBlocking(docRef, { duration: durationSeconds });
      }
    };

    // Actualizar cada 15 segundos (Latido)
    const heartbeatInterval = setInterval(updateDuration, 15000);

    // Eventos de cierre o cambio de pestaña (Móvil y Escritorio)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateDuration();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', updateDuration);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', updateDuration);
      updateDuration(); // Intento de actualización final al desmontar
    };
  }, [tour?.id, firestore, isAdmin, isAdminLoading, isUserLoading]);

  useEffect(() => {
    if (showOnboarding) {
      const timer = setTimeout(() => {
        setShowOnboarding(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding]);

  const trackConversion = (method: 'whatsapp' | 'phone' | 'email' | 'info_request' | 'location' | 'share') => {
    if (visitIdRef.current && firestore && !isAdmin) {
      const docRef = doc(firestore, 'tourVisits', visitIdRef.current);
      
      if (!contactedMethodsRef.current.has(method)) {
        contactedMethodsRef.current.add(method);
        updateDocumentNonBlocking(docRef, { 
          contacted: true,
          contactMethods: arrayUnion(method)
        });
      }
    }
  };

  const handleCopy = (text: string, label: string, method: 'phone' | 'email') => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(text);
      toast({ title: `${label} copiado al portapapeles` });
      trackConversion(method);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Enlace copiado al portapapeles" });
      trackConversion('share');
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      ctx?.drawImage(img, 0, 0, 1000, 1000);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${tour?.slug || 'tour'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
    trackConversion('share');
  };

  const scenesRef = useMemoFirebase(() => {
    if (!firestore || !tour) return null;
    return collection(firestore, 'tours', tour.id, 'scenes');
  }, [firestore, tour]);

  const { data: serverScenes, isLoading: isScenesLoading, error: scenesError } = useCollection(scenesRef);

  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [orderedScenes, setOrderedScenes] = useState<any[]>([]);

  useEffect(() => {
    if (serverScenes && tour) {
      let sorted = [...serverScenes];
      if (tour.sceneIds && tour.sceneIds.length > 0) {
        sorted.sort((a, b) => {
          const indexA = tour.sceneIds!.indexOf(a.id);
          const indexB = tour.sceneIds!.indexOf(b.id);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      }
      setOrderedScenes(sorted);
      if (sorted.length > 0 && !activeSceneId) {
        setActiveSceneId(sorted[0].id);
      }
    }
  }, [serverScenes, tour]);

  const activeScene = orderedScenes?.find((s: any) => s.id === activeSceneId);
  const activeAnnotation = activeScene?.annotations?.find((a: any) => a.id === selectedAnnotationId);

  useEffect(() => {
    if (activeScene?.floorId) {
      setActiveFloorId(activeScene.floorId);
    }
  }, [activeSceneId]);

  const getMapsUrl = () => {
    if (tour?.googleMapsUrl) return tour.googleMapsUrl;
    if (tour?.address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tour.address)}`;
    return null;
  };

  const getWhatsAppLink = () => {
    if (!tour?.contactWhatsApp) return null;
    const message = encodeURIComponent(`Hola, estoy viendo el tour virtual de "${tour.name}" y me gustaría recibir más información.`);
    return `https://wa.me/${tour.contactWhatsApp.replace(/\D/g, '')}?text=${message}`;
  };

  const closeAllPanels = () => {
    setIsDetailsExpanded(false);
    setSelectedAnnotationId(null);
    setShowFloorPlan(false);
    if (showOnboarding) setShowOnboarding(false);
  };

  const canView = tour ? (tour.published || isAdmin) : false;

  if (isTourLoading || (tours === null && !tourError) || (tour && isScenesLoading && !scenesError)) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white gap-4 z-[999]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium animate-pulse">Cargando experiencia inmersiva...</p>
      </div>
    );
  }

  if (!tour || !canView || scenesError || tourError) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white p-6 z-[999]">
        <div className="text-center p-12 bg-white/5 backdrop-blur-lg rounded-[2.5rem] border border-white/10 max-w-md shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-destructive w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold font-headline mb-2">Tour no disponible</h2>
          <p className="text-white/60 text-sm mb-8 text-balance">
            Esta propiedad ha sido marcada como privada o ya no está disponible públicamente.
          </p>
          <Link href="/">
            <Button size="lg" className="w-full gap-2 rounded-2xl h-14 text-lg">
              <ArrowLeft className="w-5 h-5" /> Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasContactInfo = !!(tour.contactWhatsApp || tour.contactPhone || tour.contactEmail);
  const hasDetailsContent = !!(tour.address || tour.description || activeScene?.description || activeScene?.floorId || hasContactInfo);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black flex flex-col touch-none select-none z-[100]">
      {/* Header controls */}
      <div className="absolute top-0 left-0 right-0 p-2 md:p-4 z-20 pointer-events-none flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="pointer-events-auto w-full md:w-[40%]">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 text-white w-full shadow-2xl overflow-hidden">
            <div 
              className={cn(
                "p-2 md:p-3 flex items-center justify-between transition-colors", 
                hasDetailsContent ? "cursor-pointer hover:bg-white/5" : "cursor-default"
              )} 
              onClick={() => hasDetailsContent && setIsDetailsExpanded(!isDetailsExpanded)}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-sm md:text-lg font-bold font-headline truncate">{tour.name}</h1>
                  {!tour.published && isAdmin && <div className="flex-shrink-0 flex items-center gap-1 bg-accent/20 text-accent px-1.5 py-0.5 rounded text-[8px] font-bold border border-accent/20"><Shield className="w-2.5 h-2.5" /> ADMIN</div>}
                </div>
                <p className="text-[9px] md:text-[10px] text-white/80 flex items-center gap-1"><Info className="w-2.5 h-2.5" /> {activeScene?.name || 'Cargando...'}</p>
              </div>
              {hasDetailsContent && (isDetailsExpanded ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />)}
            </div>
            
            <div className={cn("overflow-hidden transition-all duration-300 ease-in-out px-2 md:px-3", isDetailsExpanded && hasDetailsContent ? "max-h-[600px] pb-3 opacity-100" : "max-h-0 opacity-0")}>
              <div className="space-y-2 pt-1">
                
                {(tour.description || tour.address) && (
                  <div className="bg-white/10 rounded-xl overflow-hidden border border-white/5">
                    <div className="flex items-center justify-between bg-primary text-white px-2 py-1">
                      <p className="text-[8px] md:text-[9px] font-medium uppercase tracking-wider">Descripción de la propiedad</p>
                    </div>
                    
                    <div className="p-1.5 md:p-2 space-y-1.5">
                      {tour.address && (
                        <a 
                          href={getMapsUrl() || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="group flex items-start gap-2 text-[10px] md:text-xs text-white hover:text-primary transition-colors"
                          onClick={() => trackConversion('location')}
                        >
                          <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 mt-0.5 text-primary" />
                          <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-primary">{tour.address}</span>
                        </a>
                      )}
                      {tour.description && (
                        <p className="text-[10px] md:text-sm text-white/70 font-medium leading-relaxed">{tour.description}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {(activeScene?.description || activeScene?.floorId) && (
                  <div className="bg-white/20 rounded-xl overflow-hidden border border-white/10">
                    <div className="flex items-center justify-between bg-accent text-white px-2 py-1">
                      <p className="text-[8px] md:text-[9px] font-medium uppercase tracking-wider">Sobre esta estancia</p>
                      {activeScene?.floorId && tour?.floors?.find((f: any) => f.id === activeScene.floorId) && (
                        <span className="text-[8px] md:text-[9px] font-medium text-white flex items-center gap-1 uppercase">
                          <Layers className="w-2.5 h-2.5" /> {tour.floors.find((f: any) => f.id === activeScene.floorId).name}
                        </span>
                      )}
                    </div>
                    {activeScene?.description && (
                      <div className="p-1.5 md:p-2">
                        <p className="text-[10px] md:text-sm text-white/80 font-medium leading-relaxed">{activeScene.description}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {hasContactInfo && (
                  <div className={cn(
                    "space-y-1.5 pt-2 border-t border-white/10 transition-all duration-500",
                    highlightContact && "bg-primary/20 scale-[1.02] rounded-xl p-2 ring-2 ring-primary shadow-lg"
                  )}>
                    <p className="text-[8px] md:text-[9px] font-black text-white/60 uppercase tracking-wider">Contacto Directo</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {tour.contactWhatsApp && (
                        <a href={getWhatsAppLink() || '#'} target="_blank" rel="noopener noreferrer" onClick={() => trackConversion('whatsapp')}>
                          <Button size="sm" className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white text-[9px] md:text-xs h-7 md:h-8 rounded-xl gap-2 font-bold">
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </Button>
                        </a>
                      )}
                      <div className="flex gap-1.5">
                        {tour.contactPhone && (
                          <>
                            <a href={`tel:${tour.contactPhone}`} className="flex-1 md:hidden" onClick={() => trackConversion('phone')}>
                              <Button size="sm" variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white text-[9px] h-7 rounded-xl gap-2">
                                <Phone className="w-3.5 h-3.5" /> Llamar
                              </Button>
                            </a>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="hidden md:flex flex-1 bg-white/10 hover:bg-white/20 text-white text-[10px] h-8 rounded-xl gap-2 truncate"
                              onClick={() => handleCopy(tour.contactPhone!, "Teléfono", "phone")}
                            >
                              <Phone className="w-3.5 h-3.5 shrink-0" /> {tour.contactPhone}
                            </Button>
                          </>
                        )}
                        {tour.contactEmail && (
                          <>
                            <a href={`mailto:${tour.contactEmail}`} className="flex-1 md:hidden" onClick={() => trackConversion('email')}>
                              <Button size="sm" variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white text-[9px] h-7 rounded-xl gap-2">
                                <Mail className="w-3.5 h-3.5" /> Email
                              </Button>
                            </a>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="hidden md:flex flex-1 bg-white/10 hover:bg-white/20 text-white text-[10px] h-8 rounded-xl gap-2 truncate"
                              onClick={() => handleCopy(tour.contactEmail!, "Email", "email")}
                            >
                              <Mail className="w-3.5 h-3.5 shrink-0" /> {tour.contactEmail}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 pointer-events-auto w-full md:w-auto justify-end items-center">
          {tour.contactWhatsApp && (
            <Button 
              variant="secondary" 
              className="rounded-full bg-[#25D366] text-white hover:bg-[#20ba59] h-9 px-4 md:h-10 md:px-6 border-none shadow-xl gap-2 transition-all active:scale-95"
              onClick={() => {
                trackConversion('info_request');
                if (hasDetailsContent) {
                  setIsDetailsExpanded(true);
                  setHighlightContact(true);
                  setTimeout(() => setHighlightContact(false), 2000);
                } else {
                  window.open(getWhatsAppLink() || '#', '_blank');
                }
              }}
            >
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-black text-[9px] md:text-xs tracking-tight uppercase whitespace-nowrap">SOLICITAR INFORMACIÓN</span>
            </Button>
          )}

          {getMapsUrl() && (
            <a href={getMapsUrl()!} target="_blank" rel="noopener noreferrer" onClick={() => trackConversion('location')}>
              <Button variant="secondary" size="icon" className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 h-9 w-9 md:h-10 md:w-10">
                <MapPin className="w-4 h-4" />
              </Button>
            </a>
          )}

          <Dialog open={isShareOpen} onOpenChange={(open) => { setIsShareOpen(open); if(open) trackConversion('share'); }}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 h-9 w-9 md:h-10 md:w-10">
                <Share2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] bg-white text-foreground sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" /> Compartir Tour
                </DialogTitle>
                <DialogDescription>
                  Opciones para compartir el tour mediante enlace directo o código QR descargable.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Enlace Directo</p>
                  <div className="flex items-center gap-2">
                    <Input 
                      readOnly 
                      value={typeof window !== 'undefined' ? window.location.href : ''} 
                      className="rounded-xl bg-muted/50 border-none" 
                    />
                    <Button size="icon" onClick={handleCopyLink} className="rounded-xl shrink-0">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Código QR para Impresión</p>
                  <div className="flex flex-col items-center gap-4 bg-muted/30 p-6 rounded-3xl">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border">
                      <QRCodeSVG 
                        ref={qrRef}
                        value={typeof window !== 'undefined' ? window.location.href : ''} 
                        size={180}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <Button variant="outline" className="rounded-xl gap-2 w-full" onClick={downloadQR}>
                      <Download className="w-4 h-4" /> Descargar QR (PNG)
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-grow w-full h-full relative" onClick={closeAllPanels}>
        {activeScene && (
          <ThreeSixtyViewer 
            imageUrl={activeScene.imageUrl} 
            hotspots={activeScene.hotspots || []} 
            annotations={activeScene.annotations || []}
            onInteractionStart={closeAllPanels}
            onHotspotClick={(targetId) => {
              setActiveSceneId(targetId);
              closeAllPanels();
            }} 
            onAnnotationClick={(annotationId) => {
              setSelectedAnnotationId(annotationId);
              setIsDetailsExpanded(false);
              setShowFloorPlan(false);
            }}
          />
        )}

        {/* Guía de Interacción Inicial */}
        {showOnboarding && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none animate-in fade-in duration-700">
            <div className="bg-black/40 backdrop-blur-md rounded-[2rem] p-6 flex flex-col items-center gap-4 border border-white/10 shadow-2xl scale-75 md:scale-100">
              <div className="flex items-center gap-6">
                <ChevronLeft className="w-8 h-8 text-white/40 animate-pulse" />
                <div className="text-4xl animate-swipe select-none">👆</div>
                <ChevronRight className="w-8 h-8 text-white/40 animate-pulse" />
              </div>
              <p className="text-white text-base font-medium text-center max-w-[180px] leading-tight">
                Interactúa para explorar el espacio
              </p>
            </div>
          </div>
        )}

        {activeAnnotation && (
          <div 
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-[2px] cursor-pointer"
            onClick={() => setSelectedAnnotationId(null)}
          >
            <Card 
              className="w-full max-w-sm cursor-auto animate-in zoom-in-95 duration-300 rounded-[2rem] border-white/10 bg-black/60 text-white backdrop-blur-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/10">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-blue-400" />
                  {activeAnnotation.title}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10 text-white" onClick={() => setSelectedAnnotationId(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                  {activeAnnotation.content}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 w-full px-4 justify-center pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md px-2 md:px-6 py-1 rounded-full border border-white/10 flex items-center gap-1 md:gap-2 text-white shadow-2xl pointer-events-auto max-w-full overflow-x-auto scrollbar-hide touch-pan-x">
           <Dialog>
             <DialogTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10 hover:text-white rounded-full h-9 px-3 md:px-4 flex-shrink-0">
                  <ChevronUp className="w-4 h-4" />
                  <span className="text-[10px] md:text-sm font-medium whitespace-nowrap">Estancias ({orderedScenes?.length || 0})</span>
                </Button>
             </DialogTrigger>
             <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[425px] bg-black/80 backdrop-blur-xl border-white/10 text-white p-0 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 border-b border-white/10 text-left">
                  <DialogTitle className="font-bold text-lg">Explorar Estancias</DialogTitle>
                  <DialogDescription>
                    Lista de todas las habitaciones y estancias disponibles
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] p-4">
                  <div className="grid grid-cols-1 gap-2">
                    {orderedScenes?.map((scene: any) => {
                      const floor = tour.floors?.find((f: any) => f.id === scene.floorId);
                      return (
                        <DialogClose asChild key={scene.id}>
                          <button onClick={() => { setActiveSceneId(scene.id); closeAllPanels(); }} className={cn("w-full flex items-center gap-4 p-3 rounded-2xl transition-all group border", activeSceneId === scene.id ? 'bg-primary/20 text-primary border-primary/40' : 'hover:bg-white/10 text-white/70 hover:text-white border-transparent')}>
                            <div className="relative w-20 md:w-24 h-14 md:h-16 rounded-xl overflow-hidden flex-shrink-0">
                              <img src={scene.imageUrl} className="w-full h-full object-cover" alt={scene.name} />
                              {activeSceneId === scene.id && <div className="absolute inset-0 bg-primary/40 flex items-center justify-center"><Check className="w-6 h-6 text-white" /></div>}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0 text-left">
                              <span className="text-xs md:text-sm font-semibold truncate">{scene.name}</span>
                              {floor && (
                                <span className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                                  <Layers className="w-2.5 h-2.5" /> {floor.name}
                                </span>
                              )}
                            </div>
                          </button>
                        </DialogClose>
                      );
                    })}
                  </div>
                </ScrollArea>
             </DialogContent>
           </Dialog>

           {(tour.showFloorPlan && tour.floors?.length > 0) && (
             <>
               <div className="h-4 w-px bg-white/20 mx-1 md:mx-2 flex-shrink-0" />
               <Button variant="ghost" onClick={() => { setShowFloorPlan(!showFloorPlan); setIsDetailsExpanded(false); setSelectedAnnotationId(null); }} className={cn("flex items-center gap-2 text-white hover:bg-white/10 hover:text-white rounded-full h-9 px-3 md:px-4 flex-shrink-0", showFloorPlan && 'text-primary bg-primary/10')}><Map className="w-4 h-4" /><span className="text-[10px] md:text-sm font-medium whitespace-nowrap">Plano</span></Button>
             </>
           )}
        </div>
      </div>

      {(showFloorPlan && tour.showFloorPlan && tour.floors?.length > 0) && (
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300 cursor-pointer"
          onClick={() => setShowFloorPlan(false)}
        >
           <div 
            className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-[calc(100vw-2rem)] md:max-w-3xl w-full relative shadow-2xl flex flex-col gap-4 md:gap-6 cursor-auto"
            onClick={(e) => e.stopPropagation()}
           >
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold font-headline text-primary flex items-center gap-2"><Map className="w-5 h-5 md:w-6 md:h-6" /> Mapa de Navegación</h2>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted" onClick={() => setShowFloorPlan(false)}><X className="w-5 h-5" /></Button>
              </div>

              {tour.floors.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide touch-pan-x">
                  {tour.floors.map((floor: any) => (
                    <Button 
                      key={floor.id} 
                      variant={activeFloorId === floor.id ? "default" : "outline"} 
                      size="sm" 
                      className="rounded-full h-8 px-4 text-[10px] whitespace-nowrap transition-all" 
                      onClick={() => setActiveFloorId(floor.id)}
                    >
                      <Layers className={cn("w-3 h-3 mr-2", activeFloorId === floor.id ? "text-white" : "text-primary")} /> {floor.name}
                    </Button>
                  ))}
                </div>
              )}

              <div className="aspect-video bg-muted rounded-2xl md:rounded-3xl overflow-hidden relative border shadow-inner">
                 {tour.floors.find((f: any) => f.id === activeFloorId)?.imageUrl ? (
                   <>
                     <img src={tour.floors.find((f: any) => f.id === activeFloorId).imageUrl} alt="Plano" className="w-full h-full object-contain" />
                     {orderedScenes?.filter((s: any) => s.floorId === activeFloorId).map((s: any) => s.floorPlanX !== undefined && (
                       <button key={s.id} onClick={() => { setActiveSceneId(s.id); closeAllPanels(); }} className={cn("absolute w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white shadow-xl -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-150 flex items-center justify-center", s.id === activeSceneId ? 'bg-primary z-20 ring-4 ring-primary/30 scale-125' : 'bg-muted-foreground/80 z-10 hover:bg-primary')} style={{ left: `${s.floorPlanX}%`, top: `${s.floorPlanY}%` }} title={s.name}><MapPin className={cn("w-3 h-3 md:w-3.5 md:h-3.5 text-white", s.id === activeSceneId ? 'block' : 'hidden')} /></button>
                     ))}
                   </>
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                     <ImageOff className="w-10 h-10 opacity-20" />
                     <p className="text-xs md:text-sm font-medium">Esta planta no tiene mapa</p>
                   </div>
                 )}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground text-center font-medium">Selecciona un nivel y toca los puntos para navegar.</p>
           </div>
        </div>
      )}

      <div className="absolute bottom-1 right-4 md:right-8 z-20 pointer-events-none flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-3">
        <VersionIndicator />
        <Link href="/" className="pointer-events-auto">
          <span 
            className="text-neutral-700 text-[8px] md:text-[10px] font-bold tracking-widest uppercase hover:text-primary transition-colors underline decoration-neutral-700/30"
          >
            Potenciado por Tour Weaver
          </span>
        </Link>
      </div>

      <div className="absolute bottom-1.5 left-4 md:left-8 z-20 pointer-events-none">
        <span 
          className="text-neutral-700 text-[8px] md:text-[10px] font-bold tracking-widest uppercase"
        >
          Inmersión 360°
        </span>
      </div>
    </div>
  );
}
