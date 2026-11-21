import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ProjectState, CameraPreset } from '../../types';
import { FABRICS, LIGHTING_PRESETS, GARMENTS, PRINT_FINISHES } from '../../constants/presets';
import { GarmentTextureCompositor } from '../../utils/textureCompositor';
import { RotateCw, Compass, AlertCircle, RefreshCw } from 'lucide-react';

export interface ViewportHandle {
  captureMockup: (options: {
    width?: number;
    height?: number;
    transparent?: boolean;
    format?: 'png' | 'jpeg';
  }) => Promise<string>;
  getTextureAtlasDataUrl: () => string;
  setCameraPreset: (preset: CameraPreset) => void;
  zoom: (delta: number) => void;
}

interface Props {
  project: ProjectState;
  onUpdateProject: (updates: Partial<ProjectState>) => void;
  activeCameraPreset: CameraPreset;
}

export const ThreeGarmentViewer = forwardRef<ViewportHandle, Props>(
  ({ project, onUpdateProject, activeCameraPreset }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Three.js internal references
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const garmentGroupRef = useRef<THREE.Group | null>(null);
    const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
    const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
    const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
    const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
    const shadowPlaneRef = useRef<THREE.Mesh | null>(null);

    // Texture compositor
    const compositorRef = useRef<GarmentTextureCompositor | null>(null);
    const garmentMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

    // State for UI feedback
    const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
    const [modelError, setModelError] = useState<string | null>(null);
    const [polyCount, setPolyCount] = useState<number>(0);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      async captureMockup(options) {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
          throw new Error('3D Viewport not initialized');
        }

        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const targetW = options.width || 2048;
        const targetH = options.height || 2048;
        const transparent = options.transparent ?? false;

        const originalWidth = renderer.domElement.width;
        const originalHeight = renderer.domElement.height;
        const originalAspect = camera.aspect;
        const originalClearColor = renderer.getClearColor(new THREE.Color());
        const originalClearAlpha = renderer.getClearAlpha();

        renderer.setSize(targetW, targetH, false);
        camera.aspect = targetW / targetH;
        camera.updateProjectionMatrix();

        if (transparent) {
          renderer.setClearColor(0x000000, 0);
          if (shadowPlaneRef.current) shadowPlaneRef.current.visible = false;
        }

        renderer.render(scene, camera);

        const mime = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const dataUrl = renderer.domElement.toDataURL(mime, 0.95);

        renderer.setSize(originalWidth, originalHeight, false);
        camera.aspect = originalAspect;
        camera.updateProjectionMatrix();
        renderer.setClearColor(originalClearColor, originalClearAlpha);
        if (shadowPlaneRef.current) shadowPlaneRef.current.visible = true;
        renderer.render(scene, camera);

        return dataUrl;
      },

      getTextureAtlasDataUrl() {
        if (!compositorRef.current) return '';
        return compositorRef.current.getTextureAtlasDataUrl();
      },

      setCameraPreset(preset: CameraPreset) {
        animateCameraToPreset(preset);
      },

      zoom(delta: number) {
        if (!cameraRef.current || !controlsRef.current) return;
        const cam = cameraRef.current;
        const factor = delta > 0 ? 0.85 : 1.15;
        cam.position.multiplyScalar(factor);
        controlsRef.current.update();
      },
    }));

    // Smooth camera animation
    const animateCameraToPreset = (preset: CameraPreset) => {
      if (!cameraRef.current || !controlsRef.current) return;
      const cam = cameraRef.current;
      const controls = controlsRef.current;

      let targetPos = new THREE.Vector3(0, 0, 2.2);

      switch (preset) {
        case 'front':
          targetPos.set(0, 0, 2.2);
          break;
        case 'back':
          targetPos.set(0, 0, -2.2);
          break;
        case 'left':
          targetPos.set(-2.2, 0, 0);
          break;
        case 'right':
          targetPos.set(2.2, 0, 0);
          break;
        case 'three-quarter':
          targetPos.set(1.5, 0.6, 1.5);
          break;
        case 'reset':
        default:
          targetPos.set(0, 0, 2.2);
          break;
      }

      const startPos = cam.position.clone();
      const startTime = performance.now();
      const duration = 650; // ms

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

        cam.position.lerpVectors(startPos, targetPos, ease);
        controls.target.set(0, 0, 0);
        controls.update();

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    };

    // 1. Initialize Scene, Camera, Renderer, Controls
    useEffect(() => {
      if (!containerRef.current || !canvasRef.current) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 0, 2.2);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1.0;
      controls.maxDistance = 5.0;
      controls.maxPolarAngle = Math.PI / 2 + 0.15;
      controls.target.set(0, 0, 0);
      controlsRef.current = controls;

      // Studio Lighting Rigs
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);
      ambientLightRef.current = ambientLight;

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
      keyLight.position.set(2.5, 4, 3);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.bias = -0.0001;
      scene.add(keyLight);
      keyLightRef.current = keyLight;

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
      fillLight.position.set(-3, 1, 2);
      scene.add(fillLight);
      fillLightRef.current = fillLight;

      const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
      rimLight.position.set(0, 3, -3);
      scene.add(rimLight);
      rimLightRef.current = rimLight;

      // Ground Shadow Plane
      const shadowPlaneGeo = new THREE.PlaneGeometry(10, 10);
      const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.18 });
      const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -0.92;
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);
      shadowPlaneRef.current = shadowPlane;

      // Garment Group
      const garmentGroup = new THREE.Group();
      garmentGroup.name = 'GarmentRootGroup';
      scene.add(garmentGroup);
      garmentGroupRef.current = garmentGroup;

      // Init Texture Compositor
      const compositor = new GarmentTextureCompositor(2048);
      compositorRef.current = compositor;

      // Render Loop
      let animationFrameId: number;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        if (project.autoRotate && garmentGroupRef.current) {
          garmentGroupRef.current.rotation.y += 0.008;
        }

        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      return () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        controls.dispose();
        renderer.dispose();
        compositor.dispose();
      };
    }, []);

    // 2. Load Genuine 3D Garment GLB Model
    useEffect(() => {
      if (!sceneRef.current || !garmentGroupRef.current) return;

      const garmentGroup = garmentGroupRef.current;
      while (garmentGroup.children.length > 0) {
        const obj = garmentGroup.children[0];
        garmentGroup.remove(obj);
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      }

      setIsLoadingModel(true);
      setModelError(null);

      const garmentConfig = GARMENTS.find((g) => g.id === project.garment) || GARMENTS[0];
      const modelUrl = garmentConfig.modelUrl;

      const fabricConfig = FABRICS.find((f) => f.id === project.fabric) || FABRICS[0];
      const finishConfig = PRINT_FINISHES.find((p) => p.id === project.printFinish) || PRINT_FINISHES[0];
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: Math.max(0.2, Math.min(1.0, fabricConfig.roughness + finishConfig.roughnessOffset)),
        metalness: fabricConfig.metalness,
        side: THREE.DoubleSide,
      });
      garmentMaterialRef.current = mat;

      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          let totalTriangles = 0;

          // Compute bounding box to center and scale uniformly
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          // Scale to fit viewport naturally (around 1.6 to 1.7 units)
          const scale = 1.65 / maxDim;
          model.scale.set(scale, scale, scale);

          // Center bounding box at origin
          const center = new THREE.Vector3();
          box.getCenter(center);
          model.position.set(-center.x * scale, -center.y * scale - 0.05, -center.z * scale);

          // Apply material to garment meshes
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              // If it's a minor trim/zipper/slider part, give it accent metal or dark plastic
              if (mesh.name.toLowerCase().includes('slider') || mesh.name.toLowerCase().includes('string')) {
                mesh.material = new THREE.MeshStandardMaterial({
                  color: 0x222222,
                  roughness: 0.3,
                  metalness: 0.8,
                });
              } else {
                mesh.material = mat;
              }

              if (mesh.geometry) {
                totalTriangles += mesh.geometry.attributes.position.count / 3;
              }
            }
          });

          garmentGroup.add(model);
          setPolyCount(Math.round(totalTriangles));
          setIsLoadingModel(false);
          updateTexture();
        },
        undefined,
        (error) => {
          console.error(`Failed to load genuine 3D model from ${modelUrl}:`, error);
          setIsLoadingModel(false);
          setModelError(
            `Unable to load genuine 3D model for ${garmentConfig.name}. Please ensure ${garmentConfig.modelUrl} is available.`
          );
        }
      );
    }, [project.garment]);

    // 3. Update Texture whenever elements, color, fabric, or print finish change
    const updateTexture = async () => {
      if (!compositorRef.current || !garmentMaterialRef.current) return;

      const compositor = compositorRef.current;
      const texture = await compositor.composite(
        project.garment,
        project.garmentColor,
        project.fabric,
        project.printFinish,
        project.elements
      );

      garmentMaterialRef.current.map = texture;
      const fabricConfig = FABRICS.find((f) => f.id === project.fabric) || FABRICS[0];
      const finishConfig = PRINT_FINISHES.find((p) => p.id === project.printFinish) || PRINT_FINISHES[0];
      garmentMaterialRef.current.roughness = Math.max(
        0.2,
        Math.min(1.0, fabricConfig.roughness + finishConfig.roughnessOffset)
      );
      garmentMaterialRef.current.metalness = fabricConfig.metalness;
      garmentMaterialRef.current.needsUpdate = true;
    };

    useEffect(() => {
      updateTexture();
    }, [project.garment, project.garmentColor, project.fabric, project.printFinish, project.elements]);

    // 4. Update Studio Lighting
    useEffect(() => {
      const preset = LIGHTING_PRESETS.find((l) => l.id === project.lighting) || LIGHTING_PRESETS[0];
      if (ambientLightRef.current) ambientLightRef.current.intensity = preset.ambientIntensity;
      if (keyLightRef.current) {
        keyLightRef.current.intensity = preset.mainLightIntensity;
        keyLightRef.current.color.set(preset.colorTemp);
      }
      if (rimLightRef.current) rimLightRef.current.intensity = preset.rimLightIntensity;
    }, [project.lighting]);

    // 5. Update Camera
    useEffect(() => {
      if (activeCameraPreset) {
        animateCameraToPreset(activeCameraPreset);
      }
    }, [activeCameraPreset]);

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full studio-grid-bg flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: project.backgroundColor }}
      >
        <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />

        {/* Loading Overlay */}
        {isLoadingModel && (
          <div className="absolute inset-0 bg-[#F6F6F7]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs tracking-widest text-[#09090B] font-semibold uppercase">
              LOADING GENUINE 3D GARMENT MESH...
            </p>
          </div>
        )}

        {/* Error State if Model Missing */}
        {modelError && (
          <div className="absolute inset-0 bg-[#F6F6F7]/95 backdrop-blur-md flex flex-col items-center justify-center gap-3 p-6 text-center z-20">
            <AlertCircle size={36} className="text-red-600" />
            <h4 className="font-mono text-sm font-bold text-[#09090B] uppercase">
              3D Garment Model Error
            </h4>
            <p className="text-xs text-[#71717A] max-w-md font-mono">{modelError}</p>
            <button
              onClick={() => onUpdateProject({ garment: 'oversized-tee' })}
              className="mt-2 px-4 py-2 bg-black text-white rounded text-xs font-mono font-bold hover:bg-[#27272A]"
            >
              Switch to Oversized Tee
            </button>
          </div>
        )}

        {/* Status Pills */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#E4E4E7] shadow-subtle">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] font-semibold tracking-wider text-[#09090B] uppercase">
              {project.garment.replace('-', ' ')}
            </span>
            <span className="text-[#A1A1AA] text-xs">|</span>
            <span className="font-mono text-[10px] text-[#71717A]">
              {polyCount > 0 ? `${polyCount.toLocaleString()} POLYS` : '3D GLB LOADED'}
            </span>
          </div>
        </div>

        {/* Viewport Control Badges Top-Right */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={() => onUpdateProject({ autoRotate: !project.autoRotate })}
            title={project.autoRotate ? 'Pause 360° turntable' : 'Start 360° turntable'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium border transition-all shadow-subtle ${
              project.autoRotate
                ? 'bg-black text-white border-black ring-2 ring-black/20'
                : 'bg-white text-[#09090B] border-[#E4E4E7] hover:bg-[#F4F4F6]'
            }`}
          >
            <RotateCw size={13} className={project.autoRotate ? 'animate-spin' : ''} />
            <span>360° SPIN</span>
          </button>

          <button
            onClick={() => animateCameraToPreset('reset')}
            title="Reset Camera View"
            className="p-2 rounded-full bg-white text-[#09090B] border border-[#E4E4E7] hover:bg-[#F4F4F6] transition-all shadow-subtle"
          >
            <Compass size={14} />
          </button>
        </div>
      </div>
    );
  }
);
