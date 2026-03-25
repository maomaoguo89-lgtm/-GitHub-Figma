import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Circle } from 'react-konva';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, MousePointer2, Image as ImageIcon, Video, Type, Music, 
  Upload, Settings, Share2, Download, Play, Sparkles,
  Camera, Sun, Maximize, Layers, Zap, ChevronRight, ChevronLeft,
  MoreHorizontal, RefreshCw, Eraser, Wand2,
  Shapes, Layout, MessageCircle, History, Grid, Minus, HelpCircle,
  Map as MapIcon, X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

// --- Types ---
interface Node {
  id: string;
  type: 'text' | 'image' | 'video';
  x: number;
  y: number;
  content: string;
  title: string;
  status?: 'idle' | 'generating' | 'done';
  previewUrl?: string;
}

interface Connection {
  from: string;
  to: string;
}

// --- Mock Data ---
const INITIAL_NODES: Node[] = [
  { id: '1', type: 'text', x: 100, y: 200, title: 'Script', content: 'A futuristic city with neon lights and flying cars, cinematic lighting, 8k.' },
  { id: '2', type: 'image', x: 450, y: 150, title: 'Image Gen', content: '', status: 'done', previewUrl: 'https://picsum.photos/seed/tap1/400/300' },
  { id: '3', type: 'video', x: 850, y: 250, title: 'Video Gen', content: '', status: 'generating' },
];

const INITIAL_CONNECTIONS: Connection[] = [
  { from: '1', to: '2' },
  { from: '2', to: '3' },
];

// --- Constants ---
const WORLD_SIZE = 4000;
const WORLD_OFFSET = 2000;

