import {
  GarmentType,
  GarmentConfig,
  FabricPreset,
  LightingPreset,
  PatternPieceConfig,
  ProjectState,
} from '../types';

export const PX_PER_CM = 5.0; // Calibrated scale: 1 centimetre = 5.0 SVG canvas pixels

export const GARMENTS: GarmentConfig[] = [
  {
    id: 'oversized-tee',
    name: 'Oversized Boxy Tee',
    subtitle: 'Drop-shoulder, wide boxy body & heavy rib collar',
    badge: '3D GLB',
    gsm: '280 GSM',
    fit: 'Boxy Oversized',
    modelUrl: '/models/oversized_tshirt.glb',
    modelAvailable: true,
    notes: 'Genuine 3D mesh with drop-shoulders and collar ribbing',
    pieces: ['front', 'back', 'left-sleeve', 'right-sleeve', 'collar'],
  },
  {
    id: 'classic-tee',
    name: 'Classic Regular Tee',
    subtitle: 'Standard tailored fit with clean crewneck silhouette',
    badge: '3D GLB',
    gsm: '200 GSM',
    fit: 'Regular / Classic',
    modelUrl: '/models/classic_tshirt.glb',
    modelAvailable: true,
    notes: 'Genuine 3D tailored fit model with natural sleeves',
    pieces: ['front', 'back', 'left-sleeve', 'right-sleeve', 'collar'],
  },
  {
    id: 'heavy-hoodie',
    name: 'Heavyweight Street Hoodie',
    subtitle: 'Anatomical hood, kangaroo pocket & ribbed cuffs',
    badge: '3D GLB',
    gsm: '450 GSM',
    fit: 'Heavyweight Boxy',
    modelUrl: '/models/heavy_hoodie.glb',
    modelAvailable: true,
    notes: 'Genuine 3D hoodie with real hood volume, pocket & natural folds',
    pieces: ['front', 'pocket', 'back', 'left-sleeve', 'right-sleeve', 'hood', 'waistband'],
  },
  {
    id: 'sweatshirt',
    name: 'Crewneck Sweatshirt',
    subtitle: 'Long sleeves with ribbed cuffs, collar & waistband',
    badge: '3D GLB',
    gsm: '380 GSM',
    fit: 'Relaxed Athletic',
    modelUrl: '/models/sweatshirt.glb',
    modelAvailable: true,
    notes: 'Genuine 3D crewneck pullover with rib-knit trims',
    pieces: ['front', 'back', 'left-sleeve', 'right-sleeve', 'collar', 'waistband'],
  },
];

// Helper to generate realistic garment pattern paths based on dimensions in cm
function generateTorsoPath(wCm: number, hCm: number, neckDropCm: number, isOversized = false): string {
  const w = (wCm * PX_PER_CM) / 2;
  const h = (hCm * PX_PER_CM) / 2;
  const neckDrop = neckDropCm * PX_PER_CM;
  const neckWidth = (wCm * 0.38 * PX_PER_CM) / 2;
  const shoulderDrop = (isOversized ? 6.5 : 5.0) * PX_PER_CM;
  const armholeDepth = (isOversized ? 26 : 22) * PX_PER_CM;

  return `
    M ${-neckWidth} ${-h}
    Q 0 ${-h + neckDrop} ${neckWidth} ${-h}
    L ${w} ${-h + shoulderDrop}
    Q ${w - 18} ${-h + shoulderDrop + armholeDepth * 0.6} ${w - 12} ${-h + armholeDepth}
    L ${w * 0.96} ${h}
    L ${-w * 0.96} ${h}
    L ${-(w - 12)} ${-h + armholeDepth}
    Q ${-(w - 18)} ${-h + shoulderDrop + armholeDepth * 0.6} ${-w} ${-h + shoulderDrop}
    Z
  `.replace(/\s+/g, ' ').trim();
}

