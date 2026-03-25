import { create } from 'zustand';

export interface ViewState {
  x: number;
  y: number;
  scale: number;
}

export interface ThemeColors {
  canvasBg: string;
  nodeBg: string;
  uiBg: string;
  canvasTexture?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: ThemeColors;
}

export interface Position {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio';
  x: number;
  y: number;
  content: string;
  title: string;
  status?: 'idle' | 'generating' | 'done';
  previewUrl?: string;
  isUploaded?: boolean;
  width?: number;
  height?: number;
  aspectRatio?: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

export interface Connection {
  from: string;
  to: string;
}

interface HistoryState {
  past: { nodes: Node[]; connections: Connection[] }[];
  future: { nodes: Node[]; connections: Connection[] }[];
}

interface CanvasState {
  nodes: Node[];
  connections: Connection[];
  viewState: ViewState;
  selectedNodeId: string | null;
  history: HistoryState;
  themeColors: ThemeColors;

  // Actions
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setConnections: (connections: Connection[] | ((prev: Connection[]) => Connection[])) => void;
  setViewState: (viewState: ViewState | ((prev: ViewState) => ViewState)) => void;
  setSelectedNodeId: (id: string | null) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  updateNodes: (updates: {id: string, x: number, y: number}[]) => void;
  removeNode: (id: string) => void;
  addConnection: (connection: Connection) => void;
  removeConnection: (from: string, to: string) => void;
  setThemeColors: (colors: Partial<ThemeColors>) => void;
  
  // History
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
}

const appendHistory = (state: CanvasState) => {
  const newPast = [...state.history.past, { 
    nodes: JSON.parse(JSON.stringify(state.nodes)), 
    connections: JSON.parse(JSON.stringify(state.connections)) 
  }];
  if (newPast.length > 50) newPast.shift();
  return { past: newPast, future: [] };
};

// Load theme colors from localStorage
const loadThemeColors = (): ThemeColors => {
  if (typeof window === 'undefined') {
    return { canvasBg: '#27252A', nodeBg: '#000000', uiBg: '#111111', canvasTexture: 'none' };
  }
  
  const saved = localStorage.getItem('themeColors');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure all values are defined
      return {
        canvasBg: parsed.canvasBg || '#27252A',
        nodeBg: parsed.nodeBg || '#000000',
        uiBg: parsed.uiBg || '#111111',
        canvasTexture: parsed.canvasTexture || 'none'
      };
    } catch {
      return { canvasBg: '#27252A', nodeBg: '#000000', uiBg: '#111111', canvasTexture: 'none' };
    }
  }
  return { canvasBg: '#27252A', nodeBg: '#000000', uiBg: '#111111', canvasTexture: 'none' };
};

// Save theme colors to localStorage
const saveThemeColors = (colors: ThemeColors) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('themeColors', JSON.stringify(colors));
  }
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  connections: [],
  viewState: { x: 0, y: 0, scale: 1 },
  selectedNodeId: null,
  history: { past: [], future: [] },
  themeColors: loadThemeColors(),

  saveHistory: () => set((state) => ({ history: appendHistory(state) })),

  undo: () => set((state) => {
    if (state.history.past.length === 0) return state;
    
    const previous = state.history.past[state.history.past.length - 1];
    const newPast = state.history.past.slice(0, state.history.past.length - 1);
    
    return {
      nodes: previous.nodes,
      connections: previous.connections,
      history: {
        past: newPast,
        future: [{ 
          nodes: JSON.parse(JSON.stringify(state.nodes)), 
          connections: JSON.parse(JSON.stringify(state.connections)) 
        }, ...state.history.future]
      }
    };
  }),

  redo: () => set((state) => {
    if (state.history.future.length === 0) return state;
    
    const next = state.history.future[0];
    const newFuture = state.history.future.slice(1);
    
    return {
      nodes: next.nodes,
      connections: next.connections,
      history: {
        past: [...state.history.past, { 
          nodes: JSON.parse(JSON.stringify(state.nodes)), 
          connections: JSON.parse(JSON.stringify(state.connections)) 
        }],
        future: newFuture
      }
    };
  }),

  setNodes: (nodes) => 
    set((state) => ({ 
      nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes 
    })),
    
  setConnections: (connections) => 
    set((state) => ({ 
      connections: typeof connections === 'function' ? connections(state.connections) : connections 
    })),
    
  setViewState: (viewState) => 
    set((state) => ({ 
      viewState: typeof viewState === 'function' ? viewState(state.viewState) : viewState 
    })),
    
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  
  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) => 
        node.id === id ? { ...node, ...updates } : node
      )
    })),

  updateNodes: (updates) =>
    set((state) => {
      const updateMap = new Map(updates.map(u => [u.id, u]));
      return {
        nodes: state.nodes.map((node) => {
          const update = updateMap.get(node.id);
          if (update) {
            return { ...node, x: update.x, y: update.y };
          }
          return node;
        })
      };
    }),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      connections: state.connections.filter(
        (conn) => conn.from !== id && conn.to !== id
      ),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
    })),

  addConnection: (connection) =>
    set((state) => ({
      connections: [...state.connections, connection]
    })),

  removeConnection: (from, to) =>
    set((state) => ({
      connections: state.connections.filter(
        (conn) => !(conn.from === from && conn.to === to)
      )
    })),

  setThemeColors: (colors) =>
    set((state) => {
      const newColors = { ...state.themeColors, ...colors };
      saveThemeColors(newColors);
      return { themeColors: newColors };
    })
}));