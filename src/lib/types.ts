
export interface Tour {
  id: string;
  name: string;
  clientName: string; // Internal client name for grouping
  slug: string;
  description: string;
  published: boolean;
  floorPlanUrl?: string;
  showFloorPlan?: boolean;
  thumbnailUrl?: string;
  address?: string; // Physical address
  latitude?: number;
  longitude?: number;
  createdAt: number;
  updatedAt: number;
  scenes: Scene[];
}

export interface Scene {
  id: string;
  tourId: string;
  name: string;
  description: string;
  imageUrl: string;
  hotspots: Hotspot[];
  floorPlanX?: number; // Position X in percentage (0-100)
  floorPlanY?: number; // Position Y in percentage (0-100)
}

export interface Hotspot {
  id: string;
  sceneId: string;
  targetSceneId: string;
  label: string;
  yaw: number; // in degrees
  pitch: number; // in degrees
}

export interface User {
  uid: string;
  email: string | null;
}
