import React from 'react';
import { CameraPreset } from '../../types';
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Eye,
  Camera,
} from 'lucide-react';

interface Props {
  activeCameraPreset: CameraPreset;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  onZoom: (delta: number) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onOpenExportModal: () => void;
}

export const BottomToolbar: React.FC<Props> = ({
  activeCameraPreset,
  onSelectCameraPreset,
  onZoom,
  autoRotate,
  onToggleAutoRotate,
  onOpenExportModal,
}) => {
  const cameraAngles: Array<{ id: CameraPreset; label: string }> = [
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
    { id: 'left', label: 'Left Side' },
    { id: 'right', label: 'Right Side' },
    { id: 'three-quarter', label: '3/4 Angle' },
  ];

  return (
    <footer className="h-12 border-t border-[#E4E4E7] bg-white flex items-center justify-between px-5 select-none z-30 shrink-0">
      {/* Left: Camera View Angles */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-[#71717A] uppercase mr-1">
          Camera:
        </span>
        {cameraAngles.map((angle) => {
          const isActive = activeCameraPreset === angle.id;

          return (
            <button
              key={angle.id}
              onClick={() => onSelectCameraPreset(angle.id)}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                isActive
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F6]'
              }`}
            >
              {angle.label}
            </button>
          );
        })}
      </div>

      {/* Center: 360 Turntable & Zoom Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleAutoRotate}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium border transition-all ${
            autoRotate
              ? 'bg-black text-white border-black'
              : 'bg-white text-[#09090B] border-[#E4E4E7] hover:bg-[#F4F4F6]'
          }`}
        >
          <RotateCw size={13} className={autoRotate ? 'animate-spin' : ''} />
          <span>360° View</span>
        </button>

        <div className="h-4 w-[1px] bg-[#E4E4E7]" />

        <div className="flex items-center border border-[#E4E4E7] rounded bg-white">
          <button
            onClick={() => onZoom(-1)}
            title="Zoom Out"
            className="p-1.5 text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F6] rounded-l transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <div className="h-3 w-[1px] bg-[#E4E4E7]" />
          <button
            onClick={() => onZoom(1)}
            title="Zoom In"
            className="p-1.5 text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F6] rounded-r transition-colors"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Right: Quick Snap Export */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold bg-[#F4F4F6] hover:bg-[#E4E4E7] text-[#09090B] rounded border border-[#E4E4E7] transition-colors"
        >
          <Camera size={13} />
          <span>Quick Capture</span>
        </button>
      </div>
    </footer>
  );
};
