
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Hotspot } from '@/lib/types';
import { Button } from './ui/button';
import { ChevronRight, Loader2, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as THREE_REAL from 'three';

interface ThreeSixtyViewerProps {
  imageUrl: string;
  hotspots?: Hotspot[];
  onHotspotClick?: (targetSceneId: string, hotspotId: string) => void;
  onSceneClick?: (yaw: number, pitch: number) => void;
  isEditing?: boolean;
}

export const ThreeSixtyViewer: React.FC<ThreeSixtyViewerProps> = ({
  imageUrl,
  hotspots = [],
  onHotspotClick,
  onSceneClick,
  isEditing = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHolderRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE_REAL.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE_REAL.Scene | null>(null);
  const cameraRef = useRef<THREE_REAL.PerspectiveCamera | null>(null);
  const sphereRef = useRef<THREE_REAL.Mesh | null>(null);
  const requestRef = useRef<number | null>(null);
  const raycasterRef = useRef(new THREE_REAL.Raycaster());
  
  const [internalImageUrl, setInternalImageUrl] = useState(imageUrl);
  const [isLoadingTexture, setIsLoadingTexture] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  
  const lonRef = useRef(0);
  const latRef = useRef(0);
  const onPointerDownMouseX = useRef(0);
  const onPointerDownMouseY = useRef(0);
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const pointerDownTime = useRef(0);

  // Transition logic
  useEffect(() => {
    if (imageUrl !== internalImageUrl) {
      setIsFading(true);
      const timer = setTimeout(() => {
        setInternalImageUrl(imageUrl);
      }, 400); 
      return () => clearTimeout(timer);
    }
  }, [imageUrl, internalImageUrl]);

  useEffect(() => {
    if (!canvasHolderRef.current || !internalImageUrl) return;

    setIsLoadingTexture(true);

    const width = canvasHolderRef.current.clientWidth || 800;
    const height = canvasHolderRef.current.clientHeight || 600;

    if (rendererRef.current) {
      if (canvasHolderRef.current.contains(rendererRef.current.domElement)) {
        canvasHolderRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
    }

    const scene = new THREE_REAL.Scene();
    sceneRef.current = scene;

    const camera = new THREE_REAL.PerspectiveCamera(75, width / height, 1, 1100);
    cameraRef.current = camera;

    const geometry = new THREE_REAL.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const textureLoader = new THREE_REAL.TextureLoader();
    const texture = textureLoader.load(
      internalImageUrl,
      () => {
        setIsLoadingTexture(false);
        setTimeout(() => setIsFading(false), 50);
      },
      undefined,
      () => {
        setIsLoadingTexture(false);
        setIsFading(false);
      }
    );

    const material = new THREE_REAL.MeshBasicMaterial({ map: texture });
    const sphere = new THREE_REAL.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

    const renderer = new THREE_REAL.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    
    canvasHolderRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const handleResize = () => {
      if (!canvasHolderRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = canvasHolderRef.current.clientWidth;
      const h = canvasHolderRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    const update = () => {
      if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return;
      
      latRef.current = Math.max(-85, Math.min(85, latRef.current));
      
      const phi = THREE_REAL.MathUtils.degToRad(latRef.current);
      const theta = THREE_REAL.MathUtils.degToRad(lonRef.current);

      const target = new THREE_REAL.Vector3();
      target.x = Math.sin(theta) * Math.cos(phi);
      target.y = Math.sin(phi);
      target.z = -Math.cos(theta) * Math.cos(phi);
      target.multiplyScalar(500);
      
      cameraRef.current.lookAt(target);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    const animate = () => {
      update();
      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (rendererRef.current && canvasHolderRef.current) {
        if (canvasHolderRef.current.contains(rendererRef.current.domElement)) {
          canvasHolderRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
    };
  }, [internalImageUrl]);

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.isPrimary === false) return;
    setIsUserInteracting(true);
    onPointerDownMouseX.current = event.clientX;
    onPointerDownMouseY.current = event.clientY;
    pointerDownPos.current = { x: event.clientX, y: event.clientY };
    pointerDownTime.current = Date.now();
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (event.isPrimary === false || !isUserInteracting) return;
    lonRef.current = (onPointerDownMouseX.current - event.clientX) * 0.15 + lonRef.current;
    latRef.current = (event.clientY - onPointerDownMouseY.current) * 0.15 + latRef.current;
    onPointerDownMouseX.current = event.clientX;
    onPointerDownMouseY.current = event.clientY;
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (event.isPrimary === false) return;
    setIsUserInteracting(false);

    const moveX = Math.abs(event.clientX - pointerDownPos.current.x);
    const moveY = Math.abs(event.clientY - pointerDownPos.current.y);
    const moveDist = Math.sqrt(moveX * moveX + moveY * moveY);
    const duration = Date.now() - pointerDownTime.current;

    if (isEditing && onSceneClick && !isLoadingTexture && moveDist < 10 && duration < 300) {
      calculateClickCoordinates(event);
    }
  };

  const calculateClickCoordinates = (event: React.PointerEvent) => {
    if (!cameraRef.current || !sphereRef.current || !canvasHolderRef.current) return;

    const rect = canvasHolderRef.current.getBoundingClientRect();
    const mouse = new THREE_REAL.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(sphereRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point.clone();
      const correctedX = -point.x;
      const radius = 500;
      const lat = Math.asin(point.y / radius) * 180 / Math.PI;
      const lon = Math.atan2(correctedX, -point.z) * 180 / Math.PI;
      onSceneClick(lon, lat);
    }
  };

  const [visibleHotspots, setVisibleHotspots] = useState<{h: Hotspot, x: number, y: number}[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isLoadingTexture || !cameraRef.current || !canvasHolderRef.current) return;
      
      const projected = hotspots.map(h => {
        const phi = THREE_REAL.MathUtils.degToRad(h.pitch);
        const theta = THREE_REAL.MathUtils.degToRad(h.yaw);
        
        const vector = new THREE_REAL.Vector3();
        vector.x = -Math.sin(theta) * Math.cos(phi);
        vector.y = Math.sin(phi);
        vector.z = -Math.cos(theta) * Math.cos(phi);
        vector.multiplyScalar(500);
        
        const camDir = new THREE_REAL.Vector3();
        cameraRef.current!.getWorldDirection(camDir);
        const dot = camDir.dot(vector.clone().normalize());
        
        if (dot < 0) return null;
        
        vector.project(cameraRef.current!);
        const x = (vector.x * 0.5 + 0.5) * canvasHolderRef.current!.clientWidth;
        const y = (-(vector.y * 0.5) + 0.5) * canvasHolderRef.current!.clientHeight;
        return { h, x, y };
      }).filter(p => p !== null) as {h: Hotspot, x: number, y: number}[];
      
      setVisibleHotspots(projected);
    }, 16);
    return () => clearInterval(interval);
  }, [hotspots, isLoadingTexture]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full panoramic-viewer overflow-hidden bg-black rounded-xl touch-action-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ touchAction: 'none' }}
    >
      <div ref={canvasHolderRef} className="absolute inset-0" />

      {/* Transition overlay */}
      <div className={cn(
        "absolute inset-0 bg-black pointer-events-none z-40 transition-opacity duration-700 ease-in-out",
        (isFading || isLoadingTexture) ? "opacity-100" : "opacity-0"
      )} />

      {(isLoadingTexture && !isFading) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
           <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
           <p className="text-white text-sm font-medium animate-pulse">Sincronizando estancia...</p>
        </div>
      )}

      {!isFading && !isLoadingTexture && (
        <div className="absolute inset-0 pointer-events-none">
          {visibleHotspots.map(({h, x, y}) => (
            <div 
              key={h.id}
              className="absolute pointer-events-auto transition-transform hover:scale-110 active:scale-95 animate-in fade-in zoom-in duration-300"
              style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <Button
                variant="default"
                size="sm"
                className={cn(
                  "rounded-full border-2 shadow-lg px-4 py-2 flex items-center gap-2 group whitespace-nowrap transition-colors",
                  isEditing 
                    ? "bg-accent/90 border-accent-foreground/20 hover:bg-accent" 
                    : "bg-primary/90 border-white/20 hover:bg-primary"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onHotspotClick?.(h.targetSceneId, h.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
              >
                {isEditing && <Settings2 className="w-4 h-4 text-white" />}
                <span className={cn(
                  "overflow-hidden transition-all duration-300 font-medium",
                  isEditing ? "max-w-[200px]" : "max-w-0 group-hover:max-w-[200px]"
                )}>
                  {h.label}
                </span>
                {!isEditing && <ChevronRight className="w-5 h-5 text-white" />}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-30">
        <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] uppercase tracking-widest text-white/80 border border-white/10">
          {isEditing ? 'Tejiendo Enlaces' : 'Inmersión 360°'}
        </div>
      </div>
    </div>
  );
};