function generateSleevePath(wCm: number, hCm: number, isLong = false): string {
  const w = (wCm * PX_PER_CM) / 2;
  const h = (hCm * PX_PER_CM) / 2;
  const capH = (isLong ? 14 : 10) * PX_PER_CM;
  const cuffW = isLong ? w * 0.65 : w * 0.85;

  return `
    M ${-w} ${-h + capH}
    Q 0 ${-h - capH * 0.3} ${w} ${-h + capH}
    L ${cuffW} ${h}
    L ${-cuffW} ${h}
    Z
  `.replace(/\s+/g, ' ').trim();
}

function generatePocketPath(wCm: number, hCm: number): string {
  const w = (wCm * PX_PER_CM) / 2;
  const h = (hCm * PX_PER_CM) / 2;
  const topW = w * 0.65;
  const angleH = h * 0.45;

  return `
    M ${-topW} ${-h}
    L ${topW} ${-h}
    L ${w} ${-h + angleH}
    L ${w * 0.95} ${h}
    L ${-w * 0.95} ${h}
    L ${-w} ${-h + angleH}
    Z
  `.replace(/\s+/g, ' ').trim();
}

function generateHoodPath(wCm: number, hCm: number): string {
  const w = (wCm * PX_PER_CM) / 2;
  const h = (hCm * PX_PER_CM) / 2;
  return `
    M ${-w * 0.8} ${h}
    L ${w * 0.8} ${h}
    Q ${w} ${h * 0.3} ${w * 0.9} ${-h * 0.4}
    Q ${w * 0.7} ${-h} 0 ${-h}
    Q ${-w * 0.9} ${-h * 0.7} ${-w} 0
    L ${-w * 0.8} ${h}
    Z
  `.replace(/\s+/g, ' ').trim();
}

