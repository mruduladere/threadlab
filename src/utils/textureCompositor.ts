import * as THREE from 'three';
import { DesignElement, FabricMaterial, PrintFinish, GarmentType, PatternRegionId } from '../types';
import { PATTERN_PIECES_BY_GARMENT, PX_PER_CM } from '../constants/presets';

export class GarmentTextureCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public texture: THREE.CanvasTexture;
  public size: number = 2048;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  constructor(size: number = 2048) {
    this.size = size;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
  }

  public async loadImage(url: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url)!;
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  private drawFabricWeave(color: string, fabric: FabricMaterial, finish: PrintFinish) {
    const { ctx, size } = this;

    // 1. Fill base solid color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    // 2. Add subtle micro-weave noise to simulate authentic cloth
    const step = fabric === 'heavyweight' ? 3 : fabric === 'fleece' ? 4 : 2;
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(0,0,0,0.06)';

    for (let i = 0; i < size; i += step * 2) {
      ctx.fillRect(i, 0, 1, size);
      ctx.fillRect(0, i, size, 1);
    }

    if (fabric === 'heavyweight' || fabric === 'fleece') {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = -size; i < size * 2; i += step * 4) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + size, size);
        ctx.strokeStyle = 'rgba(0,0,0,0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Draw element on specified UV island
  private async drawElementOnUV(
    el: DesignElement,
    uvBounds: { uMin: number; uMax: number; vMin: number; vMax: number },
    pieceWidthCm: number,
    pieceHeightCm: number
  ) {
    const { ctx, size } = this;

    // UV box on 2048 canvas
    const boxX = uvBounds.uMin * size;
    const boxY = (1 - uvBounds.vMax) * size;
    const boxW = (uvBounds.uMax - uvBounds.uMin) * size;
    const boxH = (uvBounds.vMax - uvBounds.vMin) * size;

    // Center of pattern piece corresponds to center of UV island
    const uvCenterX = boxX + boxW * 0.5;
    const uvCenterY = boxY + boxH * 0.5;

    // Scale ratio between physical centimetres and UV canvas pixels
    const pxPerCmX = boxW / pieceWidthCm;
    const pxPerCmY = boxH / pieceHeightCm;
    const uniformScale = Math.min(pxPerCmX, pxPerCmY);

    // Element center in UV canvas coordinates
    const elCenterX = uvCenterX + el.x * uniformScale;
    const elCenterY = uvCenterY + el.y * uniformScale;

    ctx.save();
    ctx.globalAlpha = el.opacity;

    ctx.translate(elCenterX, elCenterY);
    ctx.rotate((el.rotation * Math.PI) / 180);

    const renderW = el.width * el.scale * uniformScale;
    const renderH = el.height * el.scale * uniformScale;

    if (el.type === 'image' && el.dataUrl) {
      try {
        const img = await this.loadImage(el.dataUrl);
        ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
      } catch (err) {
        console.warn('Failed to load element image for texture compositor:', err);
      }
    } else if (el.type === 'text' && el.text) {
      const fontSize = (el.fontSize || 32) * el.scale * (uniformScale / PX_PER_CM);
      ctx.font = `${el.fontWeight || 'bold'} ${Math.max(14, fontSize)}px ${el.fontFamily || 'Space Grotesk'}, sans-serif`;
      ctx.fillStyle = el.color || '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(el.text, 0, 0);
    }

    ctx.restore();
  }

  // Composite entire texture atlas across the selected garment's pattern pieces
  public async composite(
    garmentType: GarmentType,
    garmentColor: string,
    fabric: FabricMaterial,
    printFinish: PrintFinish,
    elements: DesignElement[]
  ): Promise<THREE.CanvasTexture> {
    const { ctx } = this;

    // 1. Draw base fabric background & weave
    this.drawFabricWeave(garmentColor, fabric, printFinish);

    const garmentPieces = PATTERN_PIECES_BY_GARMENT[garmentType] || PATTERN_PIECES_BY_GARMENT['oversized-tee'];

    // 2. Group elements by region and sort by zIndex
    const elementsByRegion = new Map<PatternRegionId, DesignElement[]>();

    for (const el of elements) {
      if (!elementsByRegion.has(el.regionId)) {
        elementsByRegion.set(el.regionId, []);
      }
      elementsByRegion.get(el.regionId)!.push(el);
    }

    // Sort each region by zIndex
    for (const [regionId, list] of elementsByRegion.entries()) {
      list.sort((a, b) => a.zIndex - b.zIndex);
    }

    // 3. Render elements on each pattern piece's UV island
    for (const piece of garmentPieces) {
      const regionElements = elementsByRegion.get(piece.id);
      if (!regionElements || regionElements.length === 0) continue;

      for (const el of regionElements) {
        await this.drawElementOnUV(el, piece.uvBounds, piece.widthCm, piece.heightCm);
      }
    }

    // Mark Three.js texture as dirty to upload to GPU
    this.texture.needsUpdate = true;
    return this.texture;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getTextureAtlasDataUrl(): string {
    return this.canvas.toDataURL('image/png', 0.95);
  }

  public dispose() {
    this.texture.dispose();
    this.imageCache.clear();
  }
}
