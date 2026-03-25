// Updated: 2025-03-20 - Fixed updateNode and asset store references
import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCanvasStore } from '../store/canvasStore';
import { useUIStore } from '../store/uiStore';
import { useGroupStore } from '../store/groupStore';
import { useAssetStore } from '../store/assetStore';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from '../i18n';
import { 
  Plus, MousePointer, Image as ImageIcon, Video, Type, Music, 
  Upload, Settings, Share2, Download, Play, Sparkles, Hand, X,
  Camera, Sun, Maximize, Layers, Zap, ChevronRight, ChevronLeft,
  MoreHorizontal, RefreshCw, Undo2, Redo2, Eraser, Wand2,
  Shapes, Layout, MessageCircle, History, Grid, Minus, HelpCircle,
  Map as MapIcon, Save, FolderOpen, Pencil, Pen, Bell, User, LogOut,
  Mic, Headset, Phone, PanelRight, Bot, Grip,
  Cloud, CloudLightning, Database, ChevronDown, CreditCard, Wallet, Package
} from 'lucide-react';
import { cn } from '../../lib/utils';
import avatarImg from "figma:asset/ea24a6556c9b973c5d942401c25d581ba7bb389b.png";
import { parseWordDocument, createDocumentInfoNode } from '../utils/documentParser';
import { NodeEditorPanel } from './NodeEditorPanel';
import { ThemeColorPicker } from './ThemeColorPicker';
import { TextCanvasNode } from './TextCanvasNode';
import { ImageCanvasNode } from './ImageCanvasNode';
import { VideoCanvasNode } from './VideoCanvasNode';
import { AudioCanvasNode } from './AudioCanvasNode';
import { BezierEdge } from './BezierEdge';
import { VirtualNodesLayer } from './VirtualNodesLayer';
import { GroupFrame } from './GroupFrame';
import { MultiSelectToolbar, CreateAssetDialog } from './MultiSelectToolbar';
import { AssetLibrary } from './AssetLibrary';
import { Node, Connection } from '../store/canvasStore';
import { NODE_DIMENSIONS, PORT_CONFIG, MINIMAP_CONFIG, ANIMATION_CONFIG, CANVAS_CONFIG } from '../config/canvasConstants';
import { getNodeDimensions, getNodeWidth, getNodeHeight, isPointInNode, isRectIntersectNode } from '../utils/nodeHelpers';
import { normalizeConnection, isConnectionExists, canCreateConnection, getTargetPortType } from '../utils/connectionHelpers';

import { loadStateFromStorage, setupAutoSave } from '../store/persistence';
import { getTextureUrl } from '../utils/canvasTextures';

export const getNodePortCoords = (node: Node, port: 'left' | 'right') => {
  const { width: defaultWidth, height: defaultHeight } = getNodeDimensions(node.type);
  const width = node.width ?? defaultWidth;
  const height = node.height ?? defaultHeight;
  
  // 标签高度（所有节点都有标签 + mb-2）
  const LABEL_HEIGHT = 28;
  
  const x = port === 'left' ? node.x : node.x + width;
  // 连接点应该对齐内容区域的中心，而不是整个节点（包括标签）的中心
  const y = node.y + LABEL_HEIGHT + (height - LABEL_HEIGHT) / 2;
  return { x, y };
};