export const PATTERN_PIECES_BY_GARMENT: Record<GarmentType, PatternPieceConfig[]> = {
  // 1. OVERSIZED T-SHIRT (Drop Shoulder Boxy Cut)
  'oversized-tee': [
    {
      id: 'front',
      garmentId: 'oversized-tee',
      name: 'Front Body',
      shortCode: 'FRONT',
      description: 'Relaxed drop-shoulder chest & torso panel',
      widthCm: 64,
      heightCm: 76,
      canvasX: 420,
      canvasY: 340,
      cameraAngle: 'front',
      uvBounds: { uMin: 0.05, uMax: 0.46, vMin: 0.10, vMax: 0.88 },
      svgPath: generateTorsoPath(64, 76, 12, true),
    },
    {
      id: 'back',
      garmentId: 'oversized-tee',
      name: 'Back Body',
      shortCode: 'BACK',
      description: 'Oversized back panel with higher crewneck collar',
      widthCm: 64,
      heightCm: 78,
      canvasX: 820,
      canvasY: 340,
      cameraAngle: 'back',
      uvBounds: { uMin: 0.52, uMax: 0.95, vMin: 0.10, vMax: 0.88 },
      svgPath: generateTorsoPath(64, 78, 4.5, true),
    },
    {
      id: 'left-sleeve',
      garmentId: 'oversized-tee',
      name: 'Left Sleeve',
      shortCode: 'L-SLEEVE',
      description: 'Wide dropped bicep with elbow cuff hem',
      widthCm: 44,
      heightCm: 28,
      canvasX: 130,
      canvasY: 220,
      cameraAngle: 'left',
      uvBounds: { uMin: 0.02, uMax: 0.28, vMin: 0.04, vMax: 0.38 },
      svgPath: generateSleevePath(44, 28, false),
    },
    {
      id: 'right-sleeve',
      garmentId: 'oversized-tee',
      name: 'Right Sleeve',
      shortCode: 'R-SLEEVE',
      description: 'Wide dropped bicep with elbow cuff hem',
      widthCm: 44,
      heightCm: 28,
      canvasX: 1110,
      canvasY: 220,
      cameraAngle: 'right',
      uvBounds: { uMin: 0.72, uMax: 0.98, vMin: 0.04, vMax: 0.38 },
      svgPath: generateSleevePath(44, 28, false),
    },
    {
      id: 'collar',
      garmentId: 'oversized-tee',
      name: 'Collar Rib',
      shortCode: 'COLLAR',
      description: 'Heavy 3.5 cm ribbed neckband strip',
      widthCm: 48,
      heightCm: 4,
      canvasX: 620,
      canvasY: 65,
      cameraAngle: 'front',
      uvBounds: { uMin: 0.20, uMax: 0.80, vMin: 0.92, vMax: 0.98 },
      svgPath: `M -120 -10 L 120 -10 L 120 10 L -120 10 Z`,
    },
  ],

  // 2. CLASSIC REGULAR T-SHIRT (Tailored Fit)
  'classic-tee': [
    {
      id: 'front',
      garmentId: 'classic-tee',
      name: 'Front Body',
      shortCode: 'FRONT',
      description: 'Regular tailored chest & torso panel',
      widthCm: 54,
      heightCm: 72,
      canvasX: 420,
      canvasY: 340,
      cameraAngle: 'front',
      uvBounds: { uMin: 0.05, uMax: 0.46, vMin: 0.10, vMax: 0.88 },
      svgPath: generateTorsoPath(54, 72, 10, false),
    },
    {
      id: 'back',
      garmentId: 'classic-tee',
      name: 'Back Body',
      shortCode: 'BACK',
      description: 'Regular tailored back panel',
      widthCm: 54,
      heightCm: 74,
      canvasX: 800,
      canvasY: 340,
      cameraAngle: 'back',
      uvBounds: { uMin: 0.52, uMax: 0.95, vMin: 0.10, vMax: 0.88 },
      svgPath: generateTorsoPath(54, 74, 3.5, false),
    },
    {
      id: 'left-sleeve',
      garmentId: 'classic-tee',
      name: 'Left Sleeve',
      shortCode: 'L-SLEEVE',
      description: 'Standard short sleeve curve',
      widthCm: 38,
      heightCm: 24,
      canvasX: 140,
      canvasY: 220,
      cameraAngle: 'left',
      uvBounds: { uMin: 0.02, uMax: 0.28, vMin: 0.04, vMax: 0.38 },
      svgPath: generateSleevePath(38, 24, false),
    },
    {
      id: 'right-sleeve',
      garmentId: 'classic-tee',
      name: 'Right Sleeve',
      shortCode: 'R-SLEEVE',
      description: 'Standard short sleeve curve',
      widthCm: 38,
      heightCm: 24,
      canvasX: 1080,
      canvasY: 220,
      cameraAngle: 'right',
      uvBounds: { uMin: 0.72, uMax: 0.98, vMin: 0.04, vMax: 0.38 },
      svgPath: generateSleevePath(38, 24, false),
    },
    {
      id: 'collar',
      garmentId: 'classic-tee',
      name: 'Collar Rib',
      shortCode: 'COLLAR',
      description: 'Standard 3 cm crewneck rib trim',
      widthCm: 46,
      heightCm: 3,
      canvasX: 610,
      canvasY: 65,
      cameraAngle: 'front',
      uvBounds: { uMin: 0.20, uMax: 0.80, vMin: 0.92, vMax: 0.98 },
      svgPath: `M -115 -8 L 115 -8 L 115 8 L -115 8 Z`,
    },
  ],

  // 3. HEAVYWEIGHT HOODIE (Hood, Kangaroo Pocket, Long Sleeves, Waistband)
  'heavy-hoodie': [
    {
      id: 'front',
      garmentId: 'heavy-hoodie',
      name: 'Front Body',
      shortCode: 'FRONT',
      description: 'Heavy fleece chest and torso panel',
      widthCm: 64,
      heightCm: 72,
      canvasX: 390,
      canvasY: 340,
      cameraAngle: 'front',
      uvBounds: { uMin: 0.05, uMax: 0.48, vMin: 0.15, vMax: 0.85 },
      svgPath: generateTorsoPath(64, 72, 8, true),
    },
    {
      id: 'pocket',
      garmentId: 'heavy-hoodie',
      name: 'Kangaroo Pocket',
      shortCode: 'POCKET',
      description: 'Front kangaroo pouch pocket with angled entries',
      widthCm: 44,
      heightCm: 26,
      canvasX: 390,
      canvasY: 420,
      cameraAngle: 'front',
      uvBounds: { uMin: 0.10, uMax: 0.44, vMin: 0.16, vMax: 0.46 },
      svgPath: generatePocketPath(44, 26),
    },
    {
      id: 'back',
      garmentId: 'heavy-hoodie',
      name: 'Back Body',
      shortCode: 'BACK',
      description: 'Full heavyweight back torso panel',
      widthCm: 64,
      heightCm: 74,
      canvasX: 790,
      canvasY: 340,
      cameraAngle: 'back',
      uvBounds: { uMin: 0.52, uMax: 0.95, vMin: 0.15, vMax: 0.85 },
      svgPath: generateTorsoPath(64, 74, 4, true),
    },
    {
      id: 'left-sleeve',
      garmentId: 'heavy-hoodie',
      name: 'Left Sleeve',
      shortCode: 'L-SLEEVE',
      description: 'Full length sleeve with ribbed cuff',
      widthCm: 46,
      heightCm: 64,
      canvasX: 120,
      canvasY: 340,
      cameraAngle: 'left',
      uvBounds: { uMin: 0.02, uMax: 0.28, vMin: 0.02, vMax: 0.45 },
      svgPath: generateSleevePath(46, 64, true),
    },
    {
      id: 'right-sleeve',
      garmentId: 'heavy-hoodie',
      name: 'Right Sleeve',
      shortCode: 'R-SLEEVE',
      description: 'Full length sleeve with ribbed cuff',
      widthCm: 46,
      heightCm: 64,
      canvasX: 1060,
      canvasY: 340,
      cameraAngle: 'right',
      uvBounds: { uMin: 0.72, uMax: 0.98, vMin: 0.02, vMax: 0.45 },
      svgPath: generateSleevePath(46, 64, true),
    },
    {
      id: 'hood',
      garmentId: 'heavy-hoodie',
      name: 'Hood Panel',
      shortCode: 'HOOD',
      description: 'Anatomical double-layer hood side panel',
      widthCm: 38,
      heightCm: 44,
      canvasX: 590,
      canvasY: 90,
      cameraAngle: 'front',
      uvBounds: { uMin: 0.25, uMax: 0.75, vMin: 0.84, vMax: 0.99 },
      svgPath: generateHoodPath(38, 44),
    },
    {
      id: 'waistband',
      garmentId: 'heavy-hoodie',
      name: 'Rib Waistband',
      shortCode: 'WAIST',
      description: 'Bottom 2x2 rib elasticated waistband band',
      widthCm: 56,
      heightCm: 8,
      canvasX: 590,
      canvasY: 570,
      cameraAngle: 'front',
      uvBounds: { uMin: 0.08, uMax: 0.92, vMin: 0.05, vMax: 0.12 },
      svgPath: `M -140 -20 L 140 -20 L 140 20 L -140 20 Z`,
    },
  ],

  // 4. CREWNECK SWEATSHIRT (Raglan Sleeves, Rib Collar, Rib Waistband)
  'sweatshirt': [
    {
      id: 'front',
      garmentId: 'sweatshirt',
      name: 'Front Body',
      shortCode: 'FRONT',
      description: 'Relaxed athletic chest and torso panel',
      widthCm: 60,
      heightCm: 70,
      canvasX: 400,
      canvasY: 340,
      cameraAngle: 'front',
      uvBounds: { uMin: 0.05, uMax: 0.48, vMin: 0.15, vMax: 0.85 },
      svgPath: generateTorsoPath(60, 70, 9, false),
    },
    {
      id: 'back',
      garmentId: 'sweatshirt',
      name: 'Back Body',
      shortCode: 'BACK',
      description: 'Relaxed athletic back panel',
      widthCm: 60,
      heightCm: 72,
      canvasX: 790,
      canvasY: 340,
      cameraAngle: 'back',
      uvBounds: { uMin: 0.52, uMax: 0.95, vMin: 0.15, vMax: 0.85 },
      svgPath: generateTorsoPath(60, 72, 4, false),
    },
    {
      id: 'left-sleeve',
      garmentId: 'sweatshirt',
      name: 'Left Sleeve',
      shortCode: 'L-SLEEVE',
      description: 'Long athletic sleeve with ribbed cuff',
      widthCm: 44,
      heightCm: 64,
      canvasX: 130,
      canvasY: 340,
      cameraAngle: 'left',
      uvBounds: { uMin: 0.02, uMax: 0.28, vMin: 0.02, vMax: 0.45 },
      svgPath: generateSleevePath(44, 64, true),
    },
    {
      id: 'right-sleeve',
      garmentId: 'sweatshirt',
      name: 'Right Sleeve',
      shortCode: 'R-SLEEVE',
      description: 'Long athletic sleeve with ribbed cuff',
      widthCm: 44,
      heightCm: 64,
      canvasX: 1060,
      canvasY: 340,
      cameraAngle: 'right',
      uvBounds: { uMin: 0.72, uMax: 0.98, vMin: 0.02, vMax: 0.45 },
      svgPath: generateSleevePath(44, 64, true),
    },
    {
      id: 'collar',
      garmentId: 'sweatshirt',
      name: 'Collar Rib',
      shortCode: 'COLLAR',
      description: 'Heavy ribbed crewneck band',
      widthCm: 46,
      heightCm: 3.5,
      canvasX: 590,
      canvasY: 65,
      cameraAngle: 'front',
      uvBounds: { uMin: 0.20, uMax: 0.80, vMin: 0.92, vMax: 0.98 },
      svgPath: `M -115 -9 L 115 -9 L 115 9 L -115 9 Z`,
    },
    {
      id: 'waistband',
      garmentId: 'sweatshirt',
      name: 'Rib Waistband',
      shortCode: 'WAIST',
      description: 'Bottom elasticated 2x2 rib waistband',
      widthCm: 52,
      heightCm: 7,
      canvasX: 590,
      canvasY: 570,
      cameraAngle: 'front',
      uvBounds: { uMin: 0.08, uMax: 0.92, vMin: 0.05, vMax: 0.12 },
      svgPath: `M -130 -18 L 130 -18 L 130 18 L -130 18 Z`,
    },
  ],
};

export const COLOR_PALETTE = [
  { name: 'Pitch Black', hex: '#111112', group: 'core' },
  { name: 'Crisp White', hex: '#F9F9FB', group: 'core' },
  { name: 'Heather Grey', hex: '#7E8288', group: 'core' },
  { name: 'Vintage Navy', hex: '#1C2638', group: 'street' },
  { name: 'Washed Olive', hex: '#444C38', group: 'street' },
  { name: 'Crimson Red', hex: '#991B1B', group: 'accent' },
  { name: 'Forest Green', hex: '#1B3C2A', group: 'street' },
  { name: 'Pastel Lavender', hex: '#D7D3E8', group: 'street' },
  { name: 'Oatmeal Cream', hex: '#ECE6DA', group: 'core' },
  { name: 'Sunset Ochre', hex: '#B87333', group: 'accent' },
  { name: 'Clay Terracotta', hex: '#9C4C38', group: 'accent' },
  { name: 'Royal Cobalt', hex: '#1E3A8A', group: 'accent' },
];

export const FABRICS: FabricPreset[] = [
  {
    id: 'heavyweight',
    name: 'Heavyweight Boxy Cotton',
    description: 'Stiff, structured drape with subtle matte weave (280-300 GSM)',
    weight: '300 GSM',
    roughness: 0.88,
    metalness: 0.04,
    weaveDetail: 'Dense cross-weave, structured drop',
  },
  {
    id: 'cotton-jersey',
    name: 'Combed Cotton Jersey',
    description: 'Soft hand-feel, gentle natural luster with fluid drape',
    weight: '210 GSM',
    roughness: 0.76,
    metalness: 0.05,
    weaveDetail: 'Fine knit single jersey',
  },
  {
    id: 'fleece',
    name: 'Brushed Heavy Fleece',
    description: 'Thick, ultra-matte texture with deep micro-shadows',
    weight: '450 GSM',
    roughness: 0.95,
    metalness: 0.01,
    weaveDetail: 'Loopback interior, brushed exterior',
  },
  {
    id: 'poly-blend',
    name: 'Technical Poly-Cotton',
    description: 'Smooth, slight technical sheen with sharp seam retention',
    weight: '240 GSM',
    roughness: 0.58,
    metalness: 0.12,
    weaveDetail: 'High-density synthetic blend',
  },
];

