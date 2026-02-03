"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Hotspot } from '@/lib/types';
import { Button } from './ui/button';
import { ChevronRight, Maximize, MousePointer2 } from 'lucide-react';

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
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [onPointerDownMouseX, setOnPointerDownMouseX] = useState(0);
  const [onPointerDownMouseY, setOnPointerDownMouseY] = useState(0);
  const [lon, setLon] = useState(0);
  const [lat, setLat] = useState(0);
  const [phi, setPhi] = useState(0);
  const [theta, setTheta] = useState(0);
  
  const lonRef = useRef(0);
  const latRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
    cameraRef.current = camera;

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(imageUrl);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      requestAnimationFrame(animate);
      update();
    };

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

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
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
    if (isEditing && onSceneClick) {
      // Calculate lon/lat from current view for placing hotspot
      // Simplified: use center of current view
      onSceneClick(lonRef.current % 360, latRef.current);
    }
  };

  // Helper to project 3D hotspots to 2D UI overlay
  const getHotspotPosition = (hLon: number, hLat: number) => {
    if (!cameraRef.current || !containerRef.current) return null;
    
    const phi = THREE.MathUtils.degToRad(90 - hLat);
    const theta = THREE.MathUtils.degToRad(hLon);
    
    const vector = new THREE.Vector3(
      500 * Math.sin(phi) * Math.cos(theta),
      500 * Math.cos(phi),
      500 * Math.sin(phi) * Math.sin(theta)
    );
    
    vector.project(cameraRef.current);
    
    // Check if hotspot is in front of camera
    const camDir = new THREE.Vector3();
    cameraRef.current.getWorldDirection(camDir);
    const dot = camDir.dot(vector.clone().normalize());
    
    if (dot < 0) return null; // Behind camera

    const x = (vector.x * 0.5 + 0.5) * containerRef.current.clientWidth;
    const y = (-(vector.y * 0.5) + 0.5) * containerRef.current.clientHeight;
    
    return { x, y };
  };

  const [visibleHotspots, setVisibleHotspots] = useState<{h: Hotspot, x: number, y: number}[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const projected = hotspots.map(h => {
        const pos = getHotspotPosition(h.yaw, h.pitch);
        return pos ? { h, x: pos.x, y: pos.y } : null;
      }).filter(p => p !== null) as {h: Hotspot, x: number, y: number}[];
      setVisibleHotspots(projected);
    }, 16);
    return () => clearInterval(interval);
  }, [hotspots, lon, lat]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full panoramic-viewer overflow-hidden bg-black rounded-xl shadow-2xl"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onContainerClick}
    >
      {/* Hotspots Overlay */}
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
              <ChevronRight className="w-5 h-5 text-white animate-pulse" />
            </Button>
          </div>
        ))}
      </div>

      <div className="absolute top-4 left-4 flex gap-2">
        <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white/80 border border-white/10">
          {isEditing ? 'Editing Mode: Click to place hotspots' : 'Panoramic View'}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex gap-2">
         <Button size="icon" variant="secondary" className="bg-white/10 backdrop-blur-md border-white/10 hover:bg-white/20">
            <Maximize className="w-4 h-4 text-white" />
         </Button>
      </div>
    </div>
  );
};