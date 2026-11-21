export type GarmentType = 'oversized-tee' | 'classic-tee' | 'heavy-hoodie' | 'sweatshirt';

export type PatternRegionId =
  | 'front'
  | 'back'
  | 'left-sleeve'
  | 'right-sleeve'
  | 'collar'
  | 'pocket'
  | 'hood'
  | 'cuffs'
  | 'waistband';

export interface DesignElement {
  id: string;
  regionId: PatternRegionId;
  type: 'image' | 'text';
  name: string;
  dataUrl?: string;          // For image elements
  text?: string;             // For text elements
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  x: number;                 // Center offset X in cm relative to piece center
  y: number;                 // Center offset Y in cm relative to piece center
  width: number;             // Width in cm
  height: number;            // Height in cm
  rotation: number;          // Degrees (-180 to 180)
  scale: number;             // Scale factor (0.2 to 3.0)
  opacity: number;           // 0 to 1
  locked: boolean;
  zIndex: number;
}

export type FabricMaterial = 'cotton-jersey' | 'heavyweight' | 'fleece' | 'poly-blend';

export type PrintFinish = 'standard' | 'matte-dtg' | 'rubberized';

export interface FabricPreset {
  id: FabricMaterial;
  name: string;
  description: string;
  weight: string;
  roughness: number;
  metalness: number;
  weaveDetail: string;
}

export type StudioLighting = 'clean-studio' | 'dramatic-street' | 'soft-ambient' | 'editorial-warm';

export interface LightingPreset {
  id: StudioLighting;
  name: string;
  description: string;
  ambientIntensity: number;
  mainLightIntensity: number;
  rimLightIntensity: number;
  colorTemp: string;
}

export type CameraPreset = 'front' | 'back' | 'left' | 'right' | 'three-quarter' | 'reset';

export interface GarmentConfig {
  id: GarmentType;
  name: string;
  subtitle: string;
  badge: string;
  gsm: string;
  fit: string;
  modelUrl: string;
  modelAvailable: boolean;
  notes: string;
  pieces: PatternRegionId[];
}

export interface PatternPieceConfig {
  id: PatternRegionId;
  garmentId: GarmentType;
  name: string;
  shortCode: string;
  description: string;
  widthCm: number;           // Physical width in centimetres
  heightCm: number;          // Physical height in centimetres
  canvasX: number;           // X center in canvas layout coordinates
  canvasY: number;           // Y center in canvas layout coordinates
  cameraAngle: CameraPreset; // Camera preset that best views this region in 3D
  uvBounds: {
    uMin: number;
    uMax: number;
    vMin: number;
    vMax: number;
  };
  svgPath: string;           // SVG path representing calibrated pattern shape
}

export interface ProjectState {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  garment: GarmentType;
  garmentColor: string;
  fabric: FabricMaterial;
  printFinish: PrintFinish;
  activeRegion: PatternRegionId;
  elements: DesignElement[];
  selectedElementId: string | null;
  lighting: StudioLighting;
  roughness: number;
  backgroundColor: string;
  autoRotate: boolean;
  viewMode: 'split' | '2d-only' | '3d-only';
}