const INITIAL_NODES: Node[] = [
  { id: '1', type: 'image', x: 100, y: 200, title: 'Image A', content: '', status: 'done', previewUrl: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=100&w=1600&fit=crop' },
  { id: '2', type: 'image', x: 500, y: 200, title: 'Image B', content: '', status: 'done', previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=100&w=1600&fit=crop' },
  { id: '3', type: 'video', x: 900, y: 200, title: 'Video C', content: '', status: 'idle', aspectRatio: '16:9' },
  { id: '4', type: 'text', x: 500, y: 550, title: 'Text D', content: '1. 开启你的创作...' },
  { id: '5', type: 'image', x: 100, y: 500, title: 'Image E', content: '', status: 'done', previewUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=100&w=1600&fit=crop' },
  { id: '6', type: 'video', x: 1300, y: 200, title: 'Video F', content: '', status: 'idle', aspectRatio: '16:9' },
];

const INITIAL_CONNECTIONS: Connection[] = [
  { from: '1', to: '3' },
  { from: '2', to: '3' },
  { from: '5', to: '3' },
  { from: '3', to: '6' },
  { from: '4', to: '6' },
];

const WORLD_SIZE = 4000;
const WORLD_OFFSET = 2000;

const ConnectionsLayer = React.memo(({ 
  connections, 
  nodeMap, 
  tempConnection,
  getNodePortCoords,
  onRemoveConnection,
  onEdgeHoverChange
}: { 
  connections: Connection[], 
  nodeMap: Record<string, Node>,
  tempConnection: { fromNode: string, fromPort: 'left'|'right', mouseX: number, mouseY: number, snappedTarget?: {nodeId: string, port: 'left'|'right'} } | null,
  getNodePortCoords: (node: Node, port: 'left'|'right') => {x: number, y: number},
  onRemoveConnection: (from: string, to: string) => void,
  onEdgeHoverChange?: (isHovered: boolean, edgeId: string) => void
}) => {
  return (
    <svg className="absolute top-0 left-0 pointer-events-none z-0" style={{ width: '100%', height: '100%', overflow: 'visible', minWidth: 1, minHeight: 1 }}>
      {connections.map((conn, idx) => {
        const fromNode = nodeMap[conn.from];
        const toNode = nodeMap[conn.to];
        if (!fromNode || !toNode) return null;

        const fromCoords = getNodePortCoords(fromNode, 'right');
        const toCoords = getNodePortCoords(toNode, 'left');
        
        // 为每条连线生成唯一 ID
        const edgeId = `${conn.from}-${conn.to}`;

        return (
          <BezierEdge
            key={idx}
            edgeId={edgeId}
            startX={fromCoords.x}
            startY={fromCoords.y}
            endX={toCoords.x}
            endY={toCoords.y}
            fromPort="right"
            toPort="left"
            onDelete={() => onRemoveConnection(conn.from, conn.to)}
            onHoverChange={onEdgeHoverChange}
          />
        );
      })}
      {tempConnection && (
        (() => {
          const fromNode = nodeMap[tempConnection.fromNode];
          if (!fromNode) return null;
          const fromCoords = getNodePortCoords(fromNode, tempConnection.fromPort);
          const toX = tempConnection.mouseX;
          const toY = tempConnection.mouseY;
          
          return (
            <g>
              <BezierEdge
                startX={fromCoords.x}
                startY={fromCoords.y}
                endX={toX}
                endY={toY}
                fromPort={tempConnection.fromPort}
                toPort={tempConnection.fromPort === 'right' ? 'left' : 'right'}
                isTemp={true}
              />
              {tempConnection.snappedTarget && (
                <circle 
                  cx={toX} 
                  cy={toY} 
                  r={8} 
                  fill="none" 
                  stroke="rgba(255,255,255,0.8)" 
                  strokeWidth={2}
                  className="animate-pulse"
                />
              )}
            </g>
          );
        })()
      )}
    </svg>
  );
});

export const InfiniteCanvas: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const projectName = location.state?.projectName || t.workspace.untitled;

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Zustand State
  const nodes = useCanvasStore((state) => state.nodes);
  const setNodes = useCanvasStore((state) => state.setNodes);
  const connections = useCanvasStore((state) => state.connections);
  const setConnections = useCanvasStore((state) => state.setConnections);
  const removeConnection = useCanvasStore((state) => state.removeConnection);
  const addConnection = useCanvasStore((state) => state.addConnection);
  const updateNode = useCanvasStore((state) => state.updateNode);
  const { scale, x, y } = useCanvasStore((state) => state.viewState);
  const setViewState = useCanvasStore((state) => state.setViewState);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const themeColors = useCanvasStore((state) => state.themeColors);
  const { openSettings } = useUIStore();
  
  // Mapping local state to Zustand viewState for smooth transition
  const position = { x, y };
  const setPosition = (pos: { x: number, y: number } | ((prev: { x: number, y: number }) => { x: number, y: number })) => {
    if (typeof pos === 'function') {
      const newPos = pos({ x, y });
      setViewState(prev => ({ ...prev, x: newPos.x, y: newPos.y }));
    } else {
      setViewState(prev => ({ ...prev, x: pos.x, y: pos.y }));
    }
  };
  const setScale = (newScale: number | ((prev: number) => number)) => {
    if (typeof newScale === 'function') {
      setViewState(prev => ({ ...prev, scale: newScale(prev.scale) }));
    } else {
      setViewState(prev => ({ ...prev, scale: newScale }));
    }
  };

  const updateNodes = useCanvasStore((state) => state.updateNodes);

  const [windowSize, setWindowSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1920, height: typeof window !== 'undefined' ? window.innerHeight : 1080 });

  // Initialize store with default data on mount
  useEffect(() => {
    const isLoaded = loadStateFromStorage();
    if (!isLoaded && nodes.length === 0) {
      setNodes(INITIAL_NODES);
      setConnections(INITIAL_CONNECTIONS);
    }
    
    const unsubscribe = setupAutoSave();
    return () => unsubscribe();
  }, []);

  // Interaction states
  const [isPanning, setIsPanning] = useState(false);
  const [dragInfo, setDragInfo] = useState<{ startX: number, startY: number, startPosX: number, startPosY: number } | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const tempConnectionRef = useRef<{
    fromNode: string;
    fromPort: 'left' | 'right';
    mouseX: number;
    mouseY: number;
    snappedTarget?: { nodeId: string; port: 'left' | 'right' };
  } | null>(null);

  const [tempConnectionState, setTempConnectionState] = useState<{
    fromNode: string;
    fromPort: 'left' | 'right';
    mouseX: number;
    mouseY: number;
    snappedTarget?: { nodeId: string; port: 'left' | 'right' };
  } | null>(null);

  const setTempConnection = useCallback((val: React.SetStateAction<{
    fromNode: string;
    fromPort: 'left' | 'right';
    mouseX: number;
    mouseY: number;
    snappedTarget?: { nodeId: string; port: 'left' | 'right' };
  } | null>) => {
    tempConnectionRef.current = typeof val === 'function' ? val(tempConnectionRef.current) : val;
    setTempConnectionState(tempConnectionRef.current);
  }, []);

  const tempConnection = tempConnectionState;
  
  const dragNodesDataRef = useRef<{ 
    startX: number; 
    startY: number; 
    currentX: number; 
    currentY: number; 
    hasDragged: boolean;
    nodesMap: Map<string, {startX: number; startY: number}> 
  } | null>(null);
  const dragRafRef = useRef<number | null>(null);
  
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const selectedNodesRef = useRef(selectedNodes);
  const nodesRef = useRef(nodes);
  
  // 组和资产相关状态
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [isAssetPanelOpen, setIsAssetPanelOpen] = useState(false);
  const { groups, addGroup, updateGroup } = useGroupStore();
  const { addAsset, addTemplate } = useAssetStore();

  // Sync selectedNodeId with Zustand for Side Panel
  const setSelectedNodeId = useCanvasStore((state) => state.setSelectedNodeId);
  useEffect(() => {
    if (selectedNodes.length === 1) {
      setSelectedNodeId(selectedNodes[0]);
    } else {
      setSelectedNodeId(null);
    }
  }, [selectedNodes, setSelectedNodeId]);

  useEffect(() => {
    selectedNodesRef.current = selectedNodes;
    nodesRef.current = nodes;
  }, [selectedNodes, nodes]);

  const selectionVisualRef = useRef<HTMLDivElement>(null);
  const selectionDataRef = useRef<{ 
    startX: number, startY: number, 
    currentX: number, currentY: number, 
    startMouseX: number, startMouseY: number, 
    active: boolean 
  } | null>(null);
  const rafRef = useRef<number | null>(null);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [generatingNodes, setGeneratingNodes] = useState<Record<string, boolean>>({});
  
  const [dropMenu, setDropMenu] = useState<{
    x: number;
    y: number;
    screenX: number;
    screenY: number;
    fromNode?: string;
    fromPort?: 'left' | 'right';
  } | null>(null);

  // New UI states
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(() => {
    // 从 localStorage 读取头像
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userAvatar');
    }
    return null;
  });
  const [userName, setUserName] = useState("郭毛毛");
  const [userEmail, setUserEmail] = useState("332387138@qq.com");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState({ name: "", email: "" });
  const [activeNavItem, setActiveNavItem] = useState<string | null>(null); // 追踪当前悬浮的按钮
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isMinimapOpen, setIsMinimapOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [showZoomToast, setShowZoomToast] = useState(false);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navAnimationRef = useRef<number | null>(null);
  const navHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null); // 文件上传引用
  const avatarInputRef = useRef<HTMLInputElement | null>(null); // 头像上传引用

  // Panning with spacebar
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  const viewStateRef = useRef({ position, scale });
  useEffect(() => {
    viewStateRef.current = { position, scale };
  }, [position, scale]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [clipboardNodes, setClipboardNodes] = useState<Node[]>([]);
  const clipboardNodesRef = useRef<Node[]>([]);
  
  useEffect(() => {
    clipboardNodesRef.current = clipboardNodes;
  }, [clipboardNodes]);

  const handleExport = useCallback(() => {
    const state = useCanvasStore.getState();
    const exportData = {
      nodes: state.nodes,
      connections: state.connections,
      viewState: state.viewState,
      projectName
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'project'}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [projectName]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);
          
          if (data && Array.isArray(data.nodes) && Array.isArray(data.connections)) {
            const state = useCanvasStore.getState();
            state.saveHistory();
            state.setNodes(data.nodes);
            state.setConnections(data.connections);
            if (data.viewState) {
              state.setViewState(data.viewState);
            }
          } else {
            alert('无效的项目文件格式');
          }
        } catch (err) {
          console.error('导入失败:', err);
          alert('导入失败，请检查文���是否损坏');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        (e.target as HTMLElement).isContentEditable
      ) return;
      
      if (e.code === 'Space') {
        setIsSpacePressed(true);
        e.preventDefault();
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        // 如果有选中的节点，打开创建资产对话框
        if (selectedNodesRef.current.length > 0) {
          setShowAssetDialog(true);
        } else {
          // 没有选中节点时，导出整个画布
          handleExport();
        }
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        handleImport();
      }

      // Open Settings with Cmd/Ctrl + ,
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        openSettings();
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodesRef.current.length > 0) {
          useCanvasStore.getState().saveHistory();
          const selectedSet = new Set(selectedNodesRef.current);
          const updatedNodes = useCanvasStore.getState().nodes.filter(n => !selectedSet.has(n.id));
          useCanvasStore.getState().setNodes(updatedNodes);
          const updatedConns = useCanvasStore.getState().connections.filter(c => !selectedSet.has(c.from) && !selectedSet.has(c.to));
          useCanvasStore.getState().setConnections(updatedConns);
          setSelectedNodes([]);
        }
      }

      // Undo/Redo shortcuts
      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      if (cmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useCanvasStore.getState().redo();
        } else {
          useCanvasStore.getState().undo();
        }
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        useCanvasStore.getState().redo();
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        if (selectedNodesRef.current.length > 0) {
          const nodesToCopy = nodesRef.current.filter(n => selectedNodesRef.current.includes(n.id));
          setClipboardNodes(nodesToCopy);
        }
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        const currentClipboard = clipboardNodesRef.current;
        if (currentClipboard.length > 0) {
          // 计算当前视口中心的世界坐���
          const { position, scale } = viewStateRef.current;
          const viewportCenterX = (-position.x + windowSize.width / 2) / scale;
          const viewportCenterY = (-position.y + windowSize.height / 2) / scale;
          
          // 计算复制节点组的边界框中心
          let minX = Infinity, maxX = -Infinity;
          let minY = Infinity, maxY = -Infinity;
          
          currentClipboard.forEach(n => {
            const { width, height } = getNodeDimensions(n.type);
            
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x + width);
            minY = Math.min(minY, n.y);
            maxY = Math.max(maxY, n.y + height);
          });
          
          const groupCenterX = (minX + maxX) / 2;
          const groupCenterY = (minY + maxY) / 2;
          
          // 计算偏移量，将节点组中心移动到视口中心
          const offsetX = viewportCenterX - groupCenterX;
          const offsetY = viewportCenterY - groupCenterY;
          
          // 创建节点 ID ��射（用于复制连线）
          const oldIdToNewId = new Map<string, string>();
          const oldIds = new Set(currentClipboard.map(n => n.id));
          
          // 创建新节点，应用偏移
          const newNodes = currentClipboard.map(n => {
            const newId = Date.now().toString() + Math.random().toString(36).substring(7);
            oldIdToNewId.set(n.id, newId);
            return {
              ...n,
              id: newId,
              x: n.x + offsetX,
              y: n.y + offsetY,
            };
          });
          
          // 复制相关的连线（只复制节点组内部的连线）
          const currentConnections = useCanvasStore.getState().connections;
          const copiedConnections = currentConnections
            .filter(conn => oldIds.has(conn.from) && oldIds.has(conn.to))
            .map(conn => ({
              from: oldIdToNewId.get(conn.from)!,
              to: oldIdToNewId.get(conn.to)!
            }));
          
          useCanvasStore.getState().saveHistory();
          setNodes(prev => [...prev, ...newNodes]);
          setConnections(prev => [...prev, ...copiedConnections]);
          setSelectedNodes(newNodes.map(n => n.id));
          setClipboardNodes(newNodes);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // 清理导航栏悬浮定时器
      if (navHoverTimeoutRef.current) {
        clearTimeout(navHoverTimeoutRef.current);
      }
    };
  }, [handleExport, handleImport]);

  useEffect(() => {
    const handleBlur = () => {
      setIsSpacePressed(false);
      setIsPanning(false);
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  const triggerZoomToast = () => {
    setShowZoomToast(true);
    if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    zoomTimeoutRef.current = setTimeout(() => setShowZoomToast(false), ANIMATION_CONFIG.zoomToastDuration);
  };

  // 平滑导航到目标位置
  const smoothNavigateTo = useCallback((targetPos: { x: number; y: number }) => {
    if (navAnimationRef.current) {
      cancelAnimationFrame(navAnimationRef.current);
    }

    const startPos = { ...position };
    const startTime = Date.now();
    const duration = ANIMATION_CONFIG.minimapNavDuration;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 缓动函数：cubic-bezier(0.4, 0, 0.2, 1)
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentX = startPos.x + (targetPos.x - startPos.x) * easeProgress;
      const currentY = startPos.y + (targetPos.y - startPos.y) * easeProgress;

      setPosition({ x: currentX, y: currentY });

      if (progress < 1) {
        navAnimationRef.current = requestAnimationFrame(animate);
      } else {
        navAnimationRef.current = null;
      }
    };

    navAnimationRef.current = requestAnimationFrame(animate);
  }, [position]);

  // 清理导航动画
  useEffect(() => {
    return () => {
      if (navAnimationRef.current) {
        cancelAnimationFrame(navAnimationRef.current);
      }
    };
  }, []);

  const handleZoom = useCallback((direction: 'in' | 'out', center?: { x: number, y: number }) => {
    const scaleBy = 1.1;
    const oldScale = scale;
    const pointer = center || { x: windowSize.width / 2, y: windowSize.height / 2 };

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    let newScale = direction === 'in' ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(CANVAS_CONFIG.minScale, Math.min(CANVAS_CONFIG.maxScale, newScale));
    
    if (newScale === oldScale) return;

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    });
    triggerZoomToast();
  }, [scale, position, windowSize]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!containerRef.current) return;
    
    // 检查事件目标是否是可滚动元素（textarea, input, 或带有滚动的div）
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'TEXTAREA' || 
      target.tagName === 'INPUT' ||
      target.classList.contains('overflow-y-auto') ||
      target.classList.contains('overflow-auto') ||
      target.closest('textarea') ||
      target.closest('input') ||
      target.closest('[data-scrollable]')
    ) {
      // 允许文本框和输入框正常滚动，不阻止默认行为，不移动画布
      return;
    }
    
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY * CANVAS_CONFIG.smoothZoomFactor;
      const newScale = Math.min(
        Math.max(CANVAS_CONFIG.minScale, scale * Math.exp(delta)), 
        CANVAS_CONFIG.maxScale
      );
      
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const ratio = 1 - newScale / scale;
      const newX = position.x + (mouseX - position.x) * ratio;
      const newY = position.y + (mouseY - position.y) * ratio;

      setScale(newScale);
      setPosition({ x: newX, y: newY });
      triggerZoomToast();
    } else {
      setPosition(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  }, [scale, position]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (e.button === 1 || isSpacePressed) {
      e.preventDefault();
      setIsPanning(true);
      setDragInfo({
        startX: e.clientX,
        startY: e.clientY,
        startPosX: position.x,
        startPosY: position.y
      });
    } else if (e.button === 0) {
      const target = e.target as HTMLElement;
      if (target.closest('.node-element') || target.closest('.ui-overlay') || target.closest('.no-drag')) {
        return;
      }
      setSelectedNodes([]);
      setIsAgentOpen(false);
      setIsMinimapOpen(false);
      setIsAssetPanelOpen(false); // 点击画布时关闭资产面板
      
      if (selectionVisualRef.current) {
        selectionVisualRef.current.classList.add('hidden');
      }
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - position.x) / scale;
        const y = (e.clientY - rect.top - position.y) / scale;
        selectionDataRef.current = { 
          startX: x, startY: y, 
          currentX: x, currentY: y, 
          startMouseX: e.clientX, startMouseY: e.clientY,
          active: false 
        };
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (tempConnectionRef.current) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const { position, scale } = viewStateRef.current;
        const x = (e.clientX - rect.left - position.x) / scale;
        const y = (e.clientY - rect.top - position.y) / scale;
        
        let snappedX = x;
        let snappedY = y;
        let snappedTarget = undefined;
        let minDistance = Infinity;
        const temp = tempConnectionRef.current;
        
        nodesRef.current.forEach(node => {
          if (node.id === temp.fromNode) return;
          const targetPort = temp.fromPort === 'left' ? 'right' : 'left';
          
          // Prevent snapping to the left port of an uploaded image node
          if (node.type === 'image' && node.isUploaded && targetPort === 'left') {
            return;
          }

          const coords = getNodePortCoords(node, targetPort);
          
          const nodeW = 220;
          const nodeH = node.type === 'image' ? 180 : 160;
          // Check if cursor is inside or very close to the node (within 60px padding)
          const isOverNode = 
            x >= node.x - 60 && x <= node.x + nodeW + 60 &&
            y >= node.y - 60 && y <= node.y + nodeH + 60;
            
          if (isOverNode) {
            const dist = Math.hypot(coords.x - x, coords.y - y);
            if (dist < minDistance) {
              minDistance = dist;
              snappedX = coords.x;
              snappedY = coords.y;
              snappedTarget = { nodeId: node.id, port: targetPort as 'left'|'right' };
            }
          }
        });

        setTempConnection(prev => prev ? { ...prev, mouseX: snappedX, mouseY: snappedY, snappedTarget } : null);
      }
    } else if (isPanning && dragInfo) {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          setPosition({
            x: dragInfo.startPosX + (e.clientX - dragInfo.startX),
            y: dragInfo.startPosY + (e.clientY - dragInfo.startY)
          });
          rafRef.current = null;
        });
      }
    } else if (dragNodesDataRef.current) {
      const data = dragNodesDataRef.current;
      data.currentX = e.clientX;
      data.currentY = e.clientY;
      
      if (dragRafRef.current === null) {
        dragRafRef.current = requestAnimationFrame(() => {
          if (dragNodesDataRef.current) {
            const currentData = dragNodesDataRef.current;
            const { scale } = viewStateRef.current;
            const dx = (currentData.currentX - currentData.startX) / scale;
            const dy = (currentData.currentY - currentData.startY) / scale;
            
            // Only trigger history save on first actual movement > 2px to avoid saving history for pure clicks
            if (!currentData.hasDragged && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
              currentData.hasDragged = true;
              useCanvasStore.getState().saveHistory();
            }

            const updates: {id: string, x: number, y: number}[] = [];
            currentData.nodesMap.forEach((startPos, id) => {
              updates.push({
                id,
                x: startPos.startX + dx,
                y: startPos.startY + dy
              });
            });
            
            if (updates.length > 0 && currentData.hasDragged) {
              updateNodes(updates);
            }
          }
          dragRafRef.current = null;
        });
      }
    } else if (selectionDataRef.current) {
      const data = selectionDataRef.current;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const { position, scale } = viewStateRef.current;
      const x = (e.clientX - rect.left - position.x) / scale;
      const y = (e.clientY - rect.top - position.y) / scale;
      
      if (!data.active) {
        const dx = e.clientX - data.startMouseX;
        const dy = e.clientY - data.startMouseY;
        if (Math.sqrt(dx * dx + dy * dy) > 5) {
          data.active = true;
        }
      }
      
      if (data.active) {
        data.currentX = x;
        data.currentY = y;
        
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
            const currentData = selectionDataRef.current;
            if (currentData && currentData.active && selectionVisualRef.current) {
              const minX = Math.min(currentData.startX, currentData.currentX);
              const maxX = Math.max(currentData.startX, currentData.currentX);
              const minY = Math.min(currentData.startY, currentData.currentY);
              const maxY = Math.max(currentData.startY, currentData.currentY);
              
              const width = maxX - minX;
              const height = maxY - minY;
              
              if (width < 2 || height < 2) {
                selectionVisualRef.current.classList.add('hidden');
              } else {
                selectionVisualRef.current.classList.remove('hidden');
                selectionVisualRef.current.style.left = `${minX}px`;
                selectionVisualRef.current.style.top = `${minY}px`;
                selectionVisualRef.current.style.width = `${width}px`;
                selectionVisualRef.current.style.height = `${height}px`;
              }
              
              const newlySelected = nodesRef.current.filter(n => {
                return isRectIntersectNode(minX, minY, maxX - minX, maxY - minY, n);
              }).map(n => n.id);
              
              const isSame = newlySelected.length === selectedNodesRef.current.length && 
                newlySelected.every((id, idx) => id === selectedNodesRef.current[idx]);
                
              if (!isSame) {
                setSelectedNodes(newlySelected);
              }
            }
            rafRef.current = null;
          });
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}

    if (tempConnectionRef.current) {
      const temp = tempConnectionRef.current;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const { position, scale } = viewStateRef.current;
        const x = (e.clientX - rect.left - position.x) / scale;
        const y = (e.clientY - rect.top - position.y) / scale;
        
        let closestNode = null;
        let closestPort: 'left'|'right'|null = null;
        let minDistance = Infinity;
        
        nodesRef.current.forEach(node => {
          if (node.id === temp.fromNode) return;
          
          const targetPort = getTargetPortType(temp.fromPort);

          // Prevent connecting to the left port of an uploaded image node
          if (node.type === 'image' && node.isUploaded && targetPort === 'left') {
            return;
          }

          const coords = getNodePortCoords(node, targetPort);
          
          // Check if cursor is inside or very close to the node (使用更大的吸附距离)
          const isOverNode = isPointInNode(x, y, node, PORT_CONFIG.releaseDistance);
            
          if (isOverNode) {
            const dist = Math.hypot(coords.x - x, coords.y - y);
            // 如果在吸附范围内，记录最近的节点
            if (dist < PORT_CONFIG.releaseDistance && dist < minDistance) {
              minDistance = dist;
              closestNode = node;
              closestPort = targetPort;
            }
          }
        });

        if (closestNode && closestPort) {
          const toNodeId = closestNode.id;
          
          if (!isConnectionExists(useCanvasStore.getState().connections, temp.fromNode, toNodeId) && 
              canCreateConnection(temp.fromPort, closestPort)) {
            useCanvasStore.getState().saveHistory();
            const { from, to } = normalizeConnection(temp.fromNode, toNodeId, temp.fromPort, closestPort);
            setConnections(prev => [...prev, { from, to }]);
          }
        } else {
          // Drop in empty space, show menu
          setDropMenu({
            x,
            y,
            screenX: e.clientX,
            screenY: e.clientY,
            fromNode: temp.fromNode,
            fromPort: temp.fromPort
          });
        }
      }
    }

    setIsPanning(false);
    setDragInfo(null);
    setTempConnection(null);
    
    if (dragNodesDataRef.current) {
      dragNodesDataRef.current = null;
    }
    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    
    if (selectionDataRef.current) {
      selectionDataRef.current = null;
      if (selectionVisualRef.current) {
        selectionVisualRef.current.classList.add('hidden');
      }
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const handlePortPointerDown = useCallback((e: React.PointerEvent, nodeId: string, port: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { position, scale } = viewStateRef.current;
    const x = (e.clientX - rect.left - position.x) / scale;
    const y = (e.clientY - rect.top - position.y) / scale;
    setTempConnection({
      fromNode: nodeId,
      fromPort: port,
      mouseX: x,
      mouseY: y
    });
  }, []);

  const handlePortPointerUp = useCallback((e: React.PointerEvent, nodeId: string, port: 'left' | 'right') => {
    e.stopPropagation();
    if (tempConnectionRef.current && tempConnectionRef.current.fromNode !== nodeId) {
      const temp = tempConnectionRef.current;
      
      const targetNode = useCanvasStore.getState().nodes.find(n => n.id === nodeId);
      if (targetNode?.type === 'image' && targetNode.isUploaded && port === 'left') {
        return;
      }

      if (!isConnectionExists(useCanvasStore.getState().connections, temp.fromNode, nodeId) && 
          canCreateConnection(temp.fromPort, port)) {
        useCanvasStore.getState().saveHistory();
        const { from, to } = normalizeConnection(temp.fromNode, nodeId, temp.fromPort, port);
        setConnections(prev => [...prev, { from, to }]);
      }
    }
    setTempConnection(null);
  }, [setTempConnection]);

  const handleNodePointerDown = useCallback((e: React.PointerEvent, node: Node) => {
    if (e.button !== 0 || isSpacePressed) return;
    e.stopPropagation();
    
    // Close panels
    setIsAgentOpen(false);
    setIsMinimapOpen(false);
    
    let activeNodes = selectedNodesRef.current;
    
    // Ctrl/Cmd+点击：多选/取消选中
    if (e.ctrlKey || e.metaKey) {
      if (activeNodes.includes(node.id)) {
        // 取消选���
        activeNodes = activeNodes.filter(id => id !== node.id);
      } else {
        // 添加到选中
        activeNodes = [...activeNodes, node.id];
      }
      setSelectedNodes(activeNodes);
    } else {
      // 普通点击：替换选中
      if (!activeNodes.includes(node.id)) {
        activeNodes = [node.id];
        setSelectedNodes(activeNodes);
      }
    }
    
    // 如果是 Ctrl/Cmd 点���，不启动拖���
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    
    const nodesMap = new Map();
    activeNodes.forEach(id => {
      const n = nodesRef.current.find(node => node.id === id);
      if (n) {
        nodesMap.set(n.id, { startX: n.x, startY: n.y });
      }
    });

    dragNodesDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      hasDragged: false,
      nodesMap
    };
    
    // Capture pointer after state updates
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // Ignore
    }
  }, [isSpacePressed]);

  const handleSettingsClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selectedNodesRef.current.includes(id)) {
      setIsPanelOpen(true);
    }
  }, []);

  // 导航栏悬浮控制 - 针对特定按钮
  const handleNavItemHover = useCallback((itemId: string) => {
    // 清除之前的延迟
    if (navHoverTimeoutRef.current) {
      clearTimeout(navHoverTimeoutRef.current);
    }
    
    // 设置当前悬浮的按钮
    setActiveNavItem(itemId);
    
    if (itemId === 'add') {
      navHoverTimeoutRef.current = setTimeout(() => {
        setIsAddMenuOpen(true);
        setIsProfileMenuOpen(false);
        setIsHelpMenuOpen(false);
        setIsAssetPanelOpen(false); // 关闭资产面板
      }, 150);
    } else if (itemId === 'count') {
      navHoverTimeoutRef.current = setTimeout(() => {
        setIsProfileMenuOpen(true);
        setIsAddMenuOpen(false);
        setIsHelpMenuOpen(false);
        setIsAssetPanelOpen(false); // 关闭资产面板
      }, 150);
    } else if (itemId === 'help') {
      navHoverTimeoutRef.current = setTimeout(() => {
        setIsHelpMenuOpen(true);
        setIsAddMenuOpen(false);
        setIsProfileMenuOpen(false);
        setIsAssetPanelOpen(false); // 关闭资产面板
      }, 150);
    } else if (itemId === 'assets') {
      navHoverTimeoutRef.current = setTimeout(() => {
        setIsAssetPanelOpen(true); // 打开资产面板
        setIsAddMenuOpen(false);
        setIsProfileMenuOpen(false);
        setIsHelpMenuOpen(false);
      }, 150);
    } else {
      // 其他按钮立即关闭所有侧边菜单和面板
      setIsAddMenuOpen(false);
      setIsProfileMenuOpen(false);
      setIsHelpMenuOpen(false);
      setIsAssetPanelOpen(false);
    }
  }, []);

  const handleNavMouseLeave = useCallback(() => {
    // 清除延迟定时器
    if (navHoverTimeoutRef.current) {
      clearTimeout(navHoverTimeoutRef.current);
      navHoverTimeoutRef.current = null;
    }
    // 关闭所有菜单
    setIsAddMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsHelpMenuOpen(false);
    setActiveNavItem(null);
  }, []);

  // 处理头像上传
  const handleAvatarUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("头像图片不能超过 5MB");
      return;
    }
    
    // 将图片转换为 base64 格式
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setUserAvatar(base64String);
      // 保存到 localStorage
      localStorage.setItem('userAvatar', base64String);
    };
    reader.readAsDataURL(file);
    
    // 清空 input 值，以便可以重复上传同一文件
    if (event.target) {
      event.target.value = '';
    }
  }, []);

  // 处理文件上传
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const fileType = file.type;
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      let nodeType: Node['type'] = 'text';
      let title = fileName;

      // 文件大小限制（200MB）
      const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
      if (file.size > MAX_FILE_SIZE) {
        alert(`文件 "${fileName}" 大小超过 200MB，无法上传`);
        return;
      }

      // 根据文件类型确定节点类型（支持更多格式）
      if (fileType.startsWith('image/')) {
        nodeType = 'image';
      } else if (fileType.startsWith('video/')) {
        // 视频限制20MB
        const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB
        if (file.size > MAX_VIDEO_SIZE) {
          alert(`视频文件 "${fileName}" 超过 20MB，请上传更小的视频`);
          return;
        }
        nodeType = 'video';
      } else if (fileType.startsWith('audio/')) {
        nodeType = 'audio';
      } else if (
        // 文本类型
        fileType.includes('text') || 
        // 文档类型
        ['txt', 'doc', 'docx', 'pdf', 'rtf', 'odt', 'md', 'csv'].includes(fileExtension) ||
        // Office 文档
        ['xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension) ||
        // 代码文件
        ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'yaml', 'yml'].includes(fileExtension)
      ) {
        nodeType = 'text';
      }

      // 处理图片：自动检测尺寸并创建自适应节点
      if (nodeType === 'image') {
        const objectURL = URL.createObjectURL(file);
        const img = new Image();
        
        img.onload = () => {
          // 计算自适应尺寸 - 完全根据图片比例
          const maxWidth = 350;
          const aspectRatio = img.width / img.height;
          
          // 头部36px + 底部控制栏40px = 76px
          const HEADER_HEIGHT = 36;
          const FOOTER_HEIGHT = 40;
          const EXTRA_HEIGHT = HEADER_HEIGHT + FOOTER_HEIGHT;
          const MAX_CONTENT_HEIGHT = 600; // 内容区域最大高度，超过则滚动
          
          let nodeWidth: number;
          let nodeHeight: number;
          let contentWidth: number;
          let contentHeight: number;
          
          // 计算内容区域尺寸（图片显示区域）
          if (img.width > maxWidth) {
            // 图片宽度超过最大值，按比例缩放
            contentWidth = maxWidth;
            contentHeight = maxWidth / aspectRatio;
          } else {
            // 图片较小，使用原始尺寸
            contentWidth = img.width;
            contentHeight = img.height;
          }
          
          // 限制内容区域最大高度，超过则显示滚动条
          const displayContentHeight = Math.min(contentHeight, MAX_CONTENT_HEIGHT);
          
          // 节点总尺寸 = 显示高度 + 头部 + 底部
          nodeWidth = contentWidth;
          nodeHeight = displayContentHeight + EXTRA_HEIGHT;
          
          console.log(`[上传图片] ${fileName}`)
          console.log(`  原始: ${img.width}x${img.height}, 比例: ${aspectRatio.toFixed(2)}`);
          console.log(`  内容区域: ${contentWidth}x${contentHeight}`);
          console.log(`  节点总尺寸: ${nodeWidth}x${nodeHeight}`);
          
          const newNode: Node = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'image',
            x: (-position.x + windowSize.width / 2) / scale - nodeWidth/2 + (index * 40),
            y: (-position.y + windowSize.height / 2) / scale - nodeHeight/2 + (index * 40),
            title: title,
            content: '',
            previewUrl: objectURL,
            status: 'done',
            width: nodeWidth,
            height: nodeHeight
          };
          
          setNodes(prev => [...prev, newNode]);
        };
        
        img.src = objectURL;
      } else if (nodeType === 'video') {
        // 处理视频：创建自适应节点
        const objectURL = URL.createObjectURL(file);
        const video = document.createElement('video');
        
        video.onloadedmetadata = () => {
          const maxWidth = 350;
          const aspectRatio = video.videoWidth / video.videoHeight;
          
          const HEADER_HEIGHT = 36;
          const FOOTER_HEIGHT = 40;
          const EXTRA_HEIGHT = HEADER_HEIGHT + FOOTER_HEIGHT;
          const MAX_CONTENT_HEIGHT = 600; // 内容区域最大高度，超过则滚动
          
          let nodeWidth: number;
          let nodeHeight: number;
          let contentWidth: number;
          let contentHeight: number;
          
          // 计算内容区域尺寸
          if (video.videoWidth > maxWidth) {
            contentWidth = maxWidth;
            contentHeight = maxWidth / aspectRatio;
          } else {
            contentWidth = video.videoWidth;
            contentHeight = video.videoHeight;
          }
          
          // 限制内容区域最大高度，超过则显示滚动条
          const displayContentHeight = Math.min(contentHeight, MAX_CONTENT_HEIGHT);
          
          nodeWidth = contentWidth;
          nodeHeight = displayContentHeight + EXTRA_HEIGHT;
          
          console.log(`[上传视频] ${fileName}`);
          console.log(`  原始: ${video.videoWidth}x${video.videoHeight}, 比例: ${aspectRatio.toFixed(2)}`);
          console.log(`  内容区域: ${contentWidth}x${contentHeight}`);
          console.log(`  节点总尺寸: ${nodeWidth}x${nodeHeight}, 时长: ${video.duration}s`);
          
          const newNode: Node = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'video',
            x: (-position.x + windowSize.width / 2) / scale - nodeWidth/2 + (index * 40),
            y: (-position.y + windowSize.height / 2) / scale - nodeHeight/2 + (index * 40),
            title: title,
            content: '',
            previewUrl: objectURL,
            status: 'done',
            width: nodeWidth,
            height: nodeHeight,
            isUploaded: true,
            naturalWidth: video.videoWidth,
            naturalHeight: video.videoHeight
          };
          
          setNodes(prev => [...prev, newNode]);
          URL.revokeObjectURL(video.src);
        };
        
        video.src = objectURL;
      } else if (nodeType === 'audio') {
        // 音频文件
        const objectURL = URL.createObjectURL(file);
        
        const newNode: Node = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'audio',
          x: (-position.x + windowSize.width / 2) / scale - 110 + (index * 40),
          y: (-position.y + windowSize.height / 2) / scale - 80 + (index * 40),
          title: title,
          content: '',
          previewUrl: objectURL,
          status: 'done'
        };
        
        setNodes(prev => [...prev, newNode]);
      } else if (fileExtension === 'docx') {
        // Word文档解析
        const baseX = (-position.x + windowSize.width / 2) / scale - 140;
        const baseY = (-position.y + windowSize.height / 2) / scale - 160;
        parseWordDocument(file, fileName, baseX, baseY, index).then(node => {
          if (node) setNodes(prev => [...prev, node]);
        });
      } else if (['doc', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'].includes(fileExtension)) {
        // 不读取内容，显���文���信��
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const fileInfo = `📄 ${fileName}\n\n📦 大小: ${fileSizeMB} MB\n📅 类型: ${fileExtension.toUpperCase()}\n\n💡 此文件为二进制格式，暂不支持预览。\n您可以下载后使用对应软件打��。`;
        
        const newNode: Node = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'text',
          x: (-position.x + windowSize.width / 2) / scale - 120 + (index * 40),
          y: (-position.y + windowSize.height / 2) / scale - 120 + (index * 40),
          title: `📄 ${fileName}`,
          content: fileInfo
        };
        
        setNodes(prev => [...prev, newNode]);
      } else {
        // 纯文本文件读取内容（限制大小避免崩溃）
        const MAX_TEXT_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_TEXT_SIZE) {
          alert(`文件 "${fileName}" 超过 5MB，文本文件过大无法预览`);
          return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const content = e.target?.result as string;
          
          const newNode: Node = {
            id: Math.random().toString(36).substr(2, 9),
            type: nodeType,
            x: (-position.x + windowSize.width / 2) / scale - 120 + (index * 40),
            y: (-position.y + windowSize.height / 2) / scale - 120 + (index * 40),
            title: title,
            content: content
          };
          
          setNodes(prev => [...prev, newNode]);
        };

        reader.onerror = () => {
          alert(`文件 "${fileName}" 读取失败，请重试`);
        };

        reader.readAsText(file);
      }
    });

    // 关闭菜单
    setIsAddMenuOpen(false);
    
    // 重置 input
    if (event.target) {
      event.target.value = '';
    }
  }, [position.x, position.y, scale, windowSize.width, windowSize.height]);

  const generateMockContent = (prompt: string, params?: Record<string, unknown>) => {
    if (selectedNodes.length === 0) return;
    const targetId = selectedNodes[0];
    setGeneratingNodes(prev => ({ ...prev, [targetId]: true }));
    setTimeout(() => {
      setGeneratingNodes(prev => ({ ...prev, [targetId]: false }));
      setNodes(prev => prev.map(n => {
        if (n.id === targetId) {
          return {
            ...n,
            previewUrl: `https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=400&h=300&fit=crop&sig=${Math.random()}`,
            status: 'done'
          };
        }
        return n;
      }));
    }, ANIMATION_CONFIG.generateDelay);
  };

  const nodeMap = React.useMemo(() => {
    const map: Record<string, Node> = {};
    nodes.forEach(n => map[n.id] = n);
    return map;
  }, [nodes]);

  const selectedNode = selectedNodes.length === 1 ? nodeMap[selectedNodes[0]] : null;
  
  // 处理创建组
  const handleCreateGroup = useCallback(() => {
    if (selectedNodes.length < 2) return;
    
    const groupNodes = nodes.filter(n => selectedNodes.includes(n.id));
    const groupId = addGroup(selectedNodes, groupNodes);
    setSelectedNodes([]);
    setSelectedGroupId(groupId);
  }, [selectedNodes, nodes, addGroup]);
  
  // 处理创建资产
  const handleCreateAsset = useCallback(() => {
    setShowAssetDialog(true);
  }, []);
  
  // 确认创建资产
  const handleConfirmAsset = useCallback((data: {
    name: string;
    category: any;
    description: string;
  }) => {
    const selectedNodesData = nodes.filter(n => selectedNodes.includes(n.id));
    const selectedConnections = connections.filter(
      conn => selectedNodes.includes(conn.from) && selectedNodes.includes(conn.to)
    );
    
    addAsset({
      name: data.name,
      category: data.category,
      description: data.description,
      nodes: selectedNodesData,
      connections: selectedConnections,
      groups: [],
    });
    
    setShowAssetDialog(false);
    alert(`资产 "${data.name}" 已保存！`);
  }, [selectedNodes, nodes, connections, addAsset]);
  
  // 处理组的拖拽
  const handleGroupPointerDown = useCallback((e: React.PointerEvent, group: any) => {
    e.stopPropagation();
    setSelectedGroupId(group.id);
    setSelectedNodes([]);
    
    const dragStart = {
      x: e.clientX,
      y: e.clientY,
      groupX: group.x,
      groupY: group.y,
      nodePositions: group.nodeIds.map((id: string) => {
        const node = nodeMap[id];
        return { id, x: node.x, y: node.y };
      })
    };
    
    const handleMove = (moveE: PointerEvent) => {
      const dx = (moveE.clientX - dragStart.x) / scale;
      const dy = (moveE.clientY - dragStart.y) / scale;
      
      // 更新组位置
      updateGroup(group.id, {
        x: dragStart.groupX + dx,
        y: dragStart.groupY + dy,
      });
      
      // 更新组内节点位置
      dragStart.nodePositions.forEach(({ id, x, y }: any) => {
        updateNode(id, {
          x: x + dx,
          y: y + dy,
        });
      });
    };
    
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [scale, nodeMap, updateGroup, updateNode]);
  
  // 计算多选工具栏位置
  const multiSelectToolbarPos = useMemo(() => {
    if (selectedNodes.length < 2) return { x: 0, y: 0 };
    
    const selectedNodesData = nodes.filter(n => selectedNodes.includes(n.id));
    if (selectedNodesData.length === 0) return { x: 0, y: 0 };
    
    // 计算选中节点的中心位置
    const avgX = selectedNodesData.reduce((sum, n) => sum + n.x, 0) / selectedNodesData.length;
    const avgY = selectedNodesData.reduce((sum, n) => sum + n.y, 0) / selectedNodesData.length;
    
    return {
      x: avgX * scale + position.x,
      y: avgY * scale + position.y,
    };
  }, [selectedNodes, nodes, scale, position]);

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans flex text-white select-none" style={{ backgroundColor: 'var(--canvas-bg, #27252A)' }}>
      {/* 隐藏的文件上传 input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.txt,.doc,.docx,.pdf,.rtf,.odt,.md,.csv,.xls,.xlsx,.ppt,.pptx,.js,.ts,.jsx,.tsx,.html,.css,.json,.xml,.yaml,.yml,.zip,.rar"
        onChange={handleFileUpload}
        className="hidden"
      />
      {/* 隐藏的头像上传 input */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />
      
      {/* --- Main Content Area --- */}
      <div className="relative flex-1 h-full overflow-hidden flex flex-col">
        {/* --- Top Header --- */}
        <header className="absolute top-0 left-0 right-0 h-14 z-[45] flex items-center justify-between px-6 pointer-events-none ui-overlay">
          <div 
            onClick={() => navigate('/workspace')}
            className="flex items-center gap-2 pointer-events-auto group cursor-pointer transition-transform duration-300 hover:scale-105"
          >
            <div className="relative w-[50px] h-[24px] flex justify-between items-center">
              <div className="iooi-eye"></div>
              <div className="iooi-eye"></div>
              <style dangerouslySetInnerHTML={{__html: `
                .iooi-eye {
                  width: 24px;
                  height: 24px;
                  background-color: #fff;
                  background-image: radial-gradient(circle 7px, #050505 100%, transparent 0);
                  background-repeat: no-repeat;
                  border-radius: 50%;
                  animation: eyeMove 10s infinite, blink 10s infinite;
                }
                @keyframes eyeMove {
                  0%, 10% { background-position: center; }
                  13%, 40% { background-position: calc(50% - 7px) 50%; }
                  43%, 70% { background-position: calc(50% + 7px) 50%; }
                  73%, 90% { background-position: 50% calc(50% + 7px); }
                  93%, 100% { background-position: center; }
                }
                @keyframes blink {
                  0%, 10%, 12%, 20%, 22%, 40%, 42%, 60%, 62%, 70%, 72%, 90%, 92%, 98%, 100% { height: 24px; }
                  11%, 21%, 41%, 61%, 71%, 91%, 99% { height: 8px; }
                }
              `}} />
            </div>
            <span className="text-[15px] font-semibold tracking-wide text-white/95 group-hover:text-white transition-colors">{projectName}</span>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg transition-colors cursor-default" title="当前算力/代币">
              <Zap size={14} className="text-white/60" />
              <span className="text-xs font-bold text-white/80">1558</span>
            </button>
            <ThemeColorPicker />
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 transition-colors" title="分享">
              <Share2 size={16} />
            </button>
          </div>
        </header>

        {/* --- Left Sidebar (Dock) --- */}
        <aside 
          className="absolute left-6 top-1/2 -translate-y-1/2 z-[45] ui-overlay"
          onMouseLeave={handleNavMouseLeave}
        >
          <div 
            className="backdrop-blur-xl border border-white/10 p-2 rounded-[32px] flex flex-col items-center gap-2 shadow-2xl relative"
            style={{ backgroundColor: 'color-mix(in srgb, var(--ui-bg, #111111) 80%, transparent)' }}
          >
            {/* Top Toggle Button (Plus/Close) */}
            <button 
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                isAddMenuOpen ? "bg-white/10 text-white/60" : "bg-white/10 text-white hover:bg-white/20 hover:scale-105"
              )}
              onMouseEnter={() => handleNavItemHover('add')}
            >
              {isAddMenuOpen ? <X size={20} /> : <Plus size={20} strokeWidth={2.5} />}
            </button>
            
            <div className="flex flex-col gap-1">
              <SidebarButton 
                icon={Package} 
                label="资产管理" 
                itemId="assets"
                onClick={() => setIsAssetPanelOpen(!isAssetPanelOpen)}
                onHover={() => handleNavItemHover('assets')}
                isHovered={activeNavItem === 'assets'}
              />
              <SidebarButton 
                icon={Layout} 
                label="Layout" 
                itemId="layout"
                onHover={() => handleNavItemHover('layout')}
                isHovered={activeNavItem === 'layout'}
              />
              <SidebarButton 
                icon={MessageCircle} 
                label="Chat" 
                itemId="chat"
                onHover={() => handleNavItemHover('chat')}
                isHovered={activeNavItem === 'chat'}
              />
              <SidebarButton 
                icon={History} 
                label="History" 
                itemId="history"
                onHover={() => handleNavItemHover('history')}
                isHovered={activeNavItem === 'history'}
              />
              <SidebarButton 
                icon={ImageIcon} 
                label="Images" 
                itemId="images"
                onHover={() => handleNavItemHover('images')}
                isHovered={activeNavItem === 'images'}
              />
              <SidebarButton 
                icon={HelpCircle} 
                label="Help & Resources" 
                itemId="help"
                onClick={() => setIsHelpMenuOpen(true)} 
                onHover={() => handleNavItemHover('help')}
                isHovered={activeNavItem === 'help'}
              />
            </div>

            <div className="h-px w-6 bg-white/10 my-1" />

            {/* Bottom Count Button */}
            <button 
              className="w-10 h-10 rounded-[12px] bg-white/5 flex items-center justify-center text-white/40 text-xs font-bold hover:bg-white/10 transition-all overflow-hidden border border-transparent hover:border-white/20 hover:scale-105 shadow-sm"
              onMouseEnter={() => handleNavItemHover('count')}
              onClick={() => setIsProfileMenuOpen(true)}
              title="用户设置"
            >
              {userAvatar ? (
                <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <img src={avatarImg} alt="Avatar" className="w-full h-full object-cover" />
              )}
            </button>

            {/* 不可���的桥接区域，确保鼠标移动时不会离开 hover 区域 */}
            {isAddMenuOpen && (
              <div className="absolute left-[54px] top-0 w-[6px] h-full pointer-events-auto" />
            )}

            {/* --- Secondary Add Menu --- */}
            <AnimatePresence>
              {isAddMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -12, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -12, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  className="absolute left-[60px] top-0 w-[280px] bg-[#161616]/95 backdrop-blur-2xl border border-white/10 rounded-[28px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50"
                >
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3 px-2">{t.canvas.addNode}</h3>
                      <div className="space-y-1">
                        <AddMenuItem 
                          icon={Type} 
                          title={t.canvas.tools.text} 
                          description={t.canvas.tools.textDesc} 
                          onClick={() => {
                            const newNode: Node = {
                              id: Math.random().toString(36).substr(2, 9),
                              type: 'text',
                              x: (-position.x + windowSize.width / 2) / scale - 120,
                              y: (-position.y + windowSize.height / 2) / scale - 120,
                              title: 'Text',
                              content: ''
                            };
                            setNodes(prev => [...prev, newNode]);
                            setSelectedNodes([newNode.id]);
                            setIsAddMenuOpen(false);
                          }}
                        />
                        <AddMenuItem 
                          icon={ImageIcon} 
                          title={t.canvas.tools.image} 
                          onClick={() => {
                            const newNode: Node = {
                              id: Math.random().toString(36).substr(2, 9),
                              type: 'image',
                              x: (-position.x + windowSize.width / 2) / scale - 160,
                              y: (-position.y + windowSize.height / 2) / scale - 100,
                              title: 'Image',
                              content: ''
                            };
                            setNodes(prev => [...prev, newNode]);
                            setSelectedNodes([newNode.id]);
                            setIsAddMenuOpen(false);
                          }}
                        />
                        <AddMenuItem 
                          icon={Video} 
                          title={t.canvas.tools.video} 
                          onClick={() => {
                            const newNode: Node = {
                              id: Math.random().toString(36).substr(2, 9),
                              type: 'video',
                              x: (-position.x + windowSize.width / 2) / scale - 160,
                              y: (-position.y + windowSize.height / 2) / scale - 100,
                              title: 'Video',
                              content: '',
                              aspectRatio: '16:9'  // 默认16:9
                            };
                            setNodes(prev => [...prev, newNode]);
                            setSelectedNodes([newNode.id]);
                            setIsAddMenuOpen(false);
                          }}
                        />
                        <AddMenuItem 
                          icon={Music} 
                          title={t.canvas.tools.audio} 
                          onClick={() => {
                            const newNode: Node = {
                              id: Math.random().toString(36).substr(2, 9),
                              type: 'audio',
                              x: (-position.x + windowSize.width / 2) / scale - 160,
                              y: (-position.y + windowSize.height / 2) / scale - 80,
                              title: 'Audio',
                              content: ''
                            };
                            setNodes(prev => [...prev, newNode]);
                            setSelectedNodes([newNode.id]);
                            setIsAddMenuOpen(false);
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3 px-2">{t.canvas.addResource}</h3>
                      <div className="space-y-1">
                        <AddMenuItem 
                          icon={Upload} 
                          title={t.canvas.nodes.upload} 
                          description={t.canvas.nodes.uploadDesc}
                          onClick={() => {
                            fileInputRef.current?.click();
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- User Profile Menu --- */}
            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -12, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -12, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  className="absolute left-[60px] bottom-0 w-[280px] bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 text-sm overflow-hidden font-sans"
                >
                  {/* User Profile Info */}
                  <div className="p-3 pb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-[14px] border border-white/10 bg-[#2a2a2a] flex items-center justify-center text-white/60 font-bold overflow-hidden cursor-pointer hover:bg-[#333] transition-all hover:scale-105 shadow-md shrink-0 relative group"
                        onClick={() => avatarInputRef.current?.click()}
                        title="更换头像"
                      >
                        {userAvatar ? (
                          <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <img src={avatarImg} alt="Avatar" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload size={14} className="text-white" />
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        {isEditingProfile ? (
                          <div className="space-y-1.5 flex flex-col items-start w-full">
                            <input
                              type="text"
                              autoFocus
                              value={tempProfile.name}
                              onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                              placeholder="设置昵称"
                              className="bg-black/40 text-white font-bold text-[15px] tracking-tight leading-tight rounded-md px-2 py-1 w-full border border-white/20 outline-none focus:border-white/50 transition-colors"
                            />
                            <input
                              type="text"
                              value={tempProfile.email}
                              onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                              placeholder="设置邮箱或账号"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (tempProfile.name.trim()) setUserName(tempProfile.name);
                                  if (tempProfile.email.trim()) setUserEmail(tempProfile.email);
                                  setIsEditingProfile(false);
                                }
                                if (e.key === 'Escape') {
                                  setIsEditingProfile(false);
                                }
                              }}
                              className="bg-black/40 text-white/70 font-medium text-[13px] tracking-tight leading-tight rounded-md px-2 py-1 w-full border border-white/20 outline-none focus:border-white/50 transition-colors"
                            />
                            <div className="flex items-center gap-2 pt-1 w-full">
                              <button 
                                onClick={() => {
                                  if (tempProfile.name.trim()) setUserName(tempProfile.name);
                                  if (tempProfile.email.trim()) setUserEmail(tempProfile.email);
                                  setIsEditingProfile(false);
                                }}
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs py-1 rounded transition-colors"
                              >
                                保存
                              </button>
                              <button 
                                onClick={() => setIsEditingProfile(false)}
                                className="flex-1 bg-transparent hover:bg-white/5 text-white/50 text-xs py-1 rounded transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="flex flex-col min-w-0 cursor-pointer hover:bg-white/5 rounded px-1 -ml-1 transition-colors w-full group/profile"
                            onClick={() => {
                              setTempProfile({ name: userName, email: userEmail });
                              setIsEditingProfile(true);
                            }}
                            title="点击修改个人信息"
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-extrabold text-[18px] text-white tracking-tight truncate leading-tight">
                                {userName}
                              </div>
                              <Settings size={12} className="text-white/0 group-hover/profile:text-white/40 transition-colors" />
                            </div>
                            <div className="text-[13px] text-white/40 truncate font-medium mt-0.5">{userEmail}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Computing Power / Tokens */}
                  <div className="px-3 pb-3">
                    <div className="bg-[#1c1c1c]/80 rounded-xl p-3.5 border border-white/5 shadow-inner">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-white/95 text-[14px] font-bold">
                          <Zap size={16} className="text-[#ffba00] fill-[#ffba00]" />
                          <span>算力 Token</span>
                        </div>
                        <span className="text-[13px] text-white/50 font-medium">2.1k / 5.0k</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-gradient-to-r from-[#ffba00] to-[#ffd050] rounded-full" style={{ width: '42%' }}></div>
                      </div>
                      <div className="text-[12px] flex justify-between items-center font-medium">
                        <span className="text-white/40">本月可用额度</span>
                        <span className="text-[#ffba00] cursor-pointer hover:text-[#ffd050] transition-colors">升级获取更多</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-white/5 mx-2" />

                  {/* Cloud Sync Status */}
                  <div className="py-1">
                    <div className="px-4 py-2 flex items-center gap-3 text-[13px] text-white/70">
                      <Cloud size={16} className="text-[#10b981] stroke-[2]" />
                      <span>已同步至云端</span>
                      <span className="text-[12px] text-white/30 ml-auto">刚刚</span>
                    </div>
                  </div>

                  <div className="h-px bg-white/5 mx-2" />

                  {/* Menu Items */}
                  <div className="py-2 space-y-0.5">
                    <button 
                      onClick={() => {
                        openSettings();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left text-[14px]"
                    >
                      <Settings size={18} className="text-white/50" />
                      <span>{t('user.apiConfig')}</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left group text-[14px]">
                      <LogOut size={18} className="text-white/50 group-hover:text-red-400 transition-colors" />
                      <span className="group-hover:text-red-400 transition-colors">退出登录</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- Help & Support Menu --- */}
            <AnimatePresence>
              {isHelpMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -12, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -12, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  className="absolute left-[60px] bottom-[48px] w-[240px] bg-[#1e1e1e] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 text-sm overflow-hidden font-sans"
                >
                  <div className="p-3 pb-2">
                    <div className="font-semibold text-white/90">帮助与支持</div>
                    <div className="text-xs text-white/40 mt-0.5">获取使用指南或反馈问题</div>
                  </div>

                  <div className="h-px bg-white/5 mx-2 my-1" />

                  <div className="py-2 space-y-0.5">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left text-[14px]">
                      <MessageCircle size={18} className="text-white/50" />
                      <span>提供反馈/报告问题</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left text-[14px]">
                      <Play size={18} className="text-white/50" />
                      <span>视频教程</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left text-[14px]">
                      <Sparkles size={18} className="text-white/50" />
                      <span>更新日志 (What's New)</span>
                    </button>
                  </div>

                  <div className="h-px bg-white/5 mx-2 my-1" />

                  <div className="py-2 pb-1 space-y-0.5">
                    <button 
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left text-[14px]"
                      onClick={() => {
                        setIsHelpMenuOpen(false);
                        setIsHelpOpen(true);
                      }}
                    >
                      <Layers size={18} className="text-white/50" />
                      <span>快捷键大全</span>
                      <span className="ml-auto text-[10px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded">⌘ /</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* --- Help Panel --- */}
        <AnimatePresence>
          {isHelpOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm ui-overlay">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-[600px] bg-[#161616] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">快捷键与帮助</h2>
                  <button 
                    onClick={() => setIsHelpOpen(false)}
                    className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-6 grid grid-cols-2 gap-8">
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-white/40 text-sm font-medium mb-4">视图操作</h3>
                      <div className="space-y-4">
                        <ShortcutRow label="平移画布" keys={['Space', 'Drag']} icon={<MousePointer size={12} />} />
                        <ShortcutRow label="缩放画布" keys={['Ctrl', 'Scroll']} />
                        <ShortcutRow label="重置视图" keys={['Shift', '1']} />
                        <ShortcutRow label="适应屏幕" keys={['Shift', '2']} />
                      </div>
                    </section>
                  </div>
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-white/40 text-sm font-medium mb-4">其他</h3>
                      <div className="space-y-4">
                        <ShortcutRow label="删除" keys={['Del']} />
                        <ShortcutRow label="撤销" keys={['Ctrl', 'Z']} />
                        <ShortcutRow label="重做" keys={['Shift', 'Ctrl', 'Z']} />
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- Minimap Layer --- */}
        <AnimatePresence>
          {isMinimapOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-20 left-6 z-40 w-[240px] h-[180px] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden group ui-overlay no-drag"
              style={{ backgroundColor: 'color-mix(in srgb, var(--ui-bg, #111111) 90%, transparent)' }}
            >
              <Minimap 
                nodes={nodes} 
                canvasPosition={position} 
                canvasScale={scale} 
                windowSize={windowSize}
                isAgentOpen={isAgentOpen}
                onNavigate={smoothNavigateTo}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Bottom Left Controls --- */}
        <div className="absolute bottom-6 left-6 z-[45] flex items-center gap-3 ui-overlay no-drag">
          <div 
            className="backdrop-blur-xl border border-white/10 p-1 rounded-2xl flex items-center gap-1 shadow-2xl"
            style={{ backgroundColor: 'color-mix(in srgb, var(--ui-bg, #111111) 80%, transparent)' }}
          >
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
            <button 
              onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
              className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <Maximize size={16} />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <div className="flex items-center gap-3 px-3">
              <button 
                onClick={() => handleZoom('out')}
                className="text-white/20 hover:text-white transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="text-[10px] font-bold text-white/40 min-w-[32px] text-center tabular-nums">
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
          
          <div 
            className="backdrop-blur-xl border border-white/10 p-1 rounded-2xl flex items-center gap-1 shadow-2xl"
            style={{ backgroundColor: 'color-mix(in srgb, var(--ui-bg, #111111) 80%, transparent)' }}
          >
            <button 
              onClick={handleExport}
              className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              title="导出项目 (Ctrl+S)"
            >
              <Save size={16} />
            </button>
            <button 
              onClick={handleImport}
              className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              title="导入项目 (Ctrl+O)"
            >
              <FolderOpen size={16} />
            </button>
          </div>
          
          <button 
            onClick={() => setIsAiAssistantOpen(prev => !prev)}
            className={cn(
              "w-11 h-11 backdrop-blur-xl border rounded-full flex items-center justify-center transition-all shadow-2xl relative",
              isAiAssistantOpen 
                ? "bg-white/20 border-white/20 text-white" 
                : "border-white/10 text-white/40 hover:text-white hover:bg-white/5"
            )}
            style={!isAiAssistantOpen ? { backgroundColor: 'color-mix(in srgb, var(--ui-bg, #111111) 80%, transparent)' } : undefined}
          >
            <HelpCircle size={18} />
            {!isAiAssistantOpen && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-white/80 rounded-full border-2 border-[#111111]"></span>
            )}
          </button>
        </div>

        {/* --- AI Assistant (Doubao-like) --- */}
        <AnimatePresence>
          {isAiAssistantOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute left-6 bottom-[88px] w-[380px] h-[580px] backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-hidden font-sans ui-overlay"
              style={{ backgroundColor: 'color-mix(in srgb, var(--ui-bg, #111111) 80%, transparent)' }}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-4 cursor-default">
                <div className="flex items-center gap-4 text-white/50">
                  <Headset size={18} className="cursor-pointer hover:text-white transition-colors" />
                  <Phone size={18} className="cursor-pointer hover:text-white transition-colors" />
                  <PanelRight size={18} className="cursor-pointer hover:text-white transition-colors" />
                </div>
                <Minus size={20} className="text-white/40 cursor-pointer hover:text-white transition-colors" onClick={() => setIsAiAssistantOpen(false)} />
              </div>

              {/* Chat Body (Empty for now) */}
              <div className="flex-1 overflow-y-auto px-4 flex flex-col justify-end pb-4">
                <div className="flex flex-col gap-4 text-sm">
                  {/* Mock welcome message */}
                  <div className="flex gap-3 items-end">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                      <Bot size={18} className="text-white/80" />
                    </div>
                    <div className="bg-white/5 border border-white/10 text-white/90 px-4 py-3 rounded-2xl rounded-bl-sm max-w-[85%] backdrop-blur-md">
                      你好！我是你的 AI 助手，有什么可以帮你的吗？你可以让我帮你写作、生成节点或者分析内容。
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 pt-0">
                <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)] p-3 pb-2 flex flex-col gap-3">
                  <input 
                    type="text" 
                    placeholder="发消息或输入'/'选择技能" 
                    className="w-full bg-transparent outline-none text-[14px] text-white/90 placeholder-white/40 px-1"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-3 text-white/50">
                      <button className="hover:text-white transition-colors">
                        <Plus size={20} />
                      </button>
                      <div className="w-px h-3 bg-white/10" />
                      <button className="flex items-center gap-1 text-[13px] hover:text-white transition-colors">
                        <Zap size={14} /> 快速
                      </button>
                      <button className="flex items-center gap-1 text-[13px] hover:text-white transition-colors">
                        <Pen size={14} /> 帮我写作
                      </button>
                      <button className="flex items-center gap-1 text-[13px] hover:text-white transition-colors">
                        <Grip size={14} /> 更多
                      </button>
                    </div>
                    <button className="w-8 h-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                      <Mic size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Zoom Toast --- */}
        <AnimatePresence>
          {showZoomToast && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl pointer-events-none ui-overlay"
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
            className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all z-50 group ui-overlay no-drag"
          >
            <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
          </button>
        )}

        {/* Main Canvas Area */}
        <div 
          ref={containerRef}
          className={cn(
            "absolute inset-0 z-0",
            isSpacePressed ? "cursor-grab" : "cursor-default",
            isPanning ? "cursor-grabbing" : ""
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={(e) => {
            // 如果鼠标在连线上，不触发创建节点菜单
            if (hoveredEdgeId) return;
            if (e.target !== containerRef.current && e.target !== containerRef.current?.firstChild) return;
            const x = (e.clientX - position.x) / scale;
            const y = (e.clientY - position.y) / scale;
            setDropMenu({
              x,
              y,
              screenX: e.clientX,
              screenY: e.clientY
            });
          }}
        >
          {/* Subtle Color Gradient - 色彩调和层 */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              background: 'radial-gradient(circle at 30% 40%, rgba(138, 43, 226, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(75, 0, 130, 0.08) 0%, transparent 50%)'
            }}
          />

          {/* Noise Layer - 噪点质感层 */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              mixBlendMode: 'overlay'
            }}
          />

          {/* Vignette - 边缘渐暗效果 */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.2) 100%)'
            }}
          />

          {/* Canvas Texture */}
          {themeColors.canvasTexture && themeColors.canvasTexture !== 'none' && (
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.15]"
              style={{
                backgroundImage: `url(${getTextureUrl(themeColors.canvasTexture)})`,
                backgroundSize: '160px 160px',
                backgroundRepeat: 'repeat',
                backgroundPosition: `${position.x % 160}px ${position.y % 160}px`,
                mixBlendMode: 'soft-light'
              }}
            />
          )}

          {/* Background Grid - 优化的网格 */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundSize: `${24 * scale}px ${24 * scale}px`,
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)`,
              backgroundPosition: `${position.x}px ${position.y}px`
            }}
          />

          <div 
            className="absolute origin-top-left w-full h-full pointer-events-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
          >
            {/* Selection Box Layer */}
            <div 
              ref={selectionVisualRef}
              className="absolute border border-white/40 bg-white/5 pointer-events-none z-10 hidden"
            />

            {/* Connections Layer */}
            <ConnectionsLayer 
              connections={connections} 
              nodeMap={nodeMap} 
              tempConnection={tempConnection} 
              getNodePortCoords={getNodePortCoords} 
              onRemoveConnection={(from, to) => {
                // 清理 hover 状态，确保删除后可以正常双击创建节点
                setHoveredEdgeId(null);
                removeConnection(from, to);
              }}
              onEdgeHoverChange={(isHovered, edgeId) => {
                setHoveredEdgeId(isHovered ? edgeId : null);
              }}
            />

            {/* Nodes Layer */}
            <div className="pointer-events-auto w-full h-full">
              <VirtualNodesLayer
                windowSize={windowSize}
                selectedNodes={selectedNodes}
                generatingNodes={generatingNodes}
                handleNodePointerDown={handleNodePointerDown}
                handleSettingsClick={handleSettingsClick}
                handlePortPointerDown={handlePortPointerDown}
                handlePortPointerUp={handlePortPointerUp}
              />
            </div>
            
            {/* Groups Layer */}
            {groups.map((group) => (
              <GroupFrame
                key={group.id}
                group={group}
                isSelected={selectedGroupId === group.id}
                scale={scale}
                onPointerDown={handleGroupPointerDown}
              />
            ))}
          </div>
        </div>
        
        {/* Multi-Select Toolbar */}
        <AnimatePresence>
          {selectedNodes.length >= 2 && (
            <MultiSelectToolbar
              selectedNodes={nodes.filter(n => selectedNodes.includes(n.id))}
              position={multiSelectToolbarPos}
              onCreateAsset={handleCreateAsset}
              onCreateGroup={handleCreateGroup}
            />
          )}
        </AnimatePresence>
        
        {/* Create Asset Dialog */}
        <AnimatePresence>
          {showAssetDialog && (
            <CreateAssetDialog
              selectedNodes={nodes.filter(n => selectedNodes.includes(n.id))}
              onClose={() => setShowAssetDialog(false)}
              onConfirm={handleConfirmAsset}
            />
          )}
        </AnimatePresence>
        
        {/* Asset Library */}
        <AnimatePresence>
          {isAssetPanelOpen && (
            <AssetLibrary
              isOpen={isAssetPanelOpen}
              onClose={() => setIsAssetPanelOpen(false)}
            />
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
              className="absolute top-0 right-0 w-[400px] h-full backdrop-blur-2xl border-l border-white/5 flex flex-col z-50 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ui-overlay no-drag"
              style={{ backgroundColor: 'color-mix(in srgb, var(--ui-bg, #0a0a0a) 80%, transparent)' }}
            >
              <button 
                onClick={() => setIsAgentOpen(false)}
                className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-12 bg-[#0a0a0a] border-l border-y border-white/5 rounded-l-lg flex items-center justify-center text-white/40 hover:text-white transition-colors shadow-[-5px_0_10px_rgba(0,0,0,0.2)]"
              >
                <ChevronRight size={14} />
              </button>

              <div className="p-8 pb-4 flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-4xl font-bold tracking-tight text-white flex flex-col">
                    <span>Hi,</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{userName}</span>
                  </h2>
                  <p className="text-white/60 text-lg font-medium mt-2">在寻找哪方面的灵感?</p>
                </div>
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <History size={20} />
                </button>
              </div>

              <div className="flex-1 px-8 overflow-y-auto no-scrollbar py-4">
                <div className="bg-[#161616] border border-white/5 rounded-3xl p-5 space-y-5 shadow-xl">
                  <div className="aspect-video rounded-2xl overflow-hidden bg-black/40 relative group">
                    <img 
                      src="https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=400&h=225&fit=crop" 
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

              <div className="p-6 bg-[#0a0a0a] border-t border-white/5">
                <div className="bg-[#161616] border border-white/10 rounded-[32px] p-2 shadow-2xl">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-4 pt-2">
                      <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white/60 hover:bg-white/10 cursor-pointer transition-colors">
                        <MessageCircle size={12} />
                        <span>对话模式</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold text-white/80 hover:bg-white/20 cursor-pointer transition-colors">
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
                      <button className="w-10 h-10 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all shadow-lg">
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
          {selectedNodes.length === 1 && !isPanelOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 glass bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 p-1.5 rounded-xl flex items-center gap-1 z-[55] ui-overlay no-drag shadow-2xl"
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

      <AnimatePresence>
      </AnimatePresence>

      {selectedNode && (
        <NodeEditorPanel
          node={selectedNode}
          referencedNodes={connections.filter(c => c.to === selectedNode.id).map(c => nodes.find(n => n.id === c.from)).filter(Boolean) as Node[]}
          onRemoveReference={(refId) => removeConnection(refId, selectedNode.id)}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          onGenerate={generateMockContent}
          isGenerating={generatingNodes[selectedNode.id] || false}
        />
      )}

      {dropMenu && (
        <div 
          className="fixed inset-0 z-[100]" 
          onPointerDown={() => setDropMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setDropMenu(null); }}
        >
          <div 
            className="absolute bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-64"
            style={{ left: dropMenu.screenX, top: dropMenu.screenY }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {dropMenu.fromNode && (
              <div className="px-4 py-3 border-b border-white/5">
                <h3 className="text-xs font-medium text-white/50">引用该节点生成</h3>
              </div>
            )}
            <div className="p-2 space-y-1">
              <button 
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
                onClick={() => {
                  const newNode: Node = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'text',
                    x: dropMenu.x,
                    y: dropMenu.y,
                    title: 'Text',
                    content: ''
                  };
                  setNodes(prev => [...prev, newNode]);
                  
                  if (dropMenu.fromNode && dropMenu.fromPort) {
                    const toPort = getTargetPortType(dropMenu.fromPort);
                    const { from, to } = normalizeConnection(dropMenu.fromNode, newNode.id, dropMenu.fromPort, toPort);
                    setConnections(prev => [...prev, { from, to }]);
                  }
                  
                  setSelectedNodes([newNode.id]);
                  setDropMenu(null);
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                  <Type size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white/90 group-hover:text-white">文本生成</div>
                  <div className="text-[10px] text-white/40">脚本、广告词、品牌文案</div>
                </div>
              </button>
              
              <button 
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
                onClick={() => {
                  const newNode: Node = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'image',
                    x: dropMenu.x,
                    y: dropMenu.y,
                    title: 'Image',
                    content: ''
                  };
                  setNodes(prev => [...prev, newNode]);
                  
                  if (dropMenu.fromNode && dropMenu.fromPort) {
                    const toPort = getTargetPortType(dropMenu.fromPort);
                    const { from, to } = normalizeConnection(dropMenu.fromNode, newNode.id, dropMenu.fromPort, toPort);
                    setConnections(prev => [...prev, { from, to }]);
                  }
                  
                  setSelectedNodes([newNode.id]);
                  setDropMenu(null);
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                  <ImageIcon size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white/90 group-hover:text-white">图片生成</div>
                </div>
              </button>

              <button 
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
                onClick={() => {
                  const newNode: Node = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'video',
                    x: dropMenu.x,
                    y: dropMenu.y,
                    title: 'Video',
                    content: '',
                    aspectRatio: '16:9'  // 默认16:9
                  };
                  setNodes(prev => [...prev, newNode]);
                  
                  if (dropMenu.fromNode && dropMenu.fromPort) {
                    const toPort = getTargetPortType(dropMenu.fromPort);
                    const { from, to } = normalizeConnection(dropMenu.fromNode, newNode.id, dropMenu.fromPort, toPort);
                    setConnections(prev => [...prev, { from, to }]);
                  }
                  
                  setSelectedNodes([newNode.id]);
                  setDropMenu(null);
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                  <Video size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white/90 group-hover:text-white">视频生成</div>
                </div>
              </button>

              <button 
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
                onClick={() => {
                  const newNode: Node = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'image', // Assuming Image Editor is just another image node or specific type
                    x: dropMenu.x,
                    y: dropMenu.y,
                    title: 'Image Editor',
                    content: ''
                  };
                  setNodes(prev => [...prev, newNode]);
                  
                  if (dropMenu.fromNode && dropMenu.fromPort) {
                    const toPort = getTargetPortType(dropMenu.fromPort);
                    const { from, to } = normalizeConnection(dropMenu.fromNode, newNode.id, dropMenu.fromPort, toPort);
                    setConnections(prev => [...prev, { from, to }]);
                  }
                  
                  setSelectedNodes([newNode.id]);
                  setDropMenu(null);
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                  <Pen size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white/90 group-hover:text-white">图片编辑器</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components ---

interface SidebarButtonProps {
  icon: React.ElementType;
  label?: string;
  active?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  itemId?: string;
  isHovered?: boolean; // 是否是当前悬停项
}

const SidebarButton = ({ icon: Icon, label, active, onClick, onHover, itemId, isHovered }: SidebarButtonProps) => (
  <motion.button 
    onClick={onClick}
    onMouseEnter={onHover}
    className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative",
      active ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
    )}
    animate={{
      scale: isHovered ? 1.15 : 1,
    }}
    transition={{
      duration: 0.3,
      ease: [0.34, 1.56, 0.64, 1] // 弹性缓动
    }}
  >
    <Icon size={18} strokeWidth={2} />
    {label && (
      <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-[#1a1a1a] border border-white/10 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-4px] group-hover:translate-x-0 uppercase tracking-widest whitespace-nowrap z-50 shadow-xl">
        {label}
      </div>
    )}
  </motion.button>
);

interface NodeActionProps {
  icon: React.ElementType;
  label?: string;
}

const NodeAction = ({ icon: Icon, label }: NodeActionProps) => (
  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
    <Icon size={14} />
    {label && <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>}
  </button>
);

interface AddMenuItemProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  active?: boolean;
  onClick?: () => void;
}

const AddMenuItem = ({ icon: Icon, title, description, active, onClick }: AddMenuItemProps) => (
  <div 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 p-2 rounded-2xl transition-all cursor-pointer group",
      active ? "bg-white/[0.08]" : "hover:bg-white/5"
    )}
  >
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

interface ShortcutRowProps {
  label: string;
  keys: string[];
  icon?: React.ReactNode;
}

const ShortcutRow = ({ label, keys, icon }: ShortcutRowProps) => (
  <div className="flex items-center justify-between">
    <span className="text-white/80 text-sm">{label}</span>
    <div className="flex items-center gap-1.5">
      {keys?.map((key: string) => (
        <span key={key} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-mono text-white/60 min-w-[24px] text-center">
          {key}
        </span>
      ))}
      {icon && <span className="text-lg grayscale opacity-60 flex items-center justify-center w-6">{icon}</span>}
    </div>
  </div>
);

interface MinimapProps {
  nodes: Node[];
  canvasPosition: { x: number; y: number };
  canvasScale: number;
  windowSize: { width: number; height: number };
  isAgentOpen: boolean;
  onNavigate: (pos: { x: number; y: number }) => void;
}

const Minimap = ({ nodes, canvasPosition, canvasScale, windowSize, isAgentOpen, onNavigate }: MinimapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const MW = MINIMAP_CONFIG.width;
  const MH = MINIMAP_CONFIG.height;
  
  // 动态计算边界：包含所有节点 + 当前视口（完整显示）
  const bounds = useMemo(() => {
    // Agent 面板是 overlay，不影响画布尺寸
    const viewportX = -canvasPosition.x / canvasScale;
    const viewportY = -canvasPosition.y / canvasScale;
    const viewportW = windowSize.width / canvasScale;
    const viewportH = windowSize.height / canvasScale;
    
    // 确保完整包含视口
    let minX = viewportX;
    let maxX = viewportX + viewportW;
    let minY = viewportY;
    let maxY = viewportY + viewportH;
    
    // 扩展到包含所有节点
    nodes.forEach(node => {
      const { width, height } = getNodeDimensions(node.type);
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x + width);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y + height);
    });
    
    const padding = MINIMAP_CONFIG.padding;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;
    
    // 强制保持小地图的宽高比（4:3），避免视口方框变形
    const targetRatio = MINIMAP_CONFIG.aspectRatio;
    let width = maxX - minX;
    let height = maxY - minY;
    const currentRatio = width / height;
    
    if (currentRatio > targetRatio) {
      // 太宽，增加高度
      const newHeight = width / targetRatio;
      const diff = newHeight - height;
      minY -= diff / 2;
      maxY += diff / 2;
    } else {
      // 太高，增加宽度
      const newWidth = height * targetRatio;
      const diff = newWidth - width;
      minX -= diff / 2;
      maxX += diff / 2;
    }
    
    return { minX, maxX, minY, maxY };
  }, [nodes, canvasPosition, canvasScale, windowSize, isAgentOpen]);
  
  const worldWidth = bounds.maxX - bounds.minX;
  const worldHeight = bounds.maxY - bounds.minY;
  
  const toMapX = (x: number) => ((x - bounds.minX) / worldWidth) * MW;
  const toMapY = (y: number) => ((y - bounds.minY) / worldHeight) * MH;
  const fromMapX = (mx: number) => (mx / MW) * worldWidth + bounds.minX;
  const fromMapY = (my: number) => (my / MH) * worldHeight + bounds.minY;

  // Agent 面板是 overlay，不影响视口尺寸
  const viewportWidth = windowSize.width / canvasScale;
  const viewportHeight = windowSize.height / canvasScale;
  
  const viewportX = -canvasPosition.x / canvasScale;
  const viewportY = -canvasPosition.y / canvasScale;

  // ���击导航
  const handleClick = (e: React.MouseEvent) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const worldX = fromMapX(mx);
    const worldY = fromMapY(my);
    
    onNavigate({
      x: -(worldX - viewportWidth / 2) * canvasScale,
      y: -(worldY - viewportHeight / 2) * canvasScale
    });
  };

  return (
    <div 
      ref={mapRef}
      className="relative w-full h-full cursor-pointer bg-black/40 overflow-hidden"
      onClick={handleClick}
    >
      {/* 节点 - 简化为白色小点 */}
      {nodes.map((node: any) => {
        const mapX = toMapX(node.x);
        const mapY = toMapY(node.y);
        
        // 只渲染在小地图范围内的节点
        if (mapX < -10 || mapX > MW + 10 || mapY < -10 || mapY > MH + 10) {
          return null;
        }
        
        return (
          <div 
            key={node.id}
            className="absolute rounded-full bg-white"
            style={{
              left: mapX - 2,
              top: mapY - 2,
              width: 4,
              height: 4,
            }}
          />
        );
      })}

      {/* 当前视口框 */}
      <div 
        className="absolute border-2 border-white/60 pointer-events-none rounded-sm"
        style={{
          left: toMapX(viewportX),
          top: toMapY(viewportY),
          width: (viewportWidth / worldWidth) * MW,
          height: (viewportHeight / worldHeight) * MH,
        }}
      />
      
      {/* 节点数量 */}
      <div className="absolute bottom-1.5 right-1.5 text-[9px] text-white/30 pointer-events-none select-none">
        {nodes.length}
      </div>
    </div>
  );
};

export default InfiniteCanvas;