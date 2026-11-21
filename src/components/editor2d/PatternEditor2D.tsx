import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ProjectState,
  DesignElement,
  PatternRegionId,
  PatternPieceConfig,
} from '../../types';
import { PATTERN_PIECES_BY_GARMENT, PX_PER_CM } from '../../constants/presets';
import {
  Upload,
  Type,
  Copy,
  Trash2,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Ruler,
} from 'lucide-react';

interface Props {
  project: ProjectState;
  onUpdateProject: (updates: Partial<ProjectState>) => void;
  onFocusCameraToRegion: (regionId: PatternRegionId) => void;
}

export const PatternEditor2D: React.FC<Props> = ({
  project,
  onUpdateProject,
  onFocusCameraToRegion,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active garment pattern pieces
  const pieces = useMemo(() => {
    return PATTERN_PIECES_BY_GARMENT[project.garment] || PATTERN_PIECES_BY_GARMENT['oversized-tee'];
  }, [project.garment]);

  // Ensure activeRegion is valid for this garment
  useEffect(() => {
    const isValid = pieces.some((p) => p.id === project.activeRegion);
    if (!isValid && pieces.length > 0) {
      onUpdateProject({ activeRegion: pieces[0].id });
    }
  }, [pieces, project.activeRegion]);

  // Canvas Viewport Transform (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 30 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Transform interaction state
  const [dragMode, setDragMode] = useState<
    'none' | 'move' | 'scale-se' | 'scale-sw' | 'scale-ne' | 'scale-nw' | 'rotate'
  >('none');
  const [dragStart, setDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
    initialRot: number;
    aspectRatio: number;
  }>({
    mouseX: 0,
    mouseY: 0,
    initialX: 0,
    initialY: 0,
    initialW: 0,
    initialH: 0,
    initialRot: 0,
    aspectRatio: 1,
  });

  const selectedElement = project.elements.find(
    (el) => el.id === project.selectedElementId
  );

  // Fit to View Calculation
  const fitToView = () => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const piece of pieces) {
      const halfW = (piece.widthCm * PX_PER_CM) / 2;
      const halfH = (piece.heightCm * PX_PER_CM) / 2;
      minX = Math.min(minX, piece.canvasX - halfW);
      maxX = Math.max(maxX, piece.canvasX + halfW);
      minY = Math.min(minY, piece.canvasY - halfH);
      maxY = Math.max(maxY, piece.canvasY + halfH);
    }

    const padding = 60;
    const totalW = maxX - minX + padding * 2;
    const totalH = maxY - minY + padding * 2;

    const scaleX = (containerW - 40) / totalW;
    const scaleY = (containerH - 70) / totalH;
    const newZoom = Math.max(0.35, Math.min(1.2, Math.min(scaleX, scaleY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(newZoom);
    setPan({
      x: containerW / 2 - centerX * newZoom,
      y: containerH / 2 - centerY * newZoom + 15,
    });
  };

  // Auto fit on garment change
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToView();
    }, 100);
    return () => clearTimeout(timer);
  }, [project.garment]);

  // Helper to convert screen mouse event to SVG board coordinates
  const getSVGPoint = (e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    return {
      x: (svgP.x - pan.x) / zoom,
      y: (svgP.y - pan.y) / zoom,
    };
  };

  // Select pattern piece
  const handleSelectPiece = (pieceId: PatternRegionId) => {
    onUpdateProject({ activeRegion: pieceId });
    onFocusCameraToRegion(pieceId);
  };

  // Add Image Element to Active Region
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        let wCm = 24; // Default 24 cm width
        let hCm = wCm / aspect;
        if (hCm > 32) {
          hCm = 32;
          wCm = hCm * aspect;
        }

        const newElement: DesignElement = {
          id: 'element-' + Date.now(),
          regionId: project.activeRegion,
          type: 'image',
          name: file.name.slice(0, 16),
          dataUrl,
          x: 0,
          y: 0,
          width: Math.round(wCm),
          height: Math.round(hCm),
          rotation: 0,
          scale: 1.0,
          opacity: 1.0,
          locked: false,
          zIndex: project.elements.length + 1,
        };

        onUpdateProject({
          elements: [...project.elements, newElement],
          selectedElementId: newElement.id,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Add Text Element
  const handleAddText = () => {
    const newElement: DesignElement = {
      id: 'text-' + Date.now(),
      regionId: project.activeRegion,
      type: 'text',
      name: 'Custom Text',
      text: 'THREADLAB',
      fontFamily: 'Space Grotesk',
      fontSize: 28,
      fontWeight: 'bold',
      color: project.garmentColor === '#111112' ? '#FFFFFF' : '#111112',
      x: 0,
      y: 0,
      width: 28,
      height: 8,
      rotation: 0,
      scale: 1.0,
      opacity: 1.0,
      locked: false,
      zIndex: project.elements.length + 1,
    };

    onUpdateProject({
      elements: [...project.elements, newElement],
      selectedElementId: newElement.id,
    });
  };

  const handleDuplicate = () => {
    if (!selectedElement) return;
    const duplicated: DesignElement = {
      ...selectedElement,
      id: 'element-' + Date.now(),
      name: selectedElement.name + ' (Copy)',
      x: selectedElement.x + 3,
      y: selectedElement.y + 3,
      zIndex: project.elements.length + 1,
    };
    onUpdateProject({
      elements: [...project.elements, duplicated],
      selectedElementId: duplicated.id,
    });
  };

  const handleDelete = () => {
    if (!selectedElement) return;
    onUpdateProject({
      elements: project.elements.filter((el) => el.id !== selectedElement.id),
      selectedElementId: null,
    });
  };

  const updateSelectedElement = (updates: Partial<DesignElement>) => {
    if (!selectedElement) return;
    onUpdateProject({
      elements: project.elements.map((el) =>
        el.id === selectedElement.id ? { ...el, ...updates } : el
      ),
    });
  };

  // Mouse Handlers for Dragging, Scaling, and Rotating
  const handleMouseDownOnElement = (
    e: React.MouseEvent,
    el: DesignElement,
    mode: 'move' | 'scale-se' | 'scale-sw' | 'scale-ne' | 'scale-nw' | 'rotate'
  ) => {
    e.stopPropagation();
    if (el.locked && mode !== 'move') return;

    onUpdateProject({
      selectedElementId: el.id,
      activeRegion: el.regionId,
    });
    onFocusCameraToRegion(el.regionId);

    if (el.locked) return;

    const pt = getSVGPoint(e);
    setDragMode(mode);
    setDragStart({
      mouseX: pt.x,
      mouseY: pt.y,
      initialX: el.x,
      initialY: el.y,
      initialW: el.width,
      initialH: el.height,
      initialRot: el.rotation,
      aspectRatio: el.width / el.height,
    });
  };

  // Global Mouse Move and Mouse Up for fluid transforms
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPan((prev) => ({
          x: prev.x + (e.clientX - startPan.x),
          y: prev.y + (e.clientY - startPan.y),
        }));
        setStartPan({ x: e.clientX, y: e.clientY });
        return;
      }

      if (dragMode === 'none' || !selectedElement) return;

      const pt = getSVGPoint(e);
      const piece = pieces.find((p) => p.id === selectedElement.regionId);
      if (!piece) return;

      if (dragMode === 'move') {
        const dx = (pt.x - dragStart.mouseX) / PX_PER_CM;
        const dy = (pt.y - dragStart.mouseY) / PX_PER_CM;
        updateSelectedElement({
          x: Math.round(dragStart.initialX + dx),
          y: Math.round(dragStart.initialY + dy),
        });
      } else if (dragMode === 'scale-se' || dragMode === 'scale-nw') {
        const dx = (pt.x - dragStart.mouseX) / PX_PER_CM;
        const sign = dragMode === 'scale-se' ? 1 : -1;
        const newW = Math.max(6, dragStart.initialW + dx * sign * 2);
        const newH = newW / dragStart.aspectRatio;
        updateSelectedElement({
          width: Math.round(newW),
          height: Math.round(newH),
        });
      } else if (dragMode === 'rotate') {
        const centerWorldX = piece.canvasX + selectedElement.x * PX_PER_CM;
        const centerWorldY = piece.canvasY + selectedElement.y * PX_PER_CM;
        const angleRad = Math.atan2(pt.y - centerWorldY, pt.x - centerWorldX);
        const angleDeg = Math.round((angleRad * 180) / Math.PI) + 90;
        const normalized = ((angleDeg + 180) % 360) - 180;
        updateSelectedElement({ rotation: normalized });
      }
    };

    const handleMouseUp = () => {
      setDragMode('none');
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragMode, dragStart, isPanning, startPan, selectedElement, pan, zoom, pieces]);

  const handleMouseDownBackground = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as any).id === 'editor-bg') {
      onUpdateProject({ selectedElementId: null });
      setIsPanning(true);
      setStartPan({ x: e.clientX, y: e.clientY });
    }
  };

  // Generate Centimetre Ruler Ticks
  const cmRulerTicks = useMemo(() => {
    const ticks = [];
    // Board span: 0 to 1400 px = 0 to 280 cm
    for (let cm = 0; cm <= 280; cm += 5) {
      ticks.push(cm);
    }
    return ticks;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-[#F6F6F7] select-none overflow-hidden"
    >
      {/* 2D Canvas Toolbar */}
      <div className="h-11 border-b border-[#E4E4E7] bg-white px-4 flex items-center justify-between z-10 shrink-0">
        {/* Left: Active Region Indicator & Garment Pieces */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-[#71717A] uppercase mr-1">
            Pieces:
          </span>
          <div className="flex items-center gap-1 bg-[#F4F4F6] p-0.5 rounded-lg border border-[#E4E4E7]">
            {pieces.map((piece) => {
              const isActive = piece.id === project.activeRegion;
              return (
                <button
                  key={piece.id}
                  onClick={() => handleSelectPiece(piece.id)}
                  className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-md transition-all ${
                    isActive
                      ? 'bg-black text-white shadow-subtle font-semibold'
                      : 'text-[#71717A] hover:text-[#09090B]'
                  }`}
                >
                  {piece.shortCode}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Element Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium bg-black text-white hover:bg-[#27272A] transition-colors shadow-subtle"
          >
            <Upload size={13} />
            <span>Add Graphic</span>
          </button>

          <button
            onClick={handleAddText}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border border-[#E4E4E7] bg-white text-[#09090B] hover:bg-[#F4F4F6] transition-colors"
          >
            <Type size={13} />
            <span>Add Text</span>
          </button>

          {selectedElement && (
            <>
              <div className="h-4 w-[1px] bg-[#E4E4E7] mx-1" />

              <button
                onClick={handleDuplicate}
                title="Duplicate Element (Ctrl+D)"
                className="p-1.5 rounded hover:bg-[#F4F4F6] text-[#09090B] border border-[#E4E4E7]"
              >
                <Copy size={13} />
              </button>

              <button
                onClick={handleDelete}
                title="Delete Element"
                className="p-1.5 rounded hover:bg-red-50 text-red-600 border border-red-200"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>

        {/* Right: Zoom & Calibrated Fit-to-View */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center border border-[#E4E4E7] rounded bg-white">
            <button
              onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
              className="p-1.5 text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F6]"
            >
              <ZoomOut size={13} />
            </button>
            <span className="px-2 font-mono text-[10px] text-[#09090B] min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
              className="p-1.5 text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F6]"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          <button
            onClick={fitToView}
            title="Fit All Pattern Pieces to View"
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#E4E4E7] bg-white text-xs font-mono font-medium text-[#09090B] hover:bg-[#F4F4F6] shadow-subtle"
          >
            <Maximize2 size={12} />
            <span>Fit View</span>
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* 2D Interactive Pattern Workspace (Calibrated Centimetre SVG Board) */}
      <div
        className="flex-1 w-full h-full relative cursor-default overflow-hidden"
        onMouseDown={handleMouseDownBackground}
      >
        <svg
          ref={svgRef}
          className="w-full h-full block"
          viewBox="0 0 1400 900"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Background capture plane */}
          <rect id="editor-bg" width="1400" height="900" fill="#F4F4F6" />

          {/* Master Zoom and Pan Group */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* 1. CALIBRATED CENTIMETRE GRID (1 cm minor, 5 cm major) */}
            <defs>
              {/* Minor grid pattern: 1 cm = PX_PER_CM = 5px */}
              <pattern
                id="cm-minor-grid"
                width={PX_PER_CM}
                height={PX_PER_CM}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${PX_PER_CM} 0 L 0 0 0 ${PX_PER_CM}`}
                  fill="none"
                  stroke="#E4E4E7"
                  strokeWidth="0.5"
                />
              </pattern>

              {/* Major grid pattern: 5 cm = 25px */}
              <pattern
                id="cm-major-grid"
                width={PX_PER_CM * 5}
                height={PX_PER_CM * 5}
                patternUnits="userSpaceOnUse"
              >
                <rect width={PX_PER_CM * 5} height={PX_PER_CM * 5} fill="url(#cm-minor-grid)" />
                <path
                  d={`M ${PX_PER_CM * 5} 0 L 0 0 0 ${PX_PER_CM * 5}`}
                  fill="none"
                  stroke="#D4D4D8"
                  strokeWidth="1"
                />
              </pattern>
            </defs>

            {/* Grid surface */}
            <rect x="-1000" y="-1000" width="3500" height="3000" fill="url(#cm-major-grid)" />

            {/* Centimetre Major Coordinate Numbers */}
            <g opacity="0.6" pointerEvents="none">
              {cmRulerTicks.map((cm) => (
                <text
                  key={`cm-label-${cm}`}
                  x={cm * PX_PER_CM + 2}
                  y="12"
                  fill="#71717A"
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="8"
                >
                  {cm} cm
                </text>
              ))}
            </g>

            {/* 2. RENDER THE CURRENT GARMENT'S PATTERN PIECES */}
            {pieces.map((piece) => {
              const isSelectedPiece = piece.id === project.activeRegion;
              const pieceElements = project.elements
                .filter((el) => el.regionId === piece.id)
                .sort((a, b) => a.zIndex - b.zIndex);

              const widthPx = piece.widthCm * PX_PER_CM;
              const heightPx = piece.heightCm * PX_PER_CM;

              return (
                <g
                  key={piece.id}
                  transform={`translate(${piece.canvasX}, ${piece.canvasY})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPiece(piece.id);
                  }}
                  className="cursor-pointer"
                >
                  {/* Pattern Piece Header Badge with Real Physical Dimensions in CM */}
                  <g transform={`translate(0, ${-heightPx / 2 - 28})`}>
                    <rect
                      x="-95"
                      y="-12"
                      width="190"
                      height="24"
                      rx="12"
                      fill={isSelectedPiece ? '#09090B' : '#FFFFFF'}
                      stroke={isSelectedPiece ? '#09090B' : '#E4E4E7'}
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={isSelectedPiece ? '#FFFFFF' : '#09090B'}
                      fontFamily="'JetBrains Mono', monospace"
                      fontSize="10"
                      fontWeight="700"
                      letterSpacing="0.5"
                    >
                      {piece.name.toUpperCase()} ({piece.widthCm}×{piece.heightCm} CM)
                    </text>
                  </g>

                  {/* Pattern Piece Fabric Fill with Authentic Seam Cut */}
                  <path
                    d={piece.svgPath}
                    fill={project.garmentColor}
                    stroke={isSelectedPiece ? '#09090B' : '#D4D4D8'}
                    strokeWidth={isSelectedPiece ? 3 : 1.5}
                    filter="drop-shadow(0 4px 12px rgba(0,0,0,0.06))"
                  />

                  {/* Inner Printable Area Dashed Guide (Seam Allowance) */}
                  <path
                    d={piece.svgPath}
                    fill="none"
                    stroke={isSelectedPiece ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.1)'}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    transform="scale(0.88)"
                  />

                  {/* Vertical Centerline Alignment Mark */}
                  {(piece.id === 'front' || piece.id === 'back') && (
                    <line
                      x1="0"
                      y1={-heightPx / 2 + 20}
                      x2="0"
                      y2={heightPx / 2 - 20}
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth="1"
                      strokeDasharray="3 5"
                    />
                  )}

                  {/* Horizontal Chest Print Line Guide on Front Torso */}
                  {piece.id === 'front' && (
                    <line
                      x1={-widthPx * 0.35}
                      y1={-heightPx * 0.15}
                      x2={widthPx * 0.35}
                      y2={-heightPx * 0.15}
                      stroke="rgba(0,0,0,0.15)"
                      strokeWidth="1"
                      strokeDasharray="3 5"
                    />
                  )}

                  {/* RENDER DESIGN ELEMENTS ON THIS PATTERN PIECE */}
                  {pieceElements.map((el) => {
                    const isElementSelected = el.id === project.selectedElementId;
                    const elWidthPx = el.width * PX_PER_CM * el.scale;
                    const elHeightPx = el.height * PX_PER_CM * el.scale;
                    const halfW = elWidthPx / 2;
                    const halfH = elHeightPx / 2;

                    return (
                      <g
                        key={el.id}
                        transform={`translate(${el.x * PX_PER_CM}, ${el.y * PX_PER_CM}) rotate(${el.rotation})`}
                        onMouseDown={(e) => handleMouseDownOnElement(e, el, 'move')}
                        className={el.locked ? 'cursor-not-allowed' : 'cursor-move'}
                      >
                        {/* Image Content */}
                        {el.type === 'image' && el.dataUrl && (
                          <image
                            href={el.dataUrl}
                            x={-halfW}
                            y={-halfH}
                            width={elWidthPx}
                            height={elHeightPx}
                            opacity={el.opacity}
                            preserveAspectRatio="xMidYMid meet"
                          />
                        )}

                        {/* Typography Content */}
                        {el.type === 'text' && el.text && (
                          <text
                            x="0"
                            y="0"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={el.color || '#FFFFFF'}
                            fontFamily={el.fontFamily || 'Space Grotesk'}
                            fontSize={(el.fontSize || 28) * el.scale}
                            fontWeight={el.fontWeight || 'bold'}
                            opacity={el.opacity}
                          >
                            {el.text}
                          </text>
                        )}

                        {/* TRANSFORM HANDLES & BOUNDING BOX */}
                        {isElementSelected && (
                          <g>
                            <rect
                              x={-halfW - 3}
                              y={-halfH - 3}
                              width={halfW * 2 + 6}
                              height={halfH * 2 + 6}
                              fill="none"
                              stroke="#2563EB"
                              strokeWidth="1.5"
                              strokeDasharray="4 4"
                            />

                            {/* Rotation Handle Stalk and Knob */}
                            <line
                              x1="0"
                              y1={-halfH - 3}
                              x2="0"
                              y2={-halfH - 22}
                              stroke="#2563EB"
                              strokeWidth="1.5"
                            />
                            <circle
                              cx="0"
                              cy={-halfH - 22}
                              r="5"
                              fill="#2563EB"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                              className="cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) =>
                                handleMouseDownOnElement(e, el, 'rotate')
                              }
                            />

                            {/* 4 Corner Scale Handles */}
                            <rect
                              x={-halfW - 6}
                              y={-halfH - 6}
                              width="6"
                              height="6"
                              fill="#FFFFFF"
                              stroke="#2563EB"
                              strokeWidth="1.5"
                              className="cursor-nwse-resize"
                              onMouseDown={(e) =>
                                handleMouseDownOnElement(e, el, 'scale-nw')
                              }
                            />
                            <rect
                              x={halfW}
                              y={-halfH - 6}
                              width="6"
                              height="6"
                              fill="#FFFFFF"
                              stroke="#2563EB"
                              strokeWidth="1.5"
                              className="cursor-nesw-resize"
                              onMouseDown={(e) =>
                                handleMouseDownOnElement(e, el, 'scale-ne')
                              }
                            />
                            <rect
                              x={halfW}
                              y={halfH}
                              width="6"
                              height="6"
                              fill="#FFFFFF"
                              stroke="#2563EB"
                              strokeWidth="1.5"
                              className="cursor-nwse-resize"
                              onMouseDown={(e) =>
                                handleMouseDownOnElement(e, el, 'scale-se')
                              }
                            />
                            <rect
                              x={-halfW - 6}
                              y={halfH}
                              width="6"
                              height="6"
                              fill="#FFFFFF"
                              stroke="#2563EB"
                              strokeWidth="1.5"
                              className="cursor-nesw-resize"
                              onMouseDown={(e) =>
                                handleMouseDownOnElement(e, el, 'scale-sw')
                              }
                            />
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Quick Inspector with Real Centimetre Units */}
        {selectedElement && (
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#E4E4E7] shadow-float z-20 flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-[#71717A]">Element:</span>
              <span className="font-bold text-[#09090B]">{selectedElement.name}</span>
            </div>

            <div className="h-4 w-[1px] bg-[#E4E4E7]" />

            <div className="flex items-center gap-1.5">
              <span className="text-[#71717A]">X:</span>
              <input
                type="number"
                value={selectedElement.x}
                onChange={(e) =>
                  updateSelectedElement({ x: parseFloat(e.target.value) || 0 })
                }
                className="w-14 px-1.5 py-0.5 border border-[#E4E4E7] rounded text-center font-bold"
              />
              <span className="text-[#A1A1AA]">cm</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#71717A]">Y:</span>
              <input
                type="number"
                value={selectedElement.y}
                onChange={(e) =>
                  updateSelectedElement({ y: parseFloat(e.target.value) || 0 })
                }
                className="w-14 px-1.5 py-0.5 border border-[#E4E4E7] rounded text-center font-bold"
              />
              <span className="text-[#A1A1AA]">cm</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#71717A]">Width:</span>
              <span className="font-bold">
                {Math.round(selectedElement.width * selectedElement.scale)} cm
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#71717A]">Rot:</span>
              <span className="font-bold">{selectedElement.rotation}°</span>
            </div>

            {selectedElement.type === 'text' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[#71717A]">Text:</span>
                <input
                  type="text"
                  value={selectedElement.text || ''}
                  onChange={(e) => updateSelectedElement({ text: e.target.value })}
                  className="w-28 px-1.5 py-0.5 border border-[#E4E4E7] rounded font-bold"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
