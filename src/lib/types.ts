
export interface Tour {
  id: string;
  name: string;
  clientName: string;
  slug: string;
  description: string;
  published: boolean;
  showInPortfolio?: boolean;
  floors?: Floor[];
  showFloorPlan?: boolean;
  thumbnailUrl?: string;
  address?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsApp?: string;
  createdAt: number;
  updatedAt: number;
  sceneIds?: string[];
}

export interface SiteConfiguration {
  id: string;
  defaultLanguage: string;
  contactWhatsApp?: string;
  contactPhone?: string;
  contactEmail?: string;
  googleAnalyticsId?: string;
  googleSearchConsoleCode?: string;
}

export interface Floor {
  id: string;
  name: string;
  imageUrl: string;
}

export interface Scene {
  id: string;
  tourId: string;
  name: string;
  description: string;
  imageUrl: string;
  floorId?: string; // ID of the floor this scene belongs to
  hotspots: Hotspot[];
  annotations?: Annotation[];
  floorPlanX?: number;
  floorPlanY?: number;
}

export interface Hotspot {
  id: string;
  sceneId: string;
  targetSceneId: string;
  label: string;
  yaw: number;
  pitch: number;
}

export interface Annotation {
  id: string;
  sceneId: string;
  title: string;
  content: string;
  yaw: number;
  pitch: number;
}

export interface User {
  uid: string;
  email: string | null;
}
