import React, { useState, memo, useEffect, useRef } from 'react';
import { 
  Plus, Image as ImageIcon, Upload, CloudUpload, Sparkles, ChevronUp, RefreshCw, SlidersHorizontal, Camera, Monitor, Zap,
  Eraser, Wand2, Maximize, Scissors, Sun, Pen, Crop, Download, Fullscreen, X, Send,
  ChevronDown, Settings2, Pencil, ImagePlus, Palette, Aperture, MousePointer2, Coins, ArrowUp, RectangleHorizontal, RectangleVertical, Square,
  PenTool, MonitorPlay, Expand, ScanLine, Lightbulb, Highlighter, Droplet, Type, Maximize2, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import type { CanvasNode } from '../types/canvas';
import { GeneratingOverlay } from './GeneratingOverlay';
import { useCanvasStore } from '../store/canvasStore';
import { AIService } from '../services/aiService';
import { useApiConfigStore } from '../store/apiConfigStore';
import { useUIStore } from '../store/uiStore';

interface ImageCanvasNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  isGenerating: boolean;
  onPointerDown: (e: React.PointerEvent, node: CanvasNode) => void;
  onSettingsClick: (e: React.MouseEvent, id: string) => void;
  onPortPointerDown?: (e: React.PointerEvent, nodeId: string, port: 'left' | 'right') => void;
  onPortPointerUp?: (e: React.PointerEvent, nodeId: string, port: 'left' | 'right') => void;
  hasLeftConnection?: number | boolean;
  hasRightConnection?: number | boolean;
  connectedSourceNodes?: CanvasNode[];
  isSingleSelection?: boolean;
}

const EDIT_TOOLS = [
  { id: 'redraw', icon: PenTool, label: '重绘' },
  { id: 'erase', icon: Eraser, label: '擦除' },
  { id: 'enhance', icon: MonitorPlay, label: '增强' },
  { id: 'expand', icon: Expand, label: '扩图' },
  { id: 'cutout', icon: ScanLine, label: '抠图' },
  { id: 'multi', icon: RefreshCw, label: '多角度' },
  { id: 'light', icon: Lightbulb, label: '打光' },
  { id: 'divider', isDivider: true },
  { id: 'paint', icon: Highlighter, iconOnly: true },
  { id: 'crop', icon: Crop, iconOnly: true },
  { id: 'download', icon: Download, iconOnly: true },
  { id: 'fullscreen', icon: Maximize2, iconOnly: true },
];

const MODELS = [
  { id: 'banana-2', name: 'Banana 2', desc: '更快更便宜的图像编辑模型', isNew: true, time: '1min', icon: Sparkles },
  { id: 'banana-pro', name: 'Banana Pro', time: '1min', icon: Sparkles },
  { id: 'banana', name: 'Banana', time: '1min', icon: Sparkles },
  { id: 'jimeng-5', name: '即梦5.0 Lite', time: '1min', icon: MonitorPlay },
  { id: 'jimeng-4', name: '即梦4.0', time: '1min', icon: MonitorPlay },
  { id: 'jimeng-45', name: '即梦4.5', time: '1min', icon: MonitorPlay },
  { id: 'mj-v7', name: 'MJ V7', time: '2min', icon: Palette },
  { id: 'mj-niji7', name: 'M.J Niji7', time: '2min', icon: Palette },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', icon: '□' },
  { id: '9:16', label: '9:16', icon: '▯' },
  { id: '16:9', label: '16:9', icon: '▭' },
  { id: '3:4', label: '3:4', icon: '▯' },
  { id: '4:3', label: '4:3', icon: '▭' },
  { id: '3:2', label: '3:2', icon: '▭' },
  { id: '2:3', label: '2:3', icon: '▯' },
  { id: '5:4', label: '5:4', icon: '□' },
  { id: '4:5', label: '4:5', icon: '□' },
  { id: '21:9', label: '21:9', icon: '▭' },
];

const QUALITIES = ['512P', '1K', '2K', '4K'];

const STYLES = [
  { id: 'realistic', name: '风格', icon: Sparkles },
  { id: 'anime', name: '动漫', icon: Sparkles },
  { id: 'artistic', name: '艺术', icon: Sparkles },
  { id: 'cinematic', name: '电影', icon: Sparkles },
];

