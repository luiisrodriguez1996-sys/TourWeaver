
export interface Tour {
  id: string;
  name: string;
  slug: string;
  description: string;
  published: boolean;
  floorPlanUrl?: string;
  showFloorPlan?: boolean;
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
}

export interface Hotspot {
  id: string;
  sceneId: string;
  targetSceneId: string;
  label: string;
  yaw: number; // in radians or degrees, usually 0 to 2PI
  pitch: number; // in radians or degrees, usually -PI/2 to PI/2
}

export interface User {
  uid: string;
  email: string | null;
}
