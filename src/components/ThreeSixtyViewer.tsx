
"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Hotspot } from '@/lib/types';
import { Button } from './ui/button';
import { ChevronRight, Maximize, Loader2 } from 'lucide-react';

interface ThreeSixtyViewerProps {
  imageUrl: string;
  hotspots?: Hotspot[];
  onHotspotClick?: (targetSceneId: string) => void;
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
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const requestRef = useRef<number | null>(null);
  
  const [isLoadingTexture, setIsLoadingTexture] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [onPointerDownMouseX, setOnPointerDownMouseX] = useState(0);
  const [onPointerDownMouseY, setOnPointerDownMouseY] = useState(0);
  
  const lonRef = useRef(0);
  const latRef = useRef(0);

  useEffect(() => {
    if (!canvasHolderRef.current || !imageUrl) return;

    setIsLoadingTexture(true);

    const width = canvasHolderRef.current.clientWidth || 800;
    const height = canvasHolderRef.current.clientHeight || 600;

    // Dispose old renderer if exists
    if (rendererRef.current) {
      if (canvasHolderRef.current.contains(rendererRef.current.domElement)) {
        canvasHolderRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
    cameraRef.current = camera;

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(
      imageUrl,
      () => {
        setIsLoadingTexture(false);
        // Initial render to avoid black flicker
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      },
      undefined,
      (err) => {
        console.error("Error loading texture:", err);
        setIsLoadingTexture(false);
      }
    );

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
      const phi = THREE.MathUtils.degToRad(90 - latRef.current);
      const theta = THREE.MathUtils.degToRad(lonRef.current);
      const x = 500 * Math.sin(phi) * Math.cos(theta);
      const y = 500 * Math.cos(phi);
      const z = 500 * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.lookAt(x, y, z);
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
      if (sphereRef.current) {
        sphereRef.current.geometry.dispose();
        if (Array.isArray(sphereRef.current.material)) {
          sphereRef.current.material.forEach(m => m.dispose());
        } else {
          sphereRef.current.material.dispose();
        }
      }
    };
  }, [imageUrl]);

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.isPrimary === false) return;
    setIsUserInteracting(true);
    setOnPointerDownMouseX(event.clientX);
    setOnPointerDownMouseY(event.clientY);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (event.isPrimary === false || !isUserInteracting) return;
    lonRef.current = (onPointerDownMouseX - event.clientX) * 0.1 + lonRef.current;
    latRef.current = (event.clientY - onPointerDownMouseY) * 0.1 + latRef.current;
    setOnPointerDownMouseX(event.clientX);
    setOnPointerDownMouseY(event.clientY);
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (event.isPrimary === false) return;
    setIsUserInteracting(false);
  };

  const onContainerClick = (event: React.MouseEvent) => {
    if (isEditing && onSceneClick && !isLoadingTexture) {
      onSceneClick(lonRef.current % 360, latRef.current);
    }
  };

  const getHotspotPosition = (hLon: number, hLat: number) => {
    if (!cameraRef.current || !canvasHolderRef.current || isLoadingTexture) return null;
    const phi = THREE.MathUtils.degToRad(90 - hLat);
    const theta = THREE.MathUtils.degToRad(hLon);
    const vector = new THREE.Vector3(
      500 * Math.sin(phi) * Math.cos(theta),
      500 * Math.cos(phi),
      500 * Math.sin(phi) * Math.sin(theta)
    );
    vector.project(cameraRef.current);
    const camDir = new THREE.Vector3();
    cameraRef.current.getWorldDirection(camDir);
    const dot = camDir.dot(vector.clone().normalize());
    if (dot < 0) return null;
    const x = (vector.x * 0.5 + 0.5) * canvasHolderRef.current.clientWidth;
    const y = (-(vector.y * 0.5) + 0.5) * canvasHolderRef.current.clientHeight;
    return { x, y };
  };

  const [visibleHotspots, setVisibleHotspots] = useState<{h: Hotspot, x: number, y: number}[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isLoadingTexture) return;
      const projected = hotspots.map(h => {
        const pos = getHotspotPosition(h.yaw, h.pitch);
        return pos ? { h, x: pos.x, y: pos.y } : null;
      }).filter(p => p !== null) as {h: Hotspot, x: number, y: number}[];
      setVisibleHotspots(projected);
    }, 16);
    return () => clearInterval(interval);
  }, [hotspots, isLoadingTexture]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full panoramic-viewer overflow-hidden bg-black rounded-xl"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onContainerClick}
    >
      <div ref={canvasHolderRef} className="absolute inset-0" />

      {isLoadingTexture && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50">
           <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
           <p className="text-white text-sm font-medium animate-pulse">Iniciando vista inmersiva...</p>
        </div>
      )}

      {!isLoadingTexture && (
        <div className="absolute inset-0 pointer-events-none">
          {visibleHotspots.map(({h, x, y}) => (
            <div 
              key={h.id}
              className="absolute pointer-events-auto transition-transform hover:scale-110 active:scale-95"
              style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
            >
              <Button
                variant="default"
                size="sm"
                className="rounded-full bg-primary/90 border-2 border-white/20 shadow-lg px-4 py-2 flex items-center gap-2 group whitespace-nowrap"
                onClick={(e) => {
                  e.stopPropagation();
                  onHotspotClick?.(h.targetSceneId);
                }}
              >
                <span className="max-w-0 overflow-hidden group-hover:max-w-[200px] transition-all duration-300 font-medium">
                  {h.label}
                </span>
                <ChevronRight className="w-5 h-5 text-white" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="absolute top-4 left-4 flex gap-2">
        <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white/80 border border-white/10">
          {isEditing ? 'Haz clic para enlazar estancias' : 'Vista Panorámica'}
        </div>
      </div>
    </div>
  );
};