const CAMERAS = [
  { id: 'sony', name: 'Sony Veni...', icon: Aperture },
  { id: 'fuji', name: 'Fujifilm', icon: Aperture },
  { id: 'canon', name: 'Canon EOS', icon: Aperture },
  { id: 'nikon', name: 'Nikon', icon: Aperture },
];

export const ImageCanvasNode = memo(({ 
  node, 
  isSelected, 
  isGenerating,
  onPointerDown, 
  onSettingsClick,
  onPortPointerDown,
  onPortPointerUp,
  hasLeftConnection,
  hasRightConnection,
  connectedSourceNodes,
  isSingleSelection
}: ImageCanvasNodeProps) => {
  const [prompt, setPrompt] = useState(node.content || "");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(node.previewUrl || "");
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [showEditToolbar, setShowEditToolbar] = useState(false);

  const wasSelectedRef = useRef(isSelected);
  const pointerDownPos = useRef({ x: 0, y: 0, wasSelected: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 保证只有从未选中状态切换到选中状态时才强制进入沉浸态
  useEffect(() => {
    if (isSelected && preview && !wasSelectedRef.current) {
      setShowEditToolbar(true);
    }
    wasSelectedRef.current = isSelected;
  }, [isSelected, preview]);

  // Sync with store when previewUrl changes externally (e.g., undo/redo)
  useEffect(() => {
    if (node.previewUrl !== preview) {
      setPreview(node.previewUrl || "");
    }
  }, [node.previewUrl]);

  const processAndSetImage = (file: File) => {
    if (!file) return;
    
    // Create a temporary object URL to read the file
    const tempUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      // Free the temporary URL
      URL.revokeObjectURL(tempUrl);
      
      const MAX_DIMENSION = 1200; // Limit to 1200 to keep base64 strings reasonable
      let { width, height } = img;
      
      // 自动识别图片比例并更新节点尺寸，避免被框死在默认比例下
      const imgRatio = width / height;
      const ratios = [
        { id: '21:9', val: 21/9 },
        { id: '16:9', val: 16/9 },
        { id: '3:2', val: 3/2 },
        { id: '4:3', val: 4/3 },
        { id: '5:4', val: 5/4 },
        { id: '1:1', val: 1 },
        { id: '4:5', val: 4/5 },
        { id: '3:4', val: 3/4 },
        { id: '2:3', val: 2/3 },
        { id: '9:16', val: 9/16 },
      ];
      let closest = ratios[0];
      let minDiff = Math.abs(imgRatio - closest.val);
      for (let i = 1; i < ratios.length; i++) {
        const diff = Math.abs(imgRatio - ratios[i].val);
        if (diff < minDiff) {
          minDiff = diff;
          closest = ratios[i];
        }
      }
      setParams(prev => ({ ...prev, aspectRatio: closest.id }));
      updateNode(node.id, { aspectRatio: closest.id });
      
      // Always convert to base64 to prevent data loss on remount/refresh
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height, 1);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/webp', 0.85);
        if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview); // Cleanup previous if it was a blob
        }
        setPreview(dataUrl);
        updateNode(node.id, { 
          previewUrl: dataUrl, 
          isUploaded: true,
          naturalWidth: img.width,
          naturalHeight: img.height
        });
        setShowEditToolbar(true);
      }
    };
    
    img.src = tempUrl;
  };

  const [params, setParams] = useState({
    model: 'banana-2',
    aspectRatio: node.aspectRatio || '9:16',
    quality: '1K',
    style: 'realistic',
    camera: 'sony',
    count: 2,
  });
  
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [showStyleSelect, setShowStyleSelect] = useState(false);
  const [showAspectSelect, setShowAspectSelect] = useState(false);
  const [showCameraSelect, setShowCameraSelect] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const updateNode = useCanvasStore((state) => state.updateNode);
  const { configs } = useApiConfigStore();
  const { openSettings } = useUIStore();

  const getDimensions = () => {
    let ratioValue = 1;

    // 如果是有原始宽高信息的图片，接采用其真实物理比例
    if (node.isUploaded && node.naturalWidth && node.naturalHeight) {
      ratioValue = node.naturalWidth / node.naturalHeight;
    } else {
      // 否则使用生成面板设定的比例，或者是老版本存下的 node.aspectRatio
      const ratioStr = (node.isUploaded ? node.aspectRatio : params.aspectRatio) || '1:1';
      const [wStr, hStr] = ratioStr.split(':');
      if (wStr && hStr) {
        ratioValue = parseInt(wStr) / parseInt(hStr);
      }
    }

    const STANDARD_SIZE = 360;
    let width, height;

    if (ratioValue >= 1) {
      // 横图或方图：高度固定为 360，宽度按比例计算
      height = STANDARD_SIZE;
      width = Math.round(STANDARD_SIZE * ratioValue);
    } else {
      // 竖向长图：宽度固定为 360，高度按比例计算
      width = STANDARD_SIZE;
      height = Math.round(STANDARD_SIZE / ratioValue);
    }

    return { width, height };
  };

  const dimensions = getDimensions();

  const nodeSizeRef = useRef({ width: node.width || 0, height: node.height || 0 });
  useEffect(() => {
    nodeSizeRef.current = { width: node.width || 0, height: node.height || 0 };
  }, [node.width, node.height]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to avoid "ResizeObserver loop limit exceeded" in Figma sandbox
      window.requestAnimationFrame(() => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          const currentWidth = nodeSizeRef.current.width;
          const currentHeight = nodeSizeRef.current.height;
          if (Math.abs(currentWidth - width) > 1 || Math.abs(currentHeight - height) > 1) {
            updateNode(node.id, { width, height });
          }
        }
      });
    });
    
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [node.id, updateNode]);

  useEffect(() => {
    // 只在单选且有下拉菜单打开时添加监听器
    if (!isSingleSelection || (!showModelSelect && !showStyleSelect && !showAspectSelect && !showCameraSelect)) {
      return;
    }
    
    const handleClickOutside = () => {
      setShowModelSelect(false);
      setShowStyleSelect(false);
      setShowAspectSelect(false);
      setShowCameraSelect(false);
    };
    
    // 使用延迟来避免在渲染期间添加监听器
    const timeoutId = setTimeout(() => {
      if (typeof document !== 'undefined') {
        document.addEventListener('click', handleClickOutside);
      }
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('click', handleClickOutside);
      }
    };
  }, [showModelSelect, showStyleSelect, showAspectSelect, showCameraSelect, isSingleSelection]);

  const handleGenerate = async () => {
    console.log('=== 开始图片生成流程 ===');
    console.log('1. Prompt:', prompt);
    
    if (!prompt.trim()) {
      alert('请先输入生成内容的描述');
      return;
    }
    
    console.log('2. 查找API配置...');
    console.log('   - 图片生成配置:', configs.image);
    
    // 获取图片生成的API配置
    const imageConfig = configs.image;
    
    console.log('3. 图片配置状态:', imageConfig);
    
    if (!imageConfig.enabled) {
      console.error('❌ 图片生成API未启用');
      const shouldOpenSettings = confirm(
        '图片生成API未启用\n\n点击"确定"前往设置页面配置，或点击"取消"稍后配置。'
      );
      if (shouldOpenSettings) {
        openSettings();
      }
      return;
    }

    if (!imageConfig.apiKey) {
      console.error('❌ API密钥未配置');
      const shouldOpenSettings = confirm(
        `图片生成API密钥未配置\n\n点击"确定"前往设置页面配置API密钥，或点击"取消"稍后配置。`
      );
      if (shouldOpenSettings) {
        openSettings();
      }
      return;
    }

    console.log('4. API密钥已配置（前10位）:', imageConfig.apiKey.substring(0, 10) + '...');
    
    setGenerating(true);
    updateNode(node.id, { status: 'generating', content: prompt });

    try {
      // 将宽高比转换为像素尺寸
      const [w, h] = params.aspectRatio.split(':').map(Number);
      let size = '1024x1024'; // 默认
      
      // 根据画质调整尺寸
      const qualityMap: Record<string, number> = {
        '512P': 512,
        '1K': 1024,
        '2K': 2048,
        '4K': 4096
      };
      const baseSize = qualityMap[params.quality] || 1024;
      
      // 根据宽高比计算实际尺寸
      if (w > h) {
        // 横图
        const width = baseSize;
        const height = Math.round(baseSize * h / w);
        size = `${width}x${height}`;
      } else if (w < h) {
        // 竖图
        const height = baseSize;
        const width = Math.round(baseSize * w / h);
        size = `${width}x${height}`;
      } else {
        // 方图
        size = `${baseSize}x${baseSize}`;
      }

      console.log('5. 准备调用API:');
      console.log('   - Base URL:', imageConfig.baseUrl);
      console.log('   - Model:', imageConfig.selectedModel);
      console.log('   - Size:', size);
      console.log('   - Quality:', params.quality);
      console.log('   - Style:', params.style);
      console.log('   - Prompt:', prompt.substring(0, 100) + '...');

      const generatedImageUrl = await AIService.generateImage(
        imageConfig,
        prompt,
        {
          size,
          quality: params.quality.toLowerCase(),
          style: params.style
        }
      );

      console.log('6. ✅ 图片生成成功！');
      console.log('   - 图片URL类型:', generatedImageUrl.startsWith('data:') ? 'Base64' : 'URL');
      console.log('   - 图片URL长度:', generatedImageUrl.length);

      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }

      setPreview(generatedImageUrl);
      setGenerating(false);
      setShowEditToolbar(true);
      setPrompt(''); // 清空输入框
      
      updateNode(node.id, { 
        previewUrl: generatedImageUrl,
        status: 'done',
        isUploaded: false,
        aspectRatio: params.aspectRatio
      });
    } catch (error) {
      console.error('❌ AI图片生成失败:', error);
      setGenerating(false);
      updateNode(node.id, { status: 'idle' });
      
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`图片生成失败: ${errorMessage}\n\n请检查:\n1. API密钥是否正确\n2. 网络连接是否正常\n3. API服务是否可用\n\n详细错误信息请查看浏览器控制台（F12）`);
    }
  };

  const handleToolClick = (toolId: string) => {
    if (toolId === 'download') {
      if (preview) {
        const link = document.createElement('a');
        link.href = preview;
        link.download = `${node.title || 'image'}-${node.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      setActiveTool(activeTool === toolId ? null : toolId);
    }
  };

  return (
    <div
      className={cn(
        "absolute cursor-default flex flex-col items-center",
        isSelected ? "z-20" : "z-10"
      )}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
      }}
      onPointerDown={(e) => {
        pointerDownPos.current = { x: e.clientX, y: e.clientY, wasSelected: isSelected };
        onPointerDown(e, node);
      }}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            processAndSetImage(file);
          }
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }} 
      />
      {/* 1. Top Navigation Bar (Edit Tools or Upload) */}
      <AnimatePresence mode="wait">
        {!!isSingleSelection && ((!preview && !hasLeftConnection) || (preview && (showEditToolbar || node.isUploaded === false))) ? (
          <motion.div 
            key={preview ? "edit-toolbar" : "upload-toolbar"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-auto z-30"
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            {showEditToolbar && preview ? (
              <div className="flex items-center gap-1.5 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-full shadow-2xl">
                {EDIT_TOOLS.map((tool, index) => {
                  if (tool.isDivider) {
                    return <div key={`div-${index}`} className="w-px h-4 bg-white/20 mx-1" />;
                  }
                  
                  const ToolIcon = tool.icon!;
                  const isActive = activeTool === tool.id;
                  
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool.id)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-sm",
                        isActive ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                      )}
                      title={tool.label}
                    >
                      <ToolIcon size={15} className={isActive ? "text-white" : "text-white/70"} />
                      {!tool.iconOnly && <span className="text-xs font-medium whitespace-nowrap">{tool.label}</span>}
                    </button>
                  );
                })}
              </div>
            ) : !preview ? (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 px-5 py-2 rounded-full shadow-2xl hover:bg-white/10 transition-colors text-sm font-medium text-white/90"
              >
                <Upload size={16} className="text-white/70" />
                <span>上传</span>
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* 2. Main Content Editor */}
      <div className="relative group" ref={containerRef}>
        <div className="flex items-center gap-1.5 mb-2 px-1 text-white/60">
          <ImageIcon size={14} />
          <span className="text-xs font-medium">{node.title || (preview && !isGenerating ? 'Image' : '图片生成')}</span>
        </div>
        
        <div className={cn(
          "rounded-xl border transition-all relative flex flex-col items-center justify-center overflow-hidden",
          preview ? "backdrop-blur-xl p-0" : "p-1 backdrop-blur-xl cursor-pointer",
          isSelected 
            ? "border-white/[0.15] shadow-[0_0_30px_rgba(255,255,255,0.12),0_0_60px_rgba(255,255,255,0.06)]" 
            : (preview 
              ? "border-white/[0.08] hover:border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]" 
              : "border-white/[0.08] hover:border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]")
        )}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          backgroundColor: preview 
            ? `color-mix(in srgb, var(--node-bg, #000000) 40%, transparent)` 
            : `color-mix(in srgb, var(--node-bg, #000000) 50%, transparent)`
        }}
        onClick={(e) => {
          e.stopPropagation();
          // 如果是拖拽导致释放，不触发点击
          const dx = Math.abs(e.clientX - pointerDownPos.current.x);
          const dy = Math.abs(e.clientY - pointerDownPos.current.y);
          if (dx > 3 || dy > 3) return;

          // 如点击前已经是选中状态，才允许切换工具栏，避免选中节点的点击直接触发切换
          if (preview && pointerDownPos.current.wasSelected) {
            setShowEditToolbar(prev => !prev);
          }
        }}
        >
          {preview ? (
            <>
              <img 
                src={preview} 
                alt="" 
                className="w-full h-full rounded-xl block pointer-events-none" 
                style={{ 
                  imageRendering: 'high-quality',
                  objectFit: 'cover'
                }} 
                draggable={false} 
                onError={() => {
                  // 如果是 blob URL 且加载失败（通常是因为页面刷新导致 blob 失效）
                  // 或者其他图片加载失败的情况，重置回无图状态
                  setPreview("");
                  updateNode(node.id, { previewUrl: "" });
                }}
              />
              
              {/* Internal Upload Button (Top Right) */}
              {(!isSelected || isSingleSelection) && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#1e1e1e]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg shadow-xl hover:bg-[#2a2a2a] transition-all text-xs font-medium text-white/95 z-20 opacity-0 group-hover:opacity-100"
                >
                  <Upload size={14} className="text-white/90" />
                  <span>替换</span>
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              <ImageIcon size={32} />
            </div>
          )}
          {(generating || isGenerating) && (
            <GeneratingOverlay />
          )}
        </div>

        {/* Connection Ports */}
        {!node.isUploaded && (
          <div 
            onPointerDown={(e) => { 
              e.stopPropagation(); 
              try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(err) {}
              onPortPointerDown?.(e, node.id, 'left'); 
            }}
            onPointerUp={(e) => { e.stopPropagation(); onPortPointerUp?.(e, node.id, 'left'); }}
            className={cn(
              "absolute top-[50%] -left-9 w-6 h-6 -mt-3 rounded-full border bg-[#111] flex items-center justify-center transition-all cursor-crosshair before:absolute before:inset-y-[-10px] before:-right-6 before:w-6 before:content-['']",
              hasLeftConnection 
                ? "border-white/40 bg-white/10 opacity-100 hover:border-white/60 hover:bg-white/20" 
                : "border-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:border-white/40"
            )}
          >
            {hasLeftConnection && typeof hasLeftConnection === 'number' ? (
              <span className="text-[10px] font-bold text-white">{hasLeftConnection}</span>
            ) : (
              <Plus size={12} className="text-white/60" />
            )}
          </div>
        )}
        <div 
          onPointerDown={(e) => { 
            e.stopPropagation(); 
            try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(err) {}
            onPortPointerDown?.(e, node.id, 'right'); 
          }}
          onPointerUp={(e) => { e.stopPropagation(); onPortPointerUp?.(e, node.id, 'right'); }}
          className={cn(
            "absolute top-[50%] -right-9 w-6 h-6 -mt-3 rounded-full border bg-[#111] flex items-center justify-center transition-all cursor-crosshair before:absolute before:inset-y-[-10px] before:-left-6 before:w-6 before:content-['']",
            hasRightConnection 
              ? "border-purple-500/60 bg-purple-500/20 opacity-100 hover:border-purple-400" 
              : "border-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:border-white/40"
          )}
        >
          {hasRightConnection && typeof hasRightConnection === 'number' ? (
            <span className="text-[10px] font-bold text-white">{hasRightConnection}</span>
          ) : (
            <Plus size={12} className="text-white/60" />
          )}
        </div>
      </div>

      {/* 3. Bottom Control Bar */}
      <AnimatePresence mode="wait">
        {!!isSingleSelection && (!preview || !showEditToolbar || node.isUploaded === false) ? (
          <motion.div 
            key="bottom-toolbar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-5 w-[620px] left-1/2 -translate-x-1/2 bg-[#1e1e1e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-visible origin-top p-4 flex flex-col gap-5 z-30"
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            {/* Prompt Input Area */}
            <div className="flex flex-col gap-3 px-1">
              {/* Reference / Upload row */}
              <div className="flex items-center gap-2.5">
                <button className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-white/40 hover:text-white transition-colors">
                  <ImagePlus size={18} />
                </button>
                
                {/* Connected reference image thumbnail */}
                {connectedSourceNodes?.filter(n => n.type === 'image' && n.previewUrl).slice(0, 1).map(sourceNode => (
                  <div key={sourceNode.id} className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/20">
                    <img src={sourceNode.previewUrl} className="w-full h-full object-cover" alt="Reference" />
                  </div>
                ))}
                
                <button className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-white/40 hover:text-white transition-colors">
                  <Plus size={18} />
                </button>
              </div>

              {/* Textarea */}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onBlur={() => updateNode(node.id, { content: prompt })}
                placeholder="描述任何你想要生成的内容，按 @ 引用素材，/ 呼出指令"
                className="w-full bg-transparent border-none outline-none text-white/90 text-[14px] leading-relaxed placeholder:text-white/40 resize-none h-14 pt-1 scrollbar-thin"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()} // 阻止滚轮事件传播到画布
              />
            </div>

            {/* Parameters Bar */}
            <div className="flex items-center justify-between text-[13px] font-medium text-white/70 px-1 pb-1 relative pt-2">
              {/* Left Group */}
              <div className="flex items-center gap-3">
                {/* Model */}
                <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModelSelect(!showModelSelect);
                  }}
                  className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg"
                >
                  <span className="flex items-center justify-center text-white/80">
                    {(() => {
                      const model = MODELS.find(m => m.id === params.model);
                      return model && model.icon ? <model.icon size={14} /> : null;
                    })()}
                  </span>
                  <span className="text-white/90">{MODELS.find(m => m.id === params.model)?.name}</span>
                </button>
                
                {showModelSelect && (
                  <div 
                    className="absolute bottom-[calc(100%+12px)] left-0 w-64 bg-[#2a2a2a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] flex flex-col py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {MODELS.map((model) => {
                      const ModelIcon = model.icon;
                      return (
                      <button
                        key={model.id}
                        onClick={() => {
                          setParams({ ...params, model: model.id });
                          setShowModelSelect(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/5 transition-colors",
                          params.model === model.id ? "bg-white/10" : ""
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-6 h-6 rounded flex items-center justify-center text-white/60", model.id.startsWith('banana') ? 'bg-white/5' : '')}>
                            <ModelIcon size={14} />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              {!!model.isNew && <span className="bg-white/20 text-white text-[9px] font-bold px-1 rounded-sm leading-tight h-[14px] flex items-center border border-white/10">新</span>}
                              <span className={cn("text-xs font-medium", params.model === model.id ? "text-white" : "text-white/80")}>{model.name}</span>
                            </div>
                            {!!model.desc && <span className="text-[10px] text-white/40 mt-0.5">{model.desc}</span>}
                          </div>
                        </div>
                        <span className="text-[10px] text-white/30">{model.time}</span>
                      </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="w-px h-3 bg-white/10" />

              {/* Aspect Ratio */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAspectSelect(!showAspectSelect);
                  }}
                  className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/10 px-2.5 py-1.5 rounded-lg text-white/90"
                >
                  <span className="text-[10px] leading-none">{ASPECT_RATIOS.find(r => r.id === params.aspectRatio)?.icon}</span>
                  <span>{params.aspectRatio} · {params.quality}</span>
                </button>
                
                {showAspectSelect && (
                  <div 
                    className="absolute bottom-[calc(100%+12px)] left-0 w-[280px] p-4 bg-[#2a2a2a] border border-white/10 rounded-2xl shadow-2xl z-[100] flex flex-col gap-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 画质 */}
                    <div>
                      <div className="text-xs text-white/50 mb-2 font-medium">画质</div>
                      <div className="flex gap-1 bg-[#1a1a1a] rounded-xl p-1">
                        {QUALITIES.map((q) => (
                          <button
                            key={q}
                            onClick={() => setParams({ ...params, quality: q })}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                              params.quality === q ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 比例 */}
                    <div>
                      <div className="text-xs text-white/50 mb-2 font-medium">比例</div>
                      <div className="flex gap-2">
                        {/* 自适应 */}
                        <button 
                          className="w-16 h-[88px] flex flex-col items-center justify-center gap-2 rounded-xl bg-[#1a1a1a] text-white/40 hover:text-white transition-colors"
                        >
                          <Maximize size={16} />
                          <span className="text-[10px]">自适应</span>
                        </button>
                        
                        {/* 比例网格 */}
                        <div className="flex-1 grid grid-cols-5 gap-1 bg-[#1a1a1a] p-1 rounded-xl">
                          {ASPECT_RATIOS.map((ratio) => (
                            <button
                              key={ratio.id}
                              onClick={() => setParams({ ...params, aspectRatio: ratio.id })}
                              className={cn(
                                "flex flex-col items-center justify-center py-2 rounded-lg gap-1 transition-all",
                                params.aspectRatio === ratio.id
                                  ? "bg-white/10 text-white shadow-inner"
                                  : "text-white/40 hover:text-white hover:bg-white/5"
                              )}
                            >
                              <span className="text-xs leading-none">{ratio.icon}</span>
                              <span className="text-[10px] font-medium scale-90">{ratio.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-3 bg-white/10" />

              {/* Style */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStyleSelect(!showStyleSelect);
                  }}
                  className="flex items-center gap-1.5 hover:text-white transition-colors px-1"
                >
                  <Sparkles size={14} className="text-white/60" />
                  <span className="text-white/90">风格</span>
                </button>
                
                {showStyleSelect && (
                  <div 
                    className="absolute bottom-[calc(100%+12px)] left-0 w-32 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {STYLES.map((s) => {
                      const StyleIcon = s.icon;
                      return (
                      <button
                        key={s.id}
                        onClick={() => {
                          setParams({ ...params, style: s.id });
                          setShowStyleSelect(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors text-xs",
                          params.style === s.id ? "bg-white/10 text-white" : "text-white/70"
                        )}
                      >
                        <StyleIcon size={12} className="text-white/60" />
                        <span>{s.name}</span>
                      </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="w-px h-3 bg-white/10" />

              {/* Camera */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCameraSelect(!showCameraSelect);
                  }}
                  className="flex items-center gap-1.5 hover:text-white transition-colors px-1"
                >
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-white/80 rounded-full" />
                  </div>
                  <span className="max-w-[70px] truncate text-white/90">
                    {CAMERAS.find(c => c.id === params.camera)?.name}
                  </span>
                </button>
                
                {showCameraSelect && (
                  <div 
                    className="absolute bottom-[calc(100%+12px)] left-0 w-36 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {CAMERAS.map((c) => {
                      const CameraIcon = c.icon;
                      return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setParams({ ...params, camera: c.id });
                          setShowCameraSelect(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors text-xs",
                          params.camera === c.id ? "bg-white/10 text-white" : "text-white/70"
                        )}
                      >
                        <CameraIcon size={12} className="text-white/60" />
                        <span>{c.name}</span>
                      </button>
                      );
                    })}
                  </div>
                )}
              </div>

              </div>

              {/* Right Group */}
              <div className="flex items-center gap-3 pr-1">
                {/* Settings */}
                <button 
                  onClick={(e) => { e.stopPropagation(); onSettingsClick(e, node.id); }}
                  className="text-white/60 hover:text-white transition-colors flex items-center justify-center">
                  <SlidersHorizontal size={14} />
                </button>

                {/* Audio Input Icon */}
                <button className="text-white/60 hover:text-white transition-colors flex items-center justify-center">
                  <Mic size={14} />
                </button>

                {/* Count */}
                <div className="flex items-center font-semibold text-white/90">
                  <span>{params.count}x</span>
                </div>

                {/* Generate Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerate();
                  }}
                  disabled={!prompt.trim() || generating || isGenerating}
                  className={cn(
                    "flex items-center gap-1.5 bg-white/10 hover:bg-white/20 pl-3 pr-1.5 py-1.5 rounded-full transition-colors ml-1",
                    (!prompt.trim() || generating || isGenerating) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  <div className="flex items-center gap-1 text-white/90 font-medium">
                    <Coins size={14} />
                    <span className="text-sm">5</span>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center ml-0.5">
                    <ArrowUp size={12} strokeWidth={3} />
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

ImageCanvasNode.displayName = 'ImageCanvasNode';