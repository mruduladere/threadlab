import React, { useState } from 'react';
import { ViewportHandle } from '../viewport/ThreeGarmentViewer';
import { ProjectState } from '../../types';
import {
  X,
  Download,
  Image as ImageIcon,
  Check,
  Layers,
  Sparkles,
  Grid,
  FileCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  viewportRef: React.RefObject<ViewportHandle>;
  project: ProjectState;
}

export const ExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  viewportRef,
  project,
}) => {
  const [exportType, setExportType] = useState<
    '3d-mockup' | 'flat-pattern' | 'texture-atlas'
  >('3d-mockup');

  const [resolution, setResolution] = useState<{
    label: string;
    width: number;
    height: number;
  }>({
    label: '2K Quad HD (2048 × 2048)',
    width: 2048,
    height: 2048,
  });

  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [transparent, setTransparent] = useState<boolean>(true);
  const [viewAngle, setViewAngle] = useState<'current' | 'front' | 'back'>(
    'current'
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const resolutionPresets = [
    { label: 'Square Lookbook (1080 × 1080)', width: 1080, height: 1080 },
    { label: '2K Quad HD (2048 × 2048)', width: 2048, height: 2048 },
    { label: '4K Ultra HD (3840 × 3840)', width: 3840, height: 3840 },
    { label: 'Story / E-com Banner (1080 × 1920)', width: 1080, height: 1920 },
  ];

  const handleGeneratePreview = async () => {
    if (!viewportRef.current) return;
    setIsExporting(true);
    try {
      if (exportType === 'texture-atlas') {
        const atlasUrl = viewportRef.current.getTextureAtlasDataUrl();
        setPreviewDataUrl(atlasUrl);
      } else {
        if (viewAngle === 'front') {
          viewportRef.current.setCameraPreset('front');
          await new Promise((r) => setTimeout(r, 650));
        } else if (viewAngle === 'back') {
          viewportRef.current.setCameraPreset('back');
          await new Promise((r) => setTimeout(r, 650));
        }

        const dataUrl = await viewportRef.current.captureMockup({
          width: 600,
          height: 600,
          transparent,
          format,
        });
        setPreviewDataUrl(dataUrl);
      }
    } catch (e) {
      console.error('Failed to generate preview:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    if (!viewportRef.current) return;
    setIsExporting(true);
    try {
      let dataUrl = '';
      let filename = '';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      if (exportType === 'texture-atlas') {
        dataUrl = viewportRef.current.getTextureAtlasDataUrl();
        filename = `${project.name.toLowerCase().replace(/\s+/g, '_')}_uv_texture_atlas_2048x2048_${timestamp}.png`;
      } else {
        if (viewAngle === 'front') {
          viewportRef.current.setCameraPreset('front');
          await new Promise((r) => setTimeout(r, 650));
        } else if (viewAngle === 'back') {
          viewportRef.current.setCameraPreset('back');
          await new Promise((r) => setTimeout(r, 650));
        }

        dataUrl = await viewportRef.current.captureMockup({
          width: resolution.width,
          height: resolution.height,
          transparent,
          format,
        });
        filename = `${project.name.toLowerCase().replace(/\s+/g, '_')}_3d_${project.garment}_${viewAngle}_${timestamp}.${format}`;
      }

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onClose();
    } catch (e) {
      console.error('Export download failed:', e);
      alert('Mockup export failed. Please check permissions.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl border border-[#E4E4E7] shadow-float w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-mono font-bold text-xs">
              HD
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-[#09090B] uppercase tracking-wider">
                Export Apparel Design
              </h3>
              <p className="text-xs text-[#71717A]">
                High-resolution 3D mockup, flat pattern layout, or UV texture atlas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#E4E4E7] text-[#71717A] hover:text-[#09090B] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Export Target Type Selector */}
        <div className="px-6 pt-4 pb-2 border-b border-[#E4E4E7] bg-white">
          <div className="flex items-center gap-2">
            {[
              { id: '3d-mockup', label: '3D Studio Mockup', icon: Sparkles },
              { id: 'texture-atlas', label: 'UV Texture Atlas (2048²)', icon: Grid },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setExportType(item.id as any);
                  setPreviewDataUrl(null);
                }}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all ${
                  exportType === item.id
                    ? 'border-black bg-black text-white shadow-subtle'
                    : 'border-[#E4E4E7] bg-[#FAFAFA] text-[#71717A] hover:text-[#09090B]'
                }`}
              >
                <item.icon size={14} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Options Column */}
          <div className="space-y-4">
            {exportType === '3d-mockup' ? (
              <>
                {/* View Angle Preset */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold text-[#09090B] uppercase">
                    Camera Angle
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'current', label: 'Current' },
                      { id: 'front', label: 'Front' },
                      { id: 'back', label: 'Back' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setViewAngle(item.id as any)}
                        className={`py-1.5 px-2 text-xs font-mono rounded border transition-all ${
                          viewAngle === item.id
                            ? 'border-black bg-black text-white font-semibold'
                            : 'border-[#E4E4E7] bg-white text-[#71717A] hover:text-[#09090B]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold text-[#09090B] uppercase">
                    Resolution Output
                  </label>
                  <div className="space-y-1">
                    {resolutionPresets.map((preset) => {
                      const isSelected =
                        resolution.width === preset.width &&
                        resolution.height === preset.height;
                      return (
                        <div
                          key={preset.label}
                          onClick={() => setResolution(preset)}
                          className={`p-2 rounded-lg border text-xs font-mono cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-black bg-[#FBFBFC] ring-1 ring-black font-semibold'
                              : 'border-[#E4E4E7] hover:border-[#D4D4D8]'
                          }`}
                        >
                          <span className="text-[#09090B]">{preset.label}</span>
                          {isSelected && <Check size={14} className="text-black" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Format & Background */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E4E4E7]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-semibold text-[#09090B] uppercase">
                      Format
                    </label>
                    <div className="flex border border-[#E4E4E7] rounded overflow-hidden">
                      <button
                        onClick={() => setFormat('png')}
                        className={`flex-1 py-1.5 text-xs font-mono font-medium ${
                          format === 'png' ? 'bg-black text-white' : 'bg-white text-[#71717A]'
                        }`}
                      >
                        PNG
                      </button>
                      <button
                        onClick={() => {
                          setFormat('jpeg');
                          setTransparent(false);
                        }}
                        className={`flex-1 py-1.5 text-xs font-mono font-medium ${
                          format === 'jpeg' ? 'bg-black text-white' : 'bg-white text-[#71717A]'
                        }`}
                      >
                        JPEG
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-semibold text-[#09090B] uppercase">
                      Alpha Background
                    </label>
                    <button
                      disabled={format === 'jpeg'}
                      onClick={() => setTransparent(!transparent)}
                      className={`w-full py-1.5 text-xs font-mono font-medium rounded border transition-all ${
                        transparent && format === 'png'
                          ? 'border-black bg-zinc-100 text-[#09090B] font-semibold'
                          : 'border-[#E4E4E7] bg-white text-[#71717A]'
                      } ${format === 'jpeg' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {transparent && format === 'png' ? 'Transparent' : 'Solid BG'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Texture Atlas Info */
              <div className="space-y-3 py-2">
                <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E4E4E7] space-y-2 text-xs font-mono">
                  <div className="font-bold text-[#09090B]">UV Texture Atlas Export</div>
                  <p className="text-[#71717A] text-[11px] leading-relaxed font-sans">
                    Exports the full uncompressed 2048 × 2048 PNG texture atlas covering all 5
                    garment regions (Front, Back, Sleeves, Collar) with fabric grain and artwork
                    composited for direct apparel sublimation and CLO3D/Blender import.
                  </p>
                  <div className="pt-2 border-t border-[#E4E4E7] flex justify-between text-[11px]">
                    <span className="text-[#71717A]">Dimensions:</span>
                    <span className="font-bold">2048 × 2048 PX</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#71717A]">Active Elements:</span>
                    <span className="font-bold">{project.elements.length} Graphics</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Snapshot Column */}
          <div className="flex flex-col justify-between bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-[#09090B] uppercase">
                  Render Preview
                </span>
                <button
                  onClick={handleGeneratePreview}
                  disabled={isExporting}
                  className="text-[10px] font-mono text-[#09090B] hover:underline"
                >
                  Refresh Preview
                </button>
              </div>

              <div className="h-52 bg-white rounded-lg border border-[#E4E4E7] studio-grid-bg flex items-center justify-center overflow-hidden relative">
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Export preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon size={28} className="mx-auto text-[#A1A1AA] mb-1" />
                    <span className="text-xs text-[#71717A] font-mono block">
                      Click Download or Refresh to preview
                    </span>
                  </div>
                )}

                {isExporting && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E4E4E7] text-[10px] font-mono text-[#71717A] space-y-1">
              <div className="flex justify-between">
                <span>Output Dimension:</span>
                <span className="text-[#09090B] font-semibold">
                  {exportType === 'texture-atlas'
                    ? '2048 × 2048 PX'
                    : `${resolution.width} × ${resolution.height} PX`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Render Pipeline:</span>
                <span className="text-[#09090B] font-semibold">
                  Three.js WebGL & 2D Pattern Canvas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between">
          <span className="text-[11px] text-[#71717A] font-mono">
            Zero cloud backend (₹0 free client export)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono font-medium text-[#71717A] hover:text-[#09090B] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-black text-white text-xs font-mono font-bold hover:bg-[#27272A] transition-all shadow-subtle disabled:opacity-50"
            >
              <Download size={14} />
              <span>{isExporting ? 'Generating...' : 'Download File'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
