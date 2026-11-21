import React, { useEffect, useState } from 'react';
import { ProjectState } from '../../types';
import {
  loadProjectsList,
  loadProjectById,
  deleteProjectFromStorage,
} from '../../utils/storage';
import {
  X,
  Plus,
  FolderOpen,
  Trash2,
  Clock,
  Shirt,
  Sparkles,
  FileCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (project: ProjectState) => void;
  onNewProject: () => void;
  currentProjectId: string;
}

export const ProjectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onLoadProject,
  onNewProject,
  currentProjectId,
}) => {
  const [projectsList, setProjectsList] = useState<
    Array<{ id: string; name: string; updatedAt: number; garment: string }>
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen]);

  const loadList = async () => {
    setIsLoading(true);
    const list = await loadProjectsList();
    setProjectsList(list);
    setIsLoading(false);
  };

  const handleSelectProject = async (id: string) => {
    const proj = await loadProjectById(id);
    if (proj) {
      onLoadProject(proj);
      onClose();
    } else {
      alert('Could not load project data.');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this saved project?')) {
      await deleteProjectFromStorage(id);
      loadList();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl border border-[#E4E4E7] shadow-float w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <FolderOpen size={18} className="text-[#09090B]" />
            <div>
              <h3 className="font-mono text-sm font-bold text-[#09090B] uppercase tracking-wider">
                Saved Projects
              </h3>
              <p className="text-xs text-[#71717A]">
                Locally saved designs stored in IndexedDB browser storage.
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

        {/* Action bar: New Project */}
        <div className="p-4 border-b border-[#E4E4E7] bg-white flex justify-between items-center">
          <span className="text-xs font-mono text-[#71717A]">
            {projectsList.length} saved project{projectsList.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => {
              onNewProject();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-xs font-mono font-medium hover:bg-[#27272A] transition-colors shadow-subtle"
          >
            <Plus size={14} />
            <span>New Design Project</span>
          </button>
        </div>

        {/* Project List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="py-12 text-center text-xs font-mono text-[#71717A]">
              Loading saved projects...
            </div>
          ) : projectsList.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[#71717A] space-y-2">
              <Shirt size={28} className="mx-auto text-[#D4D4D8]" />
              <p>No saved projects yet. Click "Save" in the top bar to save your design.</p>
            </div>
          ) : (
            projectsList.map((item) => {
              const isCurrent = item.id === currentProjectId;
              const dateStr = new Date(item.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectProject(item.id)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isCurrent
                      ? 'border-black bg-[#FBFBFC] ring-1 ring-black'
                      : 'border-[#E4E4E7] hover:border-[#D4D4D8] hover:bg-[#FAFAFA]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F4F4F6] border border-[#E4E4E7] flex items-center justify-center text-[#09090B]">
                      <Shirt size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#09090B]">
                          {item.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-mono bg-black text-white px-1.5 py-0.2 rounded uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-[#71717A]">
                        <span className="capitalize">{item.garment.replace('-', ' ')}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {dateStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-2 rounded-lg text-[#71717A] hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
