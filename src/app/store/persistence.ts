import { useCanvasStore } from './canvasStore';

const STORAGE_KEY = 'ai_creative_canvas_data';

export const saveStateToStorage = () => {
  try {
    const state = useCanvasStore.getState();
    const dataToSave = {
      nodes: state.nodes,
      connections: state.connections,
      viewState: state.viewState
    };
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  } catch (error) {
    console.warn('Failed to save canvas state:', error);
  }
};

export const loadStateFromStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedData = window.localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const state = useCanvasStore.getState();
        if (parsedData.nodes) state.setNodes(parsedData.nodes);
        if (parsedData.connections) state.setConnections(parsedData.connections);
        if (parsedData.viewState) state.setViewState(parsedData.viewState);
        return true;
      }
    }
  } catch (error) {
    console.warn('Failed to load canvas state:', error);
  }
  return false;
};

// Setup auto-save listener
let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
export const setupAutoSave = () => {
  return useCanvasStore.subscribe((state, prevState) => {
    // Only save if nodes or connections changed
    if (state.nodes !== prevState.nodes || state.connections !== prevState.connections) {
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        saveStateToStorage();
      }, 2000); // 2 seconds debounce
    }
  });
};