export const InfiniteCanvas = () => {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [gridImage, setGridImage] = useState<HTMLCanvasElement | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{ x1: number, y1: number, x2: number, y2: number, active: boolean }>({ x1: 0, y1: 0, x2: 0, y2: 0, active: false });
  const selectionRef = useRef<{ x1: number, y1: number, x2: number, y2: number, active: boolean }>({ x1: 0, y1: 0, x2: 0, y2: 0, active: false });
  const isSelecting = useRef(false);
  const selectionFrameRef = useRef<number | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [history, setHistory] = useState<{ nodes: Node[], connections: Connection[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [clipboard, setClipboard] = useState<Node[]>([]);
  const isMiddleMouseDown = useRef(false);
  const lastMiddleMousePos = useRef({ x: 0, y: 0 });
  const [isAgentOpen, setIsAgentOpen] = useState(true);
  const [isMinimapOpen, setIsMinimapOpen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showZoomToast, setShowZoomToast] = useState(false);
  const stageRef = useRef<any>(null);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to save history
  const saveHistory = (newNodes: Node[], newConnections: Connection[]) => {
    const newEntry = { nodes: newNodes, connections: newConnections };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);
    
    // Limit history to 50 steps
    if (newHistory.length > 50) newHistory.shift();
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const isMod = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      // Undo / Redo
      if (isMod && e.key === 'z') {
        if (isShift) {
          // Redo
          if (historyIndex < history.length - 1) {
            const next = history[historyIndex + 1];
            setNodes(next.nodes);
            setConnections(next.connections);
            setHistoryIndex(historyIndex + 1);
          }
        } else {
          // Undo
          if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setNodes(prev.nodes);
            setConnections(prev.connections);
            setHistoryIndex(historyIndex - 1);
          }
        }
        return;
      }

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodes.length > 0) {
        const newNodes = nodes.filter(n => !selectedNodes.includes(n.id));
        const newConns = connections.filter(c => !selectedNodes.includes(c.from) && !selectedNodes.includes(c.to));
        setNodes(newNodes);
        setConnections(newConns);
        setSelectedNodes([]);
        saveHistory(newNodes, newConns);
      }

      // Copy
      if (isMod && e.key === 'c' && selectedNodes.length > 0) {
        const nodesToCopy = nodes.filter(n => selectedNodes.includes(n.id));
        setClipboard(nodesToCopy);
      }

      // Paste
      if (isMod && e.key === 'v' && clipboard.length > 0) {
        const idMap: Record<string, string> = {};
        const newNodesToPaste = clipboard.map(node => {
          const newId = Math.random().toString(36).substr(2, 9);
          idMap[node.id] = newId;
          return {
            ...node,
            id: newId,
            x: node.x + 40,
            y: node.y + 40,
          };
        });

        const newNodes = [...nodes, ...newNodesToPaste];
        setNodes(newNodes);
        setSelectedNodes(newNodesToPaste.map(n => n.id));
        saveHistory(newNodes, connections);
      }

      // Help
      if (e.key === '/' || (isMod && e.key === '/')) {
        setIsHelpOpen(prev => !prev);
      }

      // Space for panning
      if (e.code === 'Space') {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedNodes, nodes, clipboard]);

  useEffect(() => {
    // Initial history entry
    if (history.length === 0) {
      setHistory([{ nodes: INITIAL_NODES, connections: INITIAL_CONNECTIONS }]);
      setHistoryIndex(0);
    }

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    // Create a small canvas for the grid pattern
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(1, 1, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    setGridImage(canvas);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const triggerZoomToast = () => {
    setShowZoomToast(true);
    if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    zoomTimeoutRef.current = setTimeout(() => setShowZoomToast(false), 1000);
  };

  const handleZoom = (direction: 'in' | 'out', center?: { x: number, y: number }) => {
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    
    // Use stage center if no pointer position provided
    const pointer = center || { x: windowSize.width / 2, y: windowSize.height / 2 };

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = direction === 'in' ? oldScale * scaleBy : oldScale / scaleBy;
    
    // Clamp between 1% and 300%
    newScale = Math.max(0.01, Math.min(3, newScale));
    
    if (newScale === oldScale) return;

    setScale(newScale);
    triggerZoomToast();

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setPosition(newPos);
  };

  // Handle Wheel Interactions
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const isCtrl = e.evt.ctrlKey || e.evt.metaKey;
    const isShift = e.evt.shiftKey;

    if (isCtrl) {
      // Ctrl + Wheel -> Zoom
      handleZoom(e.evt.deltaY < 0 ? 'in' : 'out', stageRef.current.getPointerPosition());
    } else if (isShift) {
      // Shift + Wheel -> Horizontal Pan
      setPosition(prev => ({
        ...prev,
        x: prev.x - e.evt.deltaY
      }));
    } else {
      // Normal Wheel -> Vertical Pan
      setPosition(prev => ({
        ...prev,
        y: prev.y - e.evt.deltaY
      }));
    }
  };

  const dragRef = useRef<number | null>(null);

  const handleDragNode = (id: string, e: any) => {
    if (dragRef.current) cancelAnimationFrame(dragRef.current);
    
    const snap = 20;
    const snappedX = Math.round(e.target.x() / snap) * snap;
    const snappedY = Math.round(e.target.y() / snap) * snap;

    const dx = snappedX - (nodes.find(n => n.id === id)?.x || 0);
    const dy = snappedY - (nodes.find(n => n.id === id)?.y || 0);

    dragRef.current = requestAnimationFrame(() => {
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === id) return { ...node, x: snappedX, y: snappedY };
        if (selectedNodes.includes(node.id)) return { ...node, x: Math.round((node.x + dx) / snap) * snap, y: Math.round((node.y + dy) / snap) * snap };
        return node;
      }));
    });
  };

  const handleMouseDown = (e: any) => {
    // Middle Mouse Button (button 1) for Panning
    if (e.evt.button === 1) {
      isMiddleMouseDown.current = true;
      lastMiddleMousePos.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }

    // If Space is pressed, we are panning, don't start selection
    if (isSpacePressed) return;

    // If clicking on background
    if (e.target === e.target.getStage()) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pos);

      isSelecting.current = true;
      selectionRef.current = {
        x1: canvasPos.x,
        y1: canvasPos.y,
        x2: canvasPos.x,
        y2: canvasPos.y,
        active: false
      };
      setSelectedNodes([]);
    }
  };

  const handleMouseMove = (e: any) => {
    // Middle Mouse Panning
    if (isMiddleMouseDown.current) {
      const dx = e.evt.clientX - lastMiddleMousePos.current.x;
      const dy = e.evt.clientY - lastMiddleMousePos.current.y;
      
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      lastMiddleMousePos.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPos = transform.point(pos);

    // If we have a potential selection starting
    if (isSelecting.current) {
      const dx = Math.abs(canvasPos.x - selectionRef.current.x1);
      const dy = Math.abs(canvasPos.y - selectionRef.current.y1);
      
      // Activate selection box after 3px movement to avoid accidental clicks
      if (!selectionRef.current.active && (dx > 3 || dy > 3)) {
        selectionRef.current.active = true;
      }

      if (selectionRef.current.active) {
        selectionRef.current.x2 = canvasPos.x;
        selectionRef.current.y2 = canvasPos.y;

        if (selectionFrameRef.current) cancelAnimationFrame(selectionFrameRef.current);
        selectionFrameRef.current = requestAnimationFrame(() => {
          setSelectionBox({ ...selectionRef.current });
        });
      }
    }
  };

  const handleMouseUp = () => {
    isMiddleMouseDown.current = false;
    
    if (selectionFrameRef.current) {
      cancelAnimationFrame(selectionFrameRef.current);
      selectionFrameRef.current = null;
    }

    const wasActive = selectionRef.current.active;
    const finalSelection = { ...selectionRef.current };
    
    // Reset selection state
    isSelecting.current = false;
    selectionRef.current = { x1: 0, y1: 0, x2: 0, y2: 0, active: false };
    setSelectionBox({ x1: 0, y1: 0, x2: 0, y2: 0, active: false });

    if (!wasActive) return;

    const x = Math.min(finalSelection.x1, finalSelection.x2);
    const y = Math.min(finalSelection.y1, finalSelection.y2);
    const width = Math.abs(finalSelection.x1 - finalSelection.x2);
    const height = Math.abs(finalSelection.y1 - finalSelection.y2);

    // Only select if box has some size
    if (width > 5 || height > 5) {
      const selected = nodes.filter(node => {
        const nodeWidth = 220;
        const nodeHeight = node.type === 'text' ? 120 : 180;
        return (
          node.x < x + width &&
          node.x + nodeWidth > x &&
          node.y < y + height &&
          node.y + nodeHeight > y
        );
      }).map(n => n.id);

      setSelectedNodes(selected);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans flex text-white">
      {/* --- Main Content Area --- */}
      <div className="relative flex-1 h-full overflow-hidden flex flex-col">
        {/* --- Top Header --- */}
        <header className="absolute top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-6 pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <div className="w-4 h-4 bg-white/20 rounded-full backdrop-blur-sm" />
            </div>
            <span className="text-sm font-medium text-white/90">Visual Strategy (0224)</span>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center bg-white/5 rounded-lg p-1 mr-2">
              <button 
                onClick={() => {
                  if (historyIndex > 0) {
                    const prev = history[historyIndex - 1];
                    setNodes(prev.nodes);
                    setConnections(prev.connections);
                    setHistoryIndex(historyIndex - 1);
                  }
                }}
                disabled={historyIndex <= 0}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20 transition-colors"
              >
                <RefreshCw size={14} className="-rotate-90" />
              </button>
              <button 
                onClick={() => {
                  if (historyIndex < history.length - 1) {
                    const next = history[historyIndex + 1];
                    setNodes(next.nodes);
                    setConnections(next.connections);
                    setHistoryIndex(historyIndex + 1);
                  }
                }}
                disabled={historyIndex >= history.length - 1}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-20 transition-colors"
              >
                <RefreshCw size={14} className="rotate-90" />
              </button>
            </div>
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg transition-colors">
              <Zap size={14} className="text-white/60" />
              <span className="text-xs font-bold text-white/80">1558</span>
            </button>
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 transition-colors">
              <Share2 size={16} />
            </button>
          </div>
        </header>

        {/* --- Left Sidebar (Dock) --- */}
        <aside 
          className="absolute left-6 top-1/2 -translate-y-1/2 z-40"
          onMouseEnter={() => setIsAddMenuOpen(true)}
          onMouseLeave={() => setIsAddMenuOpen(false)}
        >
          <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/10 p-2 rounded-[32px] flex flex-col items-center gap-2 shadow-2xl relative">
            {/* Top Toggle Button (Plus/Close) */}
            <button className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
              isAddMenuOpen ? "bg-white/10 text-white/60" : "bg-white text-black hover:scale-110"
            )}>
              {isAddMenuOpen ? <X size={20} /> : <Plus size={20} strokeWidth={2.5} />}
            </button>
            
            <div className="flex flex-col gap-1">
              <SidebarButton icon={Shapes} label="Assets" />
              <SidebarButton icon={Layout} label="Layout" />
              <SidebarButton icon={MessageCircle} label="Chat" />
              <SidebarButton icon={History} label="History" />
              <SidebarButton icon={ImageIcon} label="Images" />
              <SidebarButton icon={HelpCircle} label="Shortcuts" onClick={() => setIsHelpOpen(true)} />
            </div>

            <div className="h-px w-6 bg-white/10 my-1" />

            {/* Bottom Count Button */}
            <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 text-xs font-bold hover:bg-white/10 transition-colors">
              3
            </button>

            {/* --- Secondary Add Menu --- */}
            <AnimatePresence>
              {isAddMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -12, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -12, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  className="absolute left-[64px] top-0 w-[280px] bg-[#161616]/95 backdrop-blur-2xl border border-white/10 rounded-[28px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50"
                >
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3 px-2">添加节点</h3>
                      <div className="space-y-1">
                        <AddMenuItem 
                          icon={Type} 
                          title="文本" 
                          description="脚本、广告词、品牌文案" 
                          active 
                        />
                        <AddMenuItem icon={ImageIcon} title="图片" />
                        <AddMenuItem icon={Video} title="视频" />
                        <AddMenuItem icon={Music} title="音频" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3 px-2">添加资源</h3>
                      <div className="space-y-1">
                        <AddMenuItem icon={Upload} title="上传" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* --- Minimap --- */}
        <AnimatePresence>
          {isMinimapOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-20 left-6 z-40 w-[240px] h-[180px] bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden group"
            >
              <Minimap 
                nodes={nodes} 
                canvasPosition={position} 
                canvasScale={scale} 
                windowSize={windowSize}
                isAgentOpen={isAgentOpen}
                onNavigate={(newPos) => setPosition(newPos)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Bottom Left Controls --- */}
        <div className="absolute bottom-6 left-6 z-40 flex items-center gap-3">
          <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/10 p-1 rounded-2xl flex items-center gap-1 shadow-2xl">
            <button 
              onClick={() => setIsMinimapOpen(!isMinimapOpen)}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                isMinimapOpen ? "bg-white/20 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <MapIcon size={16} />
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Grid size={16} /></button>
            <button className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Maximize size={16} /></button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <div className="flex items-center gap-3 px-3">
              <button 
                onClick={() => handleZoom('out')}
                className="text-white/20 hover:text-white transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="text-[10px] font-bold text-white/40 min-w-[32px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={() => handleZoom('in')}
                className="text-white/20 hover:text-white transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <button className="w-11 h-11 bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all shadow-2xl">
            <HelpCircle size={18} />
          </button>
        </div>

        {/* --- Minimap --- */}
        <div className="absolute bottom-6 left-6 w-48 h-32 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 pointer-events-none">
          <div className="absolute inset-0 opacity-20">
            {nodes.map(node => (
              <div 
                key={node.id}
                className="absolute bg-white/40 rounded-sm"
                style={{
                  left: `${(node.x + WORLD_OFFSET) / WORLD_SIZE * 100}%`,
                  top: `${(node.y + WORLD_OFFSET) / WORLD_SIZE * 100}%`,
                  width: '4px',
                  height: '3px'
                }}
              />
            ))}
            {/* Viewport indicator */}
            <div 
              className="absolute border border-blue-400/50 bg-blue-400/5"
              style={{
                left: `${(-position.x / scale + WORLD_OFFSET) / WORLD_SIZE * 100}%`,
                top: `${(-position.y / scale + WORLD_OFFSET) / WORLD_SIZE * 100}%`,
                width: `${(windowSize.width / scale) / WORLD_SIZE * 100}%`,
                height: `${(windowSize.height / scale) / WORLD_SIZE * 100}%`
              }}
            />
          </div>
          <div className="absolute bottom-2 left-2 text-[8px] font-bold text-white/20 uppercase tracking-widest">Minimap</div>
        </div>

        {/* --- Zoom Toast --- */}
        <AnimatePresence>
          {showZoomToast && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl pointer-events-none"
            >
              <span className="text-2xl font-bold text-white/90 tabular-nums">
                {Math.round(scale * 100)}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Floating Agent Button --- */}
        {!isAgentOpen && (
          <button 
            onClick={() => setIsAgentOpen(true)}
            className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all z-50 group"
          >
            <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
          </button>
        )}

        {/* --- Main Canvas Stage --- */}
        <Stage
          width={windowSize.width}
          height={windowSize.height}
          draggable={isSpacePressed}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDragMove={(e) => {
            if (e.target === e.currentTarget) {
              setPosition(prev => ({
                x: e.target.x(),
                y: e.target.y()
              }));
            }
          }}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          ref={stageRef}
          className="bg-black"
        >
          <Layer>
            {/* Optimized Grid Background */}
            {gridImage && (
              <Rect
                x={-WORLD_OFFSET}
                y={-WORLD_OFFSET}
                width={WORLD_SIZE}
                height={WORLD_SIZE}
                fillPatternImage={gridImage as any}
                fillPatternRepeat="repeat"
                listening={false}
              />
            )}

            {/* Selection Box */}
            {selectionBox.active && (
              <Rect
                x={Math.min(selectionBox.x1, selectionBox.x2)}
                y={Math.min(selectionBox.y1, selectionBox.y2)}
                width={Math.abs(selectionBox.x1 - selectionBox.x2)}
                height={Math.abs(selectionBox.y1 - selectionBox.y2)}
                fill="rgba(255, 255, 255, 0.05)"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={1}
                cornerRadius={8}
                listening={false}
              />
            )}

            {/* Connections */}
            {connections.map((conn, i) => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;
              return (
                <Line
                  key={i}
                  points={[fromNode.x + 200, fromNode.y + 50, toNode.x, toNode.y + 50]}
                  stroke="rgba(0, 255, 204, 0.1)"
                  strokeWidth={2}
                  tension={0.5}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => (
              <Group
                key={node.id}
                x={node.x}
                y={node.y}
                draggable
                onDragStart={(e) => {
                  if ((e.evt && e.evt.button === 1) || isSpacePressed) {
                    e.target.stopDrag();
                    return;
                  }
                  if (!selectedNodes.includes(node.id)) {
                    setSelectedNodes([node.id]);
                  }
                }}
                onMouseDown={(e) => {
                  if (e.evt && e.evt.button === 1) {
                    // Prevent selection on middle click
                    e.cancelBubble = false; // Allow bubbling to stage for panning
                    return;
                  }
                }}
                onClick={(e) => {
                  if (e.evt && e.evt.button === 1) return;
                  setSelectedNodes([node.id]);
                }}
                onDragMove={(e) => handleDragNode(node.id, e)}
                onDragEnd={() => saveHistory(nodes, connections)}
              >
                {/* Node Card */}
                <Rect
                  width={220}
                  height={node.type === 'text' ? 120 : 180}
                  fill="#0a0a0a"
                  cornerRadius={16}
                  stroke={selectedNodes.includes(node.id) ? '#00ffcc' : 'rgba(255,255,255,0.05)'}
                  strokeWidth={selectedNodes.includes(node.id) ? 2 : 1}
                  shadowBlur={10}
                  shadowColor="rgba(0,0,0,0.5)"
                />
                
                {/* Header */}
                <Group x={16} y={16}>
                  {node.type === 'text' && <Rect width={12} height={12} fill="#3b82f6" cornerRadius={2} />}
                  {node.type === 'image' && <Rect width={12} height={12} fill="#00ffcc" cornerRadius={2} />}
                  {node.type === 'video' && <Rect width={12} height={12} fill="#a855f7" cornerRadius={2} />}
                  <Text
                    x={20}
                    text={node.title}
                    fill="rgba(255,255,255,0.4)"
                    fontSize={10}
                    fontStyle="bold"
                    letterSpacing={1}
                  />
                </Group>

                {/* Content */}
                <Group x={16} y={44}>
                  {node.type === 'text' ? (
                    <Text
                      text={node.content}
                      fill="white"
                      fontSize={11}
                      width={188}
                      lineHeight={1.4}
                    />
                  ) : (
                    <Group>
                      {node.status === 'generating' ? (
                        <Group>
                          <Rect width={188} height={100} fill="rgba(255,255,255,0.02)" cornerRadius={8} />
                          <Text x={60} y={45} text="Generating..." fill="rgba(255,255,255,0.2)" fontSize={10} />
                          <Rect x={20} y={80} width={148} height={2} fill="rgba(255,255,255,0.1)" cornerRadius={1} />
                          <Rect x={20} y={80} width={74} height={2} fill="#00ffcc" cornerRadius={1} />
                        </Group>
                      ) : (
                        <Rect width={188} height={100} fill="rgba(255,255,255,0.05)" cornerRadius={8} />
                      )}
                    </Group>
                  )}
                </Group>
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>

      {/* --- Shortcut Help Modal --- */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[560px] bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="grid grid-cols-2 gap-12">
                {/* Left Column: Zoom & Pan */}
                <div className="space-y-8">
                  <section>
                    <h3 className="text-white/40 text-sm font-medium mb-4">缩放</h3>
                    <div className="space-y-4">
                      <ShortcutRow label="缩放画布" keys={['Ctrl', '滚轮']} />
                      <ShortcutRow label="放大" keys={['Ctrl', '+']} />
                      <ShortcutRow label="缩小" keys={['Ctrl', '-']} />
                    </div>
                  </section>

                  <section>
                    <h3 className="text-white/40 text-sm font-medium mb-4">移动画布</h3>
                    <div className="space-y-4">
                      <ShortcutRow label="垂直平移" keys={['滚轮']} />
                      <ShortcutRow label="水平平移" keys={['Shift', '滚轮']} />
                      <ShortcutRow label="自由平移" keys={['Space', '左键拖拽']} />
                      <ShortcutRow label="中键拖拽" keys={['中键拖拽']} />
                    </div>
                  </section>
                </div>

                {/* Right Column: Other */}
                <div className="space-y-8">
                  <section>
                    <h3 className="text-white/40 text-sm font-medium mb-4">其他</h3>
                    <div className="space-y-4">
                      <ShortcutRow label="删除" keys={['Del']} />
                      <ShortcutRow label="撤销" keys={['Ctrl', 'Z']} />
                      <ShortcutRow label="重做" keys={['Shift', 'Ctrl', 'Z']} />
                      <ShortcutRow label="复制" keys={['Ctrl', 'C']} />
                      <ShortcutRow label="粘贴" keys={['Ctrl', 'V']} />
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Right Sidebar (Agent Chat) --- */}
      <AnimatePresence>
        {isAgentOpen && (
          <motion.aside
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-[400px] h-full bg-[#0a0a0a] border-l border-white/5 flex flex-col z-50 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Collapse Button */}
            <button 
              onClick={() => setIsAgentOpen(false)}
              className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-12 bg-[#0a0a0a] border-l border-y border-white/5 rounded-l-lg flex items-center justify-center text-white/40 hover:text-white transition-colors shadow-[-5px_0_10px_rgba(0,0,0,0.2)]"
            >
              <ChevronRight size={14} />
            </button>

            {/* Agent Header */}
            <div className="p-8 pb-4 flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-4xl font-bold tracking-tight text-white flex flex-col">
                  <span>Hi,</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">332387138</span>
                </h2>
                <p className="text-white/60 text-lg font-medium mt-2">在寻找哪方面的灵感?</p>
              </div>
              <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <History size={20} />
              </button>
            </div>

            {/* Agent Content */}
            <div className="flex-1 px-8 overflow-y-auto no-scrollbar py-4">
              <div className="bg-[#161616] border border-white/5 rounded-3xl p-5 space-y-5 shadow-xl">
                <div className="aspect-video rounded-2xl overflow-hidden bg-black/40 relative group">
                  <img 
                    src="https://picsum.photos/seed/agent-tip/400/225" 
                    alt="Tip" 
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <p className="text-xs text-white/60 leading-relaxed font-medium">
                  拖拽图片/视频节点到对话框中，解锁根据节点内容 生成提示词 等进阶玩法，可为创作提供更多灵感~
                </p>
                <div className="flex justify-end">
                  <button className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-bold text-white/80 transition-colors">
                    知道了
                  </button>
                </div>
              </div>
            </div>

            {/* Agent Footer / Input */}
            <div className="p-6 bg-[#0a0a0a] border-t border-white/5">
              <div className="bg-[#161616] border border-white/10 rounded-[32px] p-2 shadow-2xl">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-4 pt-2">
                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white/60 hover:bg-white/10 cursor-pointer transition-colors">
                      <MessageCircle size={12} />
                      <span>对话模式</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-blue-500/10 px-2.5 py-1 rounded-full text-[10px] font-bold text-blue-400 hover:bg-blue-500/20 cursor-pointer transition-colors">
                      <Sparkles size={12} />
                      <span>Gemini3 Flash</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2 pb-1">
                    <button className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-white/40 transition-colors">
                      <Plus size={20} />
                    </button>
                    <input 
                      type="text" 
                      placeholder="开启你的灵感之旅..."
                      className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/20 py-2"
                    />
                    <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all shadow-lg">
                      <ChevronRight size={20} className="-rotate-90" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-[10px] text-center text-white/20 font-medium">
                AI 可能会产生错误，请核实重要信息
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* --- Node Floating Toolbar --- */}
      <AnimatePresence>
        {selectedNodes.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 glass p-1.5 rounded-xl flex items-center gap-1 z-50"
          >
            <NodeAction icon={RefreshCw} label="Redraw" />
            <NodeAction icon={Eraser} label="Erase" />
            <NodeAction icon={Wand2} label="Enhance" />
            <div className="w-px h-4 bg-white/10 mx-1" />
            <NodeAction icon={MoreHorizontal} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-components ---

const SidebarButton = ({ icon: Icon, label, active }: any) => (
  <button className={cn(
    "w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative",
    active ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
  )}>
    <Icon size={18} strokeWidth={2} />
    {label && (
      <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-[#1a1a1a] border border-white/10 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-4px] group-hover:translate-x-0 uppercase tracking-widest whitespace-nowrap z-50 shadow-xl">
        {label}
      </div>
    )}
  </button>
);

const PropertySection = ({ title, icon: Icon, children }: any) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-4">
      <Icon size={14} className="text-accent" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{title}</span>
    </div>
    {children}
  </div>
);

const Slider = ({ label, value }: any) => (
  <div>
    <div className="flex justify-between mb-2">
      <span className="text-[10px] text-white/40 uppercase">{label}</span>
      <span className="text-[10px] font-mono">{value}%</span>
    </div>
    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
      <div className="h-full bg-accent" style={{ width: `${value}%` }} />
    </div>
  </div>
);

const NodeAction = ({ icon: Icon, label }: any) => (
  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
    <Icon size={14} />
    {label && <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>}
  </button>
);

const AddMenuItem = ({ icon: Icon, title, description, active }: any) => (
  <div className={cn(
    "flex items-center gap-3 p-2 rounded-2xl transition-all cursor-pointer group",
    active ? "bg-white/[0.08]" : "hover:bg-white/5"
  )}>
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
      active ? "bg-white/10 text-white" : "bg-white/5 text-white/40 group-hover:text-white group-hover:bg-white/10"
    )}>
      <Icon size={18} />
    </div>
    <div className="flex flex-col">
      <span className="text-sm font-medium text-white/90 leading-tight">{title}</span>
      {description && <span className="text-[10px] text-white/30 mt-0.5">{description}</span>}
    </div>
  </div>
);

const ShortcutRow = ({ label, keys, icon }: any) => (
  <div className="flex items-center justify-between">
    <span className="text-white/80 text-sm">{label}</span>
    <div className="flex items-center gap-1.5">
      {keys?.map((key: string) => (
        <span key={key} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-mono text-white/60 min-w-[24px] text-center">
          {key}
        </span>
      ))}
      {icon && <span className="text-lg grayscale opacity-60">{icon}</span>}
    </div>
  </div>
);

const Minimap = ({ nodes, canvasPosition, canvasScale, windowSize, isAgentOpen, onNavigate }: any) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const MW = 240;
  const MH = 180;
  
  const toMapX = (x: number) => ((x + WORLD_OFFSET) / WORLD_SIZE) * MW;
  const toMapY = (y: number) => ((y + WORLD_OFFSET) / WORLD_SIZE) * MH;
  const fromMapX = (mx: number) => (mx / MW) * WORLD_SIZE - WORLD_OFFSET;
  const fromMapY = (my: number) => (my / MH) * WORLD_SIZE - WORLD_OFFSET;

  const viewportWidth = (windowSize.width - (isAgentOpen ? 400 : 0)) / canvasScale;
  const viewportHeight = windowSize.height / canvasScale;
  
  const viewportX = -canvasPosition.x / canvasScale;
  const viewportY = -canvasPosition.y / canvasScale;

  const handleInteract = (e: React.MouseEvent | React.TouchEvent) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    
    const worldX = fromMapX(mx);
    const worldY = fromMapY(my);
    
    // Center viewport on click
    onNavigate({
      x: -(worldX - viewportWidth / 2) * canvasScale,
      y: -(worldY - viewportHeight / 2) * canvasScale
    });
  };

  const [isDragging, setIsDragging] = useState(false);

  return (
    <div 
      ref={mapRef}
      className="relative w-full h-full cursor-crosshair bg-black/40"
      onMouseDown={(e) => {
        setIsDragging(true);
        handleInteract(e);
      }}
      onMouseMove={(e) => {
        if (isDragging) handleInteract(e);
      }}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      {/* Nodes on Map */}
      {nodes.map((node: any) => (
        <div 
          key={node.id}
          className="absolute bg-white/20 rounded-[1px]"
          style={{
            left: toMapX(node.x),
            top: toMapY(node.y),
            width: (220 / WORLD_SIZE) * MW,
            height: ((node.type === 'text' ? 120 : 180) / WORLD_SIZE) * MH,
          }}
        />
      ))}

      {/* Viewport Indicator */}
      <div 
        className="absolute border border-blue-500/50 bg-blue-500/10 cursor-grab active:cursor-grabbing transition-shadow"
        style={{
          left: toMapX(viewportX),
          top: toMapY(viewportY),
          width: (viewportWidth / WORLD_SIZE) * MW,
          height: (viewportHeight / WORLD_SIZE) * MH,
          boxShadow: '0 0 0 1000px rgba(0,0,0,0.2)'
        }}
      >
        {/* Hand Icon Overlay on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <MousePointer2 size={12} className="text-blue-400 rotate-45" />
        </div>
      </div>
    </div>
  );
};
