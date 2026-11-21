import React, { useRef } from 'react';
import { GarmentType, GarmentConfig } from '../../types';
import { GARMENTS } from '../../constants/presets';
import { Layers, Upload, Sparkles, Check, Info, ShieldCheck } from 'lucide-react';

interface Props {
  selectedGarment: GarmentType;
  onSelectGarment: (garment: GarmentType) => void;
  onCustomModelUpload?: (file: File) => void;
}

export const GarmentLibrary: React.FC<Props> = ({
  selectedGarment,
  onSelectGarment,
  onCustomModelUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onCustomModelUpload) {
      onCustomModelUpload(file);
    }
  };

  return (
    <aside className="w-72 bg-white border-r border-[#E4E4E7] flex flex-col h-full select-none shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#E4E4E7]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={15} className="text-[#09090B]" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#09090B]">
              Garment Library
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#71717A] bg-[#F4F4F6] px-1.5 py-0.5 rounded border border-[#E4E4E7]">
            {GARMENTS.length} PIECES
          </span>
        </div>
        <p className="text-[11px] text-[#71717A] mt-1 leading-relaxed">
          Select real 3D silhouettes with accurate fabric drape & UV unwrap.
        </p>
      </div>

      {/* Garment Cards */}
      <div className="p-3.5 space-y-2.5 flex-1">
        {GARMENTS.map((item) => {
          const isSelected = selectedGarment === item.id;

          return (
            <div
              key={item.id}
              onClick={() => onSelectGarment(item.id)}
              className={`group relative p-3 rounded-lg border transition-all cursor-pointer text-left ${
                isSelected
                  ? 'border-black bg-[#FBFBFC] shadow-subtle ring-1 ring-black'
                  : 'border-[#E4E4E7] bg-white hover:border-[#D4D4D8] hover:bg-[#FAFAFA]'
              }`}
            >
              {/* Card Header & Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-[#09090B] font-mono">
                      {item.name}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-[#71717A] font-mono mt-0.5 block">
                    {item.fit}
                  </span>
                </div>

                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold border ${
                    isSelected
                      ? 'bg-black text-white border-black'
                      : 'bg-[#F4F4F6] text-[#71717A] border-[#E4E4E7]'
                  }`}
                >
                  {item.badge}
                </span>
              </div>

              {/* Garment Specs Pill */}
              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[#F4F4F6]">
                <span className="text-[10px] font-mono font-medium text-[#09090B] bg-[#F4F4F6] px-1.5 py-0.5 rounded">
                  {item.gsm}
                </span>
                <span className="text-[10px] text-[#71717A] truncate font-sans">
                  {item.subtitle}
                </span>
              </div>

              {/* Realistic Status Indicator */}
              <div className="mt-2 text-[10px] text-[#71717A] flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                <span className="truncate">{item.notes}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom GLB Model Importer */}
      <div className="p-3.5 border-t border-[#E4E4E7] bg-[#FAFAFA]">
        <div className="p-3 bg-white rounded-lg border border-[#E4E4E7] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#09090B]">
            <Upload size={13} />
            <span>Import Custom .GLB</span>
          </div>
          <p className="text-[11px] text-[#71717A] leading-relaxed">
            Import your own 3D garment mesh exported from CLO3D or Blender.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-1.5 text-center text-xs font-mono font-medium text-[#09090B] border border-[#E4E4E7] rounded hover:bg-[#F4F4F6] transition-colors"
          >
            Select .GLB File
          </button>
        </div>
      </div>
    </aside>
  );
};
