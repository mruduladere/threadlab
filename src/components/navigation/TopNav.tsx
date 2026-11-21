import React, { useState } from 'react';
import { ProjectState } from '../../types';
import {
  Undo2,
  Redo2,
  Save,
  Download,
  FolderOpen,
  Edit2,
  Check,
  Columns,
  Square,
  Box,
} from 'lucide-react';

interface Props {
  project: ProjectState;
  onUpdateProject: (updates: Partial<ProjectState>) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onOpenProjectsModal: () => void;
  onOpenExportModal: () => void;
  isSaving: boolean;
}

export const TopNav: React.FC<Props> = ({
  project,
  onUpdateProject,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onOpenProjectsModal,
  onOpenExportModal,
  isSaving,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(project.name);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onUpdateProject({ name: tempTitle.trim() });
    } else {
      setTempTitle(project.name);
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 border-b border-[#E4E4E7] bg-white flex items-center justify-between px-5 select-none z-30 shrink-0">
      {/* Left: Brand Wordmark & Editable Title */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-black text-white flex items-center justify-center rounded-sm font-black text-sm tracking-tighter">
            TL
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[15px] tracking-[0.22em] text-[#09090B] font-mono leading-none">
              THREADLAB
            </span>
            <span className="text-[9px] font-mono tracking-widest text-[#71717A] mt-0.5">
              2D PATTERN & 3D STUDIO
            </span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-[#E4E4E7]" />

        {/* Project Name editable */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setTempTitle(project.name);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="font-mono text-xs font-semibold px-2 py-1 border border-black rounded outline-none w-52 text-[#09090B]"
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 hover:bg-[#F4F4F6] rounded text-emerald-600"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTempTitle(project.name);
                setIsEditingTitle(true);
              }}
              className="group flex items-center gap-1.5 font-mono text-xs font-semibold text-[#09090B] hover:text-black py-1 px-2 rounded hover:bg-[#F4F4F6] transition-colors"
            >
              <span>{project.name}</span>
              <Edit2
                size={11}
                className="text-[#A1A1AA] group-hover:text-[#09090B] transition-colors"
              />
            </button>
          )}

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F4F4F6] text-[#71717A] border border-[#E4E4E7]">
            LIVE SYNC
          </span>
        </div>
      </div>

      {/* Center: Workspace View Switcher (2D | Split | 3D) & History */}
      <div className="flex items-center gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#F4F4F6] p-1 rounded-lg border border-[#E4E4E7]">
          <button
            onClick={() => onUpdateProject({ viewMode: '2d-only' })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
              project.viewMode === '2d-only'
                ? 'bg-white text-[#09090B] shadow-subtle font-semibold'
                : 'text-[#71717A] hover:text-[#09090B]'
            }`}
          >
            <Square size={13} />
            <span>2D Pattern</span>
          </button>

          <button
            onClick={() => onUpdateProject({ viewMode: 'split' })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
              project.viewMode === 'split'
                ? 'bg-white text-[#09090B] shadow-subtle font-semibold'
                : 'text-[#71717A] hover:text-[#09090B]'
            }`}
          >
            <Columns size={13} />
            <span>2D + 3D Split</span>
          </button>

          <button
            onClick={() => onUpdateProject({ viewMode: '3d-only' })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
              project.viewMode === '3d-only'
                ? 'bg-white text-[#09090B] shadow-subtle font-semibold'
                : 'text-[#71717A] hover:text-[#09090B]'
            }`}
          >
            <Box size={13} />
            <span>3D Viewport</span>
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[#E4E4E7]" />

        {/* History Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`p-1.5 rounded hover:bg-[#F4F4F6] text-[#09090B] transition-colors ${
              !canUndo ? 'opacity-35 cursor-not-allowed' : ''
            }`}
          >
            <Undo2 size={15} />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={`p-1.5 rounded hover:bg-[#F4F4F6] text-[#09090B] transition-colors ${
              !canRedo ? 'opacity-35 cursor-not-allowed' : ''
            }`}
          >
            <Redo2 size={15} />
          </button>
        </div>
      </div>

      {/* Right: Projects, Save & Export */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenProjectsModal}
          title="Open Saved Projects"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F6] rounded transition-colors"
        >
          <FolderOpen size={14} />
          <span>Projects</span>
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-medium border border-[#E4E4E7] bg-white text-[#09090B] hover:bg-[#F4F4F6] transition-all shadow-subtle"
        >
          <Save size={14} className={isSaving ? 'animate-pulse text-emerald-600' : ''} />
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-2 px-4 py-1.5 rounded text-xs font-semibold bg-black text-white hover:bg-[#27272A] transition-all shadow-subtle group"
        >
          <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
          <span>Export Mockup</span>
        </button>
      </div>
    </header>
  );
};
