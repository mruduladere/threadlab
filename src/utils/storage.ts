import { ProjectState } from '../types';

const DB_NAME = 'ThreadLabDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const STORAGE_KEY_RECENT = 'threadlab_recent_project_id';
const STORAGE_KEY_META_LIST = 'threadlab_projects_meta';

// Helper to open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProjectToStorage(project: ProjectState): Promise<void> {
  try {
    const updatedProject = {
      ...project,
      updatedAt: Date.now(),
    };

    // 1. Try to save full object with images to IndexedDB
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(updatedProject);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (idbErr) {
      console.warn('IndexedDB save failed, falling back to localStorage metadata', idbErr);
    }

    // 2. Also keep metadata list in localStorage for instant access
    const metaListStr = localStorage.getItem(STORAGE_KEY_META_LIST);
    let list: Array<{ id: string; name: string; updatedAt: number; garment: string }> = metaListStr
      ? JSON.parse(metaListStr)
      : [];

    list = list.filter((item) => item.id !== updatedProject.id);
    list.unshift({
      id: updatedProject.id,
      name: updatedProject.name,
      updatedAt: updatedProject.updatedAt,
      garment: updatedProject.garment,
    });
    localStorage.setItem(STORAGE_KEY_META_LIST, JSON.stringify(list));
    localStorage.setItem(STORAGE_KEY_RECENT, updatedProject.id);
  } catch (error) {
    console.error('Failed to save project:', error);
  }
}

export async function loadProjectsList(): Promise<
  Array<{ id: string; name: string; updatedAt: number; garment: string }>
> {
  try {
    const metaListStr = localStorage.getItem(STORAGE_KEY_META_LIST);
    if (metaListStr) {
      return JSON.parse(metaListStr);
    }
    return [];
  } catch {
    return [];
  }
}

export async function loadProjectById(id: string): Promise<ProjectState | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error('Failed to load project from IndexedDB:', err);
    return null;
  }
}

export async function deleteProjectFromStorage(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    const metaListStr = localStorage.getItem(STORAGE_KEY_META_LIST);
    if (metaListStr) {
      const list = JSON.parse(metaListStr).filter((item: any) => item.id !== id);
      localStorage.setItem(STORAGE_KEY_META_LIST, JSON.stringify(list));
    }
  } catch (err) {
    console.error('Failed to delete project:', err);
  }
}
