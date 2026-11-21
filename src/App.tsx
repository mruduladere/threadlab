import React, { useState, useRef, useEffect } from 'react';
import { ProjectState, CameraPreset, GarmentType, PatternRegionId } from './types';
import { DEFAULT_PROJECT, PATTERN_PIECES_BY_GARMENT } from './constants/presets';
import { saveProjectToStorage } from './utils/storage';
import { TopNav } from './components/navigation/TopNav';
import { GarmentLibrary } from './components/sidebar/GarmentLibrary';
import { ThreeGarmentViewer, ViewportHandle } from './components/viewport/ThreeGarmentViewer';
import { PatternEditor2D } from './components/editor2d/PatternEditor2D';
import { PropertiesPanel } from './components/sidebar/PropertiesPanel';
import { BottomToolbar } from './components/toolbar/BottomToolbar';
import { ExportModal } from './components/modals/ExportModal';
import { ProjectModal } from './components/modals/ProjectModal';

export function App() {
  const [project, setProject] = useState<ProjectState>(DEFAULT_PROJECT);
  const [history, setHistory] = useState<ProjectState[]>([DEFAULT_PROJECT]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [activeCameraPreset, setActiveCameraPreset] = useState<CameraPreset>('front');

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Viewport Ref for export and camera triggers
  const viewportRef = useRef<ViewportHandle>(null);

  // Update project with undo/redo history tracking
  const handleUpdateProject = (updates: Partial<ProjectState>, recordHistory = true) => {
    setProject((prev) => {
      const updated = {
        ...prev,
        ...updates,
        updatedAt: Date.now(),
      };

      if (recordHistory) {
        const nextHistory = history.slice(0, historyIndex + 1);
        nextHistory.push(updated);
        if (nextHistory.length > 30) nextHistory.shift();
        setHistory(nextHistory);
        setHistoryIndex(nextHistory.length - 1);
      }

      return updated;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setProject(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setProject(history[nextIndex]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveProjectToStorage(project);
    setTimeout(() => {
      setIsSaving(false);
    }, 400);
  };

  const handleNewProject = () => {
    const newProj: ProjectState = {
      ...DEFAULT_PROJECT,
      id: 'project-' + Date.now(),
      name: 'UNTITLED MOCKUP',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProject(newProj);
    setHistory([newProj]);
    setHistoryIndex(0);
  };

  const handleLoadProject = (loaded: ProjectState) => {
    setProject(loaded);
    setHistory([loaded]);
    setHistoryIndex(0);
  };

  // Focus 3D camera to correspond with selected 2D pattern piece
  const handleFocusCameraToRegion = (regionId: PatternRegionId) => {
    const pieces =
      PATTERN_PIECES_BY_GARMENT[project.garment] || PATTERN_PIECES_BY_GARMENT['oversized-tee'];
    const piece = pieces.find((p) => p.id === regionId);
    if (piece && viewportRef.current) {
      setActiveCameraPreset(piece.cameraAngle);
      viewportRef.current.setCameraPreset(piece.cameraAngle);
    }
  };

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S, Delete, Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement).tagName;
      const isInput = targetTag === 'INPUT' || targetTag === 'TEXTAREA';

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (project.selectedElementId) {
          const selected = project.elements.find((el) => el.id === project.selectedElementId);
          if (selected) {
            const duplicated = {
              ...selected,
              id: 'element-' + Date.now(),
              name: selected.name + ' (Copy)',
              x: selected.x + 3,
              y: selected.y + 3,
              zIndex: project.elements.length + 1,
            };
            handleUpdateProject({
              elements: [...project.elements, duplicated],
              selectedElementId: duplicated.id,
            });
          }
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isInput && project.selectedElementId) {
          e.preventDefault();
          handleUpdateProject({
            elements: project.elements.filter((el) => el.id !== project.selectedElementId),
            selectedElementId: null,
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, project]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F6F6F7]">
      {/* 1. Top Navigation */}
      <TopNav
        project={project}
        onUpdateProject={(updates) => handleUpdateProject(updates, false)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onOpenProjectsModal={() => setIsProjectModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        isSaving={isSaving}
      />

      {/* 2. Main Studio Workspace (Left Sidebar + Center Workspaces + Right Sidebar) */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Garment Library */}
        <GarmentLibrary
          selectedGarment={project.garment}
          onSelectGarment={(garment: GarmentType) => handleUpdateProject({ garment })}
        />

        {/* Center Workspace Panels */}
        <section className="flex-1 h-full relative overflow-hidden flex">
          {/* A. 2D FLAT GARMENT EDITOR */}
          {(project.viewMode === 'split' || project.viewMode === '2d-only') && (
            <div
              className={`h-full relative overflow-hidden border-r border-[#E4E4E7] ${
                project.viewMode === 'split' ? 'w-1/2' : 'w-full'
              }`}
            >
              <PatternEditor2D
                project={project}
                onUpdateProject={handleUpdateProject}
                onFocusCameraToRegion={handleFocusCameraToRegion}
              />
            </div>
          )}

          {/* B. REAL-TIME 3D GARMENT PREVIEW */}
          {(project.viewMode === 'split' || project.viewMode === '3d-only') && (
            <div
              className={`h-full relative overflow-hidden flex flex-col ${
                project.viewMode === 'split' ? 'w-1/2' : 'w-full'
              }`}
            >
              <ThreeGarmentViewer
                ref={viewportRef}
                project={project}
                onUpdateProject={handleUpdateProject}
                activeCameraPreset={activeCameraPreset}
              />
            </div>
          )}
        </section>

        {/* Right Sidebar: Properties & Layer Manager */}
        <PropertiesPanel
          project={project}
          onUpdateProject={handleUpdateProject}
          onFocusCameraToRegion={handleFocusCameraToRegion}
        />
      </main>

      {/* 3. Bottom Toolbar */}
      <BottomToolbar
        activeCameraPreset={activeCameraPreset}
        onSelectCameraPreset={(preset) => {
          setActiveCameraPreset(preset);
          if (viewportRef.current) {
            viewportRef.current.setCameraPreset(preset);
          }
        }}
        onZoom={(delta) => {
          if (viewportRef.current) {
            viewportRef.current.zoom(delta);
          }
        }}
        autoRotate={project.autoRotate}
        onToggleAutoRotate={() =>
          handleUpdateProject({ autoRotate: !project.autoRotate }, false)
        }
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        viewportRef={viewportRef}
        project={project}
      />

      {/* Saved Projects Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onLoadProject={handleLoadProject}
        onNewProject={handleNewProject}
        currentProjectId={project.id}
      />
    </div>
  );
}

export default App;
