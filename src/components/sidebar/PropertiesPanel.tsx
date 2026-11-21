import React, { useRef, useState } from 'react';
import {
  ProjectState,
  DesignElement,
  FabricMaterial,
  StudioLighting,
  PrintFinish,
  PatternRegionId,
} from '../../types';
import {
  COLOR_PALETTE,
  FABRICS,
  LIGHTING_PRESETS,
  PRINT_FINISHES,
  PATTERN_PIECES_BY_GARMENT,
} from '../../constants/presets';
import {
  Palette,
  Image as ImageIcon,
  Sliders,
  SunMedium,
  Upload,
  Trash2,
  Lock,
  Unlock,
  Layers,
  Sparkles,
  Type,
  Printer,
  Ruler,
} from 'lucide-react';

interface Props {
  project: ProjectState;
  onUpdateProject: (updates: Partial<ProjectState>) => void;
  onFocusCameraToRegion: (regionId: PatternRegionId) => void;
}

export const PropertiesPanel: React.FC<Props> = ({
  project,
  onUpdateProject,
  onFocusCameraToRegion,
}) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'color' | 'fabric' | 'studio'>('layers');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pieces =
    PATTERN_PIECES_BY_GARMENT[project.garment] || PATTERN_PIECES_BY_GARMENT['oversized-tee'];
  const activePiece =
    pieces.find((p) => p.id === project.activeRegion) || pieces[0];

  const selectedElement = project.elements.find(
    (el) => el.id === project.selectedElementId
  );

  const regionElements = project.elements
    .filter((el) => el.regionId === project.activeRegion)
    .sort((a, b) => b.zIndex - a.zIndex);

  const updateSelectedElement = (updates: Partial<DesignElement>) => {
    if (!selectedElement) return;
    onUpdateProject({
      elements: project.elements.map((el) =>
        el.id === selectedElement.id ? { ...el, ...updates } : el
      ),
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        let wCm = 24;
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

  const loadDemoArtwork = (url: string, name: string) => {
    const newElement: DesignElement = {
      id: 'demo-' + Date.now(),
      regionId: project.activeRegion,
      type: 'image',
      name,
      dataUrl: url,
      x: 0,
      y: 0,
      width: 24,
      height: 24,
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

  return (
    <aside className="w-80 bg-white border-l border-[#E4E4E7] flex flex-col h-full select-none shrink-0 overflow-hidden">
      {/* Tab Navigation */}
      <div className="grid grid-cols-4 border-b border-[#E4E4E7] bg-[#FAFAFA] p-1 gap-1">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex flex-col items-center py-2 rounded text-[11px] font-medium transition-all ${
            activeTab === 'layers'
              ? 'bg-white text-[#09090B] shadow-subtle border border-[#E4E4E7] font-semibold'
              : 'text-[#71717A] hover:text-[#09090B]'
          }`}
        >
          <Layers size={14} className="mb-0.5" />
          <span>Layers</span>
        </button>

        <button
          onClick={() => setActiveTab('color')}
          className={`flex flex-col items-center py-2 rounded text-[11px] font-medium transition-all ${
            activeTab === 'color'
              ? 'bg-white text-[#09090B] shadow-subtle border border-[#E4E4E7] font-semibold'
              : 'text-[#71717A] hover:text-[#09090B]'
          }`}
        >
          <Palette size={14} className="mb-0.5" />
          <span>Color</span>
        </button>

        <button
          onClick={() => setActiveTab('fabric')}
          className={`flex flex-col items-center py-2 rounded text-[11px] font-medium transition-all ${
            activeTab === 'fabric'
              ? 'bg-white text-[#09090B] shadow-subtle border border-[#E4E4E7] font-semibold'
              : 'text-[#71717A] hover:text-[#09090B]'
          }`}
        >
          <Sliders size={14} className="mb-0.5" />
          <span>Fabric</span>
        </button>

        <button
          onClick={() => setActiveTab('studio')}
          className={`flex flex-col items-center py-2 rounded text-[11px] font-medium transition-all ${
            activeTab === 'studio'
              ? 'bg-white text-[#09090B] shadow-subtle border border-[#E4E4E7] font-semibold'
              : 'text-[#71717A] hover:text-[#09090B]'
          }`}
        >
          <SunMedium size={14} className="mb-0.5" />
          <span>Studio</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* TAB 1: LAYERS & PRINT ELEMENTS */}
        {activeTab === 'layers' && (
          <div className="space-y-4">
            {/* Active Pattern Region Banner with Calibrated CM Dimensions */}
            <div className="p-3 bg-[#FBFBFC] rounded-xl border border-[#E4E4E7] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#71717A] uppercase block">
                  Active Piece ({activePiece.widthCm}×{activePiece.heightCm} CM)
                </span>
                <span className="font-mono text-xs font-bold text-[#09090B]">
                  {activePiece.name}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white rounded font-semibold">
                {regionElements.length} LAYER{regionElements.length !== 1 ? 'S' : ''}
              </span>
            </div>

            {/* Selected Element Inspector */}
            {selectedElement ? (
              <div className="p-3.5 bg-[#FAFAFA] rounded-xl border border-[#E4E4E7] space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-[#09090B] uppercase">
                    Element Properties
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        updateSelectedElement({ locked: !selectedElement.locked })
                      }
                      title={selectedElement.locked ? 'Unlock' : 'Lock'}
                      className="p-1 rounded text-[#71717A] hover:text-[#09090B] hover:bg-[#E4E4E7]"
                    >
                      {selectedElement.locked ? <Lock size={13} /> : <Unlock size={13} />}
                    </button>
                    <button
                      onClick={() => {
                        onUpdateProject({
                          elements: project.elements.filter(
                            (el) => el.id !== selectedElement.id
                          ),
                          selectedElementId: null,
                        });
                      }}
                      title="Delete Element"
                      className="p-1 rounded text-[#71717A] hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {selectedElement.type === 'text' && (
                  <div className="space-y-2 pt-1 border-t border-[#E4E4E7]">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#71717A] uppercase">
                        Typography Content
                      </label>
                      <input
                        type="text"
                        value={selectedElement.text || ''}
                        onChange={(e) => updateSelectedElement({ text: e.target.value })}
                        className="w-full font-mono text-xs font-semibold px-2.5 py-1.5 border border-[#E4E4E7] rounded outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#71717A] uppercase">
                          Font Size
                        </label>
                        <input
                          type="number"
                          min="12"
                          max="96"
                          value={selectedElement.fontSize || 28}
                          onChange={(e) =>
                            updateSelectedElement({
                              fontSize: parseInt(e.target.value) || 28,
                            })
                          }
                          className="w-full font-mono text-xs px-2 py-1 border border-[#E4E4E7] rounded"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#71717A] uppercase">
                          Ink Color
                        </label>
                        <input
                          type="color"
                          value={selectedElement.color || '#FFFFFF'}
                          onChange={(e) =>
                            updateSelectedElement({ color: e.target.value })
                          }
                          className="w-full h-7 p-0.5 border border-[#E4E4E7] rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Transform Sliders in Centimetres */}
                <div className="space-y-3 pt-1 border-t border-[#E4E4E7]">
                  {/* Size Scale */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-[#71717A]">Print Size (Scale)</span>
                      <span className="font-semibold text-[#09090B]">
                        {Math.round(selectedElement.scale * 100)}% (
                        {Math.round(selectedElement.width * selectedElement.scale)} cm)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.05"
                      value={selectedElement.scale}
                      onChange={(e) =>
                        updateSelectedElement({ scale: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Horizontal X in CM */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-[#71717A]">Horizontal X</span>
                      <span className="font-semibold text-[#09090B]">
                        {selectedElement.x > 0 ? `+${selectedElement.x}` : selectedElement.x} cm
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-Math.round(activePiece.widthCm / 2) + 2}
                      max={Math.round(activePiece.widthCm / 2) - 2}
                      step="1"
                      value={selectedElement.x}
                      onChange={(e) =>
                        updateSelectedElement({ x: parseInt(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Vertical Y in CM */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-[#71717A]">Vertical Y</span>
                      <span className="font-semibold text-[#09090B]">
                        {selectedElement.y > 0 ? `+${selectedElement.y}` : selectedElement.y} cm
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-Math.round(activePiece.heightCm / 2) + 2}
                      max={Math.round(activePiece.heightCm / 2) - 2}
                      step="1"
                      value={selectedElement.y}
                      onChange={(e) =>
                        updateSelectedElement({ y: parseInt(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Rotation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-[#71717A]">Rotation</span>
                      <span className="font-semibold text-[#09090B]">
                        {selectedElement.rotation}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={selectedElement.rotation}
                      onChange={(e) =>
                        updateSelectedElement({ rotation: parseInt(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Opacity */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-[#71717A]">Ink Opacity</span>
                      <span className="font-semibold text-[#09090B]">
                        {Math.round(selectedElement.opacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={selectedElement.opacity}
                      onChange={(e) =>
                        updateSelectedElement({ opacity: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-dashed border-[#D4D4D8] rounded-xl text-center text-xs font-mono text-[#71717A]">
                Click any graphic on the pattern piece to inspect and transform it.
              </div>
            )}

            {/* Region Elements List */}
            <div className="space-y-2 pt-1 border-t border-[#E4E4E7]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#09090B] uppercase">
                  Piece Layers
                </span>
                <span className="text-[10px] font-mono text-[#71717A]">
                  {regionElements.length} on {activePiece.shortCode}
                </span>
              </div>

              {regionElements.length === 0 ? (
                <div className="p-3 bg-[#FAFAFA] rounded-lg text-center text-[11px] font-mono text-[#71717A]">
                  No elements on {activePiece.name} yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {regionElements.map((el) => {
                    const isSelected = el.id === project.selectedElementId;
                    return (
                      <div
                        key={el.id}
                        onClick={() =>
                          onUpdateProject({ selectedElementId: el.id })
                        }
                        className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-black bg-white ring-1 ring-black shadow-subtle'
                            : 'border-[#E4E4E7] bg-[#FAFAFA] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {el.type === 'image' ? (
                            <ImageIcon size={13} className="text-[#71717A]" />
                          ) : (
                            <Type size={13} className="text-[#71717A]" />
                          )}
                          <span className="text-xs font-mono font-medium text-[#09090B] truncate max-w-[130px]">
                            {el.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {el.locked && (
                            <Lock size={11} className="text-[#A1A1AA]" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateProject({
                                elements: project.elements.filter(
                                  (item) => item.id !== el.id
                                ),
                                selectedElementId:
                                  project.selectedElementId === el.id
                                    ? null
                                    : project.selectedElementId,
                              });
                            }}
                            className="p-1 hover:text-red-600 rounded text-[#A1A1AA]"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Print Finish Selector */}
            <div className="space-y-2 pt-2 border-t border-[#E4E4E7]">
              <div className="flex items-center gap-1.5">
                <Printer size={13} className="text-[#09090B]" />
                <span className="text-xs font-mono font-bold text-[#09090B] uppercase">
                  Print Finish
                </span>
              </div>
              <div className="space-y-1.5">
                {PRINT_FINISHES.map((finish) => {
                  const isSelected = project.printFinish === finish.id;
                  return (
                    <div
                      key={finish.id}
                      onClick={() =>
                        onUpdateProject({ printFinish: finish.id as PrintFinish })
                      }
                      className={`p-2.5 rounded-lg border cursor-pointer text-xs font-mono transition-all ${
                        isSelected
                          ? 'border-black bg-[#FBFBFC] ring-1 ring-black font-semibold'
                          : 'border-[#E4E4E7] bg-white hover:border-[#D4D4D8]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[#09090B]">{finish.name}</span>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-black" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#71717A] mt-0.5 font-sans">
                        {finish.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Demo Artworks */}
            <div className="space-y-2 pt-2 border-t border-[#E4E4E7]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#09090B] uppercase">
                  Sample Graphics
                </span>
                <span className="text-[10px] font-mono text-[#71717A]">1-CLICK ADD</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() =>
                    loadDemoArtwork(
                      '/artwork/threadlab_white.svg',
                      'Emblem White'
                    )
                  }
                  className="p-2 border border-[#E4E4E7] rounded-lg bg-[#111112] hover:ring-2 hover:ring-black flex flex-col items-center justify-center gap-1"
                >
                  <img
                    src="/artwork/threadlab_white.svg"
                    alt="White Emblem"
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-[9px] font-mono text-zinc-300">Emblem Wht</span>
                </button>

                <button
                  onClick={() =>
                    loadDemoArtwork(
                      '/artwork/threadlab_black.svg',
                      'Emblem Black'
                    )
                  }
                  className="p-2 border border-[#E4E4E7] rounded-lg bg-zinc-100 hover:ring-2 hover:ring-black flex flex-col items-center justify-center gap-1"
                >
                  <img
                    src="/artwork/threadlab_black.svg"
                    alt="Black Emblem"
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-[9px] font-mono text-zinc-700">Emblem Blk</span>
                </button>

                <button
                  onClick={() =>
                    loadDemoArtwork('/artwork/tokyo_cyber.svg', 'Neo Tokyo')
                  }
                  className="p-2 border border-[#E4E4E7] rounded-lg bg-zinc-900 hover:ring-2 hover:ring-black flex flex-col items-center justify-center gap-1"
                >
                  <img
                    src="/artwork/tokyo_cyber.svg"
                    alt="Cyber Tokyo"
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-[9px] font-mono text-pink-400">Neo Tokyo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GARMENT COLOR */}
        {activeTab === 'color' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono font-bold text-[#09090B] uppercase block">
                Streetwear Color Palette
              </span>
              <p className="text-[11px] text-[#71717A] mt-0.5">
                Curated heavy-dye shades designed for premium garment blanks.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {COLOR_PALETTE.map((color) => {
                const isSelected =
                  project.garmentColor.toLowerCase() === color.hex.toLowerCase();

                return (
                  <button
                    key={color.hex}
                    onClick={() => onUpdateProject({ garmentColor: color.hex })}
                    className="group flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-[#F4F4F6] transition-all"
                  >
                    <div
                      className={`w-11 h-11 rounded-lg border transition-all ${
                        isSelected
                          ? 'ring-2 ring-black ring-offset-2 scale-105 border-black shadow-card'
                          : 'border-black/10 group-hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[9px] font-mono text-[#71717A] text-center truncate max-w-full">
                      {color.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#E4E4E7] space-y-2">
              <span className="text-[11px] font-mono font-semibold text-[#09090B] uppercase block">
                Custom Color Picker
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={project.garmentColor}
                  onChange={(e) => onUpdateProject({ garmentColor: e.target.value })}
                  className="w-9 h-9 p-0.5 border border-[#E4E4E7] rounded cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={project.garmentColor.toUpperCase()}
                  onChange={(e) => onUpdateProject({ garmentColor: e.target.value })}
                  className="flex-1 font-mono text-xs font-semibold px-2.5 py-1.5 border border-[#E4E4E7] rounded outline-none uppercase"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FABRIC MATERIAL */}
        {activeTab === 'fabric' && (
          <div className="space-y-3.5">
            <div>
              <span className="text-xs font-mono font-bold text-[#09090B] uppercase block">
                Fabric Material & Weave
              </span>
              <p className="text-[11px] text-[#71717A] mt-0.5">
                Simulates real fabric roughness, knit luster and micro-shadows.
              </p>
            </div>

            <div className="space-y-2">
              {FABRICS.map((fabric) => {
                const isSelected = project.fabric === fabric.id;

                return (
                  <div
                    key={fabric.id}
                    onClick={() =>
                      onUpdateProject({
                        fabric: fabric.id,
                        roughness: fabric.roughness,
                      })
                    }
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-black bg-[#FBFBFC] shadow-subtle ring-1 ring-black'
                        : 'border-[#E4E4E7] bg-white hover:border-[#D4D4D8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#09090B]">
                        {fabric.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4F4F6] border border-[#E4E4E7] text-[#09090B]">
                        {fabric.weight}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#71717A] mt-1 font-sans">
                      {fabric.description}
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-[#A1A1AA] flex items-center justify-between">
                      <span>{fabric.weaveDetail}</span>
                      <span>Roughness: {fabric.roughness}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: STUDIO LIGHTING */}
        {activeTab === 'studio' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono font-bold text-[#09090B] uppercase block">
                Studio Lighting Presets
              </span>
              <p className="text-[11px] text-[#71717A] mt-0.5">
                High-end fashion photography lighting rigs.
              </p>
            </div>

            <div className="space-y-2">
              {LIGHTING_PRESETS.map((light) => {
                const isSelected = project.lighting === light.id;

                return (
                  <div
                    key={light.id}
                    onClick={() => onUpdateProject({ lighting: light.id })}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-black bg-[#FBFBFC] shadow-subtle ring-1 ring-black'
                        : 'border-[#E4E4E7] bg-white hover:border-[#D4D4D8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#09090B]">
                        {light.name}
                      </span>
                      <span className="text-[10px] font-mono text-[#71717A]">
                        {light.mainLightIntensity}x KEY
                      </span>
                    </div>
                    <p className="text-[11px] text-[#71717A] mt-1 font-sans">
                      {light.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Studio Backdrop */}
            <div className="pt-3 border-t border-[#E4E4E7] space-y-2">
              <span className="text-[11px] font-mono font-semibold text-[#09090B] uppercase block">
                Viewport Backdrop
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: 'Studio Grey', hex: '#F6F6F7' },
                  { name: 'Pure White', hex: '#FFFFFF' },
                  { name: 'Darkroom', hex: '#121214' },
                  { name: 'Concrete', hex: '#E4E4E7' },
                ].map((bg) => (
                  <button
                    key={bg.hex}
                    onClick={() => onUpdateProject({ backgroundColor: bg.hex })}
                    className={`py-1.5 px-2 text-[10px] font-mono border rounded transition-all ${
                      project.backgroundColor === bg.hex
                        ? 'border-black font-semibold bg-zinc-200'
                        : 'border-[#E4E4E7] bg-white text-[#71717A]'
                    }`}
                  >
                    {bg.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