export const PRINT_FINISHES = [
  {
    id: 'standard',
    name: 'Silkscreen Plastisol',
    description: 'Vibrant opaque print with subtle satin finish',
    roughnessOffset: 0.0,
  },
  {
    id: 'matte-dtg',
    name: 'Direct-to-Garment (DTG) Matte',
    description: 'Water-based ink absorbed into fabric grain, ultra-matte',
    roughnessOffset: 0.08,
  },
  {
    id: 'rubberized',
    name: 'High-Density Rubberized',
    description: 'Raised, slightly glossy architectural streetwear print',
    roughnessOffset: -0.22,
  },
];

export const LIGHTING_PRESETS: LightingPreset[] = [
  {
    id: 'clean-studio',
    name: 'Editorial Studio',
    description: 'Balanced 3-point key and fill lights with crisp contact shadows',
    ambientIntensity: 0.65,
    mainLightIntensity: 1.4,
    rimLightIntensity: 0.8,
    colorTemp: '#FFFFFF',
  },
  {
    id: 'dramatic-street',
    name: 'Dramatic High-Contrast',
    description: 'Punchy directional sun-angle highlighting fabric contours',
    ambientIntensity: 0.35,
    mainLightIntensity: 2.2,
    rimLightIntensity: 1.2,
    colorTemp: '#F4F5F8',
  },
  {
    id: 'soft-ambient',
    name: 'Soft Daylight Diffuse',
    description: 'Gentle, even overcast wrap-around light with faint shadows',
    ambientIntensity: 1.1,
    mainLightIntensity: 0.8,
    rimLightIntensity: 0.4,
    colorTemp: '#EDF2F7',
  },
  {
    id: 'editorial-warm',
    name: 'Golden Lookbook Warmth',
    description: 'Warm golden hour rim light and soft terracotta fill',
    ambientIntensity: 0.55,
    mainLightIntensity: 1.6,
    rimLightIntensity: 1.1,
    colorTemp: '#FFF6E8',
  },
];

export const DEFAULT_PROJECT: ProjectState = {
  id: 'project-' + Date.now(),
  name: 'ESSENTIALS 2D-3D DROP 01',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  garment: 'oversized-tee',
  garmentColor: '#111112', // Premium Pitch Black
  fabric: 'heavyweight',
  printFinish: 'standard',
  activeRegion: 'front',
  elements: [
    {
      id: 'initial-emblem',
      regionId: 'front',
      type: 'image',
      name: 'ThreadLab Emblem White',
      dataUrl: '/artwork/threadlab_white.svg',
      x: 0,
      y: -6,
      width: 24,
      height: 24,
      rotation: 0,
      scale: 1.0,
      opacity: 1.0,
      locked: false,
      zIndex: 1,
    },
  ],
  selectedElementId: 'initial-emblem',
  lighting: 'clean-studio',
  roughness: 0.88,
  backgroundColor: '#F6F6F7',
  autoRotate: false,
  viewMode: 'split',
};
