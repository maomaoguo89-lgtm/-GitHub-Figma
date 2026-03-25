import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wand2, Eraser, ImagePlus, Maximize, Scissors, RefreshCw,
  Sun, Pencil, Crop, Download, Fullscreen, X, Send,
  ChevronDown, Settings2, Plus, Type, Video, File
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Node } from '../store/canvasStore';

interface NodeEditorPanelProps {
  node: Node;
  referencedNodes?: Node[];
  onRemoveReference?: (nodeId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, params: GenerationParams) => void;
  isGenerating: boolean;
}

interface GenerationParams {
  model: string;
  aspectRatio: string;
  style: string;
  camera: string;
  count: number;
}

const TOOLS = [
  { id: 'redraw', icon: Wand2, label: '重绘' },
  { id: 'erase', icon: Eraser, label: '擦除' },
  { id: 'enhance', icon: ImagePlus, label: '增强' },
  { id: 'expand', icon: Maximize, label: '扩图' },
  { id: 'cutout', icon: Scissors, label: '抠图' },
  { id: 'multi', icon: RefreshCw, label: '多角度' },
  { id: 'light', icon: Sun, label: '打光' },
  { id: 'paint', icon: Pencil, label: '画笔' },
  { id: 'crop', icon: Crop, label: '裁剪' },
  { id: 'fullscreen', icon: Fullscreen, label: '放大' },
];

const MODELS = [
  { 
    id: 'banana-2', 
    name: 'Banana 2', 
    icon: '🍌',
    time: '1min',
    capabilities: ['aspectRatio', 'style', 'camera', 'count'] // 支持所有功能
  },
  { 
    id: 'banana-pro', 
    name: 'Banana Pro', 
    icon: '🍌',
    time: '1min',
    capabilities: ['aspectRatio', 'style', 'camera', 'count']
  },
  { 
    id: 'banana', 
    name: 'Banana', 
    icon: '🍌',
    time: '1min',
    capabilities: ['aspectRatio', 'style'] // 基础版不支持相机和数量
  },
  { 
    id: 'image-5.0-lite', 
    name: '图梦5.0 Lite', 
    icon: '🎨',
    time: '1min',
    capabilities: ['aspectRatio', 'style']
  },
  { 
    id: 'image-4.0', 
    name: '图梦4.0', 
    icon: '🎨',
    time: '1min',
    capabilities: ['aspectRatio', 'style']
  },
  { 
    id: 'image-4.5', 
    name: '图梦4.5', 
    icon: '🎨',
    time: '1min',
    capabilities: ['aspectRatio', 'style']
  },
  { 
    id: 'midjourney-v7', 
    name: 'MJ V7', 
    icon: '🎨',
    time: '2min',
    capabilities: ['aspectRatio', 'style'] // MJ 不支持相机参数
  },
  { 
    id: 'midjourney-niji7', 
    name: 'M.J Niji7', 
    icon: '🎨',
    time: '2min',
    capabilities: ['aspectRatio', 'style']
  },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', size: '1024x1024' },
  { id: '4:3', label: '4:3', size: '1024x768' },
  { id: '3:4', label: '3:4', size: '768x1024' },
  { id: '16:9', label: '16:9', size: '1024x576' },
  { id: '9:16', label: '9:16', size: '576x1024' },
  { id: '4:5', label: '4:5 · 4K', size: '4096x5120' },
];

const STYLES = [
  { id: 'realistic', name: '写实', color: '#4A90E2' },
  { id: 'anime', name: '动漫', color: '#E24A90' },
  { id: 'artistic', name: '艺术', color: '#E2A44A' },
  { id: 'cinematic', name: '电影', color: '#4AE2A4' },
];

const CAMERAS = [
  { id: 'sony', name: 'Sony Venice', icon: '📷' },
  { id: 'fuji', name: 'Fujifilm', icon: '📸' },
  { id: 'canon', name: 'Canon EOS', icon: '🎥' },
  { id: 'nikon', name: 'Nikon', icon: '📹' },
];

export const NodeEditorPanel: React.FC<NodeEditorPanelProps> = ({
  node,
  referencedNodes = [],
  onRemoveReference,
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}) => {
  const [prompt, setPrompt] = useState(node.content || '');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false); // ✨ 下载状态
  const [params, setParams] = useState<GenerationParams>({
    model: 'banana-pro',
    aspectRatio: '4:5',
    style: 'realistic',
    camera: 'sony',
    count: 1,
  });
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [showStyleSelect, setShowStyleSelect] = useState(false);

  const modelRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);
  const paramsBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPrompt(node.content || '');
  }, [node.id, node.content]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setShowModelSelect(false);
      }
      if (styleRef.current && !styleRef.current.contains(e.target as Node)) {
        setShowStyleSelect(false);
      }
    };
    if (showModelSelect || showStyleSelect) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModelSelect, showStyleSelect]);

  // 🔄 滚轮优化：在参数栏上滚动时，横向滚动参数而不是移动画布
  useEffect(() => {
    const paramsBar = paramsBarRef.current;
    if (!paramsBar) return;

    const handleWheel = (e: WheelEvent) => {
      // 阻止默认的画布缩放/移动行为
      e.preventDefault();
      e.stopPropagation();
      
      // 横向滚动参数栏
      paramsBar.scrollLeft += e.deltaY;
    };

    paramsBar.addEventListener('wheel', handleWheel, { passive: false });
    return () => paramsBar.removeEventListener('wheel', handleWheel);
  }, []);

  // 获取当前模型的能力
  const currentModel = MODELS.find(m => m.id === params.model);
  const hasCapability = (cap: string) => currentModel?.capabilities.includes(cap) ?? false;

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate(prompt, params);
  };

  const handleToolClick = (toolId: string, e?: React.MouseEvent) => {
    // 阻止默认行为和冒泡
    e?.preventDefault();
    e?.stopPropagation();
    
    setActiveTool(activeTool === toolId ? null : toolId);
  };

  // ✨ 独立的下载处理函数
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!node.previewUrl || isDownloading) return;
    
    setIsDownloading(true);
    
    // 使用window.open方式下载，最安全
    const link = document.createElement('a');
    link.href = node.previewUrl;
    link.download = `iooi-${node.title || 'image'}-${Date.now()}.png`;
    link.click();
    
    // 快速恢复状态
    setTimeout(() => setIsDownloading(false), 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            exit={{ y: 20 }}
            className="relative w-[900px] max-w-[95vw] bg-[#0d0d0d] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X size={18} />
            </button>

            {/* Top Toolbar */}
            <div className="flex items-center gap-1 px-4 py-3 bg-[#1a1a1a] border-b border-white/5">
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={(e) => handleToolClick(tool.id, e)}
                  disabled={tool.id === 'download' && isDownloading}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs font-medium relative",
                    activeTool === tool.id
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10",
                    tool.id === 'download' && isDownloading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {tool.id === 'download' && isDownloading ? (
                    <>
                      <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      >
                        <tool.icon size={14} />
                      </motion.div>
                      <span>下载中...</span>
                    </>
                  ) : (
                    <>
                      <tool.icon size={14} />
                      <span>{tool.label}</span>
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Main Content */}
            <div className="flex">
              {/* Image Preview Area */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-b from-[#0d0d0d] to-[#1a1a1a] relative">
                <div className="text-white/40 text-sm mb-4 flex items-center gap-2">
                  <ImagePlus size={16} />
                  <span>图片生成</span>
                </div>
                
                {node.previewUrl ? (
                  <div className="relative group">
                    <img
                      src={node.previewUrl}
                      alt={node.title}
                      className="max-w-[400px] max-h-[350px] rounded-xl shadow-2xl object-contain"
                    />
                    
                    {/* ✨ 独立的下载按钮 - 悬浮在图片右下角 */}
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className={cn(
                        "absolute bottom-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100",
                        isDownloading
                          ? "bg-white/20 text-white/40 cursor-not-allowed"
                          : "bg-black/60 backdrop-blur-md text-white/80 hover:bg-black/80 hover:text-white hover:scale-110"
                      )}
                    >
                      {isDownloading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Download size={18} />
                        </motion.div>
                      ) : (
                        <Download size={18} />
                      )}
                    </button>
                    
                    {isGenerating && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-[300px] h-[250px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {isGenerating ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-white/40 text-sm">生成中...</span>
                      </div>
                    ) : (
                      <div className="text-white/20 text-center">
                        <ImagePlus size={48} className="mx-auto mb-2" />
                        <p className="text-sm">输入提示词开始生成</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Input Area */}
            <div className="border-t border-white/10 bg-[#1a1a1a]">
              {/* Prompt Input */}
              <div className="px-4 py-3">
                <div className="relative bg-[#0d0d0d] border border-white/10 rounded-xl p-3 focus-within:border-white/20 transition-colors">
                  {referencedNodes && referencedNodes.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <button type="button" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="添加素材">
                        <ImagePlus size={16} />
                      </button>
                      {referencedNodes.map(refNode => (
                        <div key={refNode.id} className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-white/10 overflow-hidden flex items-center justify-center relative group">
                          {refNode.previewUrl ? (
                            <img src={refNode.previewUrl} className="w-full h-full object-cover" alt={refNode.title || 'reference'} />
                          ) : refNode.type === 'image' ? (
                            <ImagePlus size={16} className="text-white/40" />
                          ) : refNode.type === 'text' ? (
                            <Type size={16} className="text-white/40" />
                          ) : refNode.type === 'video' ? (
                            <Video size={16} className="text-white/40" />
                          ) : (
                            <File size={16} className="text-white/40" />
                          )}
                          <div 
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" 
                            title="取消引用"
                            onClick={() => onRemoveReference?.(refNode.id)}
                          >
                            <X size={14} className="text-white" />
                          </div>
                        </div>
                      ))}
                      <button type="button" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                        <Plus size={18} />
                      </button>
                    </div>
                  )}
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault();
                        if (!isGenerating && prompt.trim()) {
                          handleGenerate();
                        }
                      }
                    }}
                    placeholder="描述任何你想要生成的内容，按 @ 引用素材，/ 呼出指令"
                    className="w-full h-12 bg-transparent border-none text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none leading-relaxed pr-12"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className={cn(
                      "absolute right-2 bottom-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      isGenerating || !prompt.trim()
                        ? "bg-white/10 text-white/30 cursor-not-allowed"
                        : "bg-white/20 text-white hover:bg-white/30"
                    )}
                  >
                    {isGenerating ? (
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Parameters Bar */}
              <div 
                className="flex items-center gap-2 px-4 py-3 border-t border-white/5 overflow-x-auto scrollbar-hide" 
                ref={paramsBarRef}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* Model Selector */}
                <div className="relative flex-shrink-0" ref={modelRef}>
                  <button
                    type="button"
                    onClick={() => setShowModelSelect(!showModelSelect)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-sm"
                  >
                    <span>{MODELS.find(m => m.id === params.model)?.icon}</span>
                    <span className="max-w-[100px] truncate">
                      {MODELS.find(m => m.id === params.model)?.name}</span>
                    <ChevronDown size={14} className="text-white/40" />
                  </button>
                  
                  {showModelSelect && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 max-h-64 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50">
                      {MODELS.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            setParams({ ...params, model: model.id });
                            setShowModelSelect(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors",
                            params.model === model.id ? "bg-white/10 text-white" : "text-white/70"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span>{model.icon}</span>
                            <span className="text-sm">{model.name}</span>
                          </div>
                          <span className="text-xs text-white/40">{model.time}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Aspect Ratio - 始终显示 */}
                {hasCapability('aspectRatio') && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1 flex-shrink-0"
                  >
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.id}
                        type="button"
                        onClick={() => setParams({ ...params, aspectRatio: ratio.id })}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs font-medium transition-all",
                          params.aspectRatio === ratio.id
                            ? "bg-white/20 text-white shadow-lg shadow-white/10"
                            : "text-white/40 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* Style Selector - 根据capabilities显示 */}
                {hasCapability('style') && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative flex-shrink-0" 
                    ref={styleRef}
                  >
                    <button
                      type="button"
                      onClick={() => setShowStyleSelect(!showStyleSelect)}
                      className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-sm"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: STYLES.find(s => s.id === params.style)?.color }}
                      />
                      <span>风格</span>
                      <ChevronDown size={14} className="text-white/40" />
                    </button>
                    
                    {showStyleSelect && (
                      <div className="absolute bottom-full left-0 mb-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                        {STYLES.map((style) => (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => {
                              setParams({ ...params, style: style.id });
                              setShowStyleSelect(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors",
                              params.style === style.id ? "bg-white/10 text-white" : "text-white/70"
                            )}
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: style.color }}
                            />
                            <span className="text-sm">{style.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Camera - 根据capabilities显示 */}
                {hasCapability('camera') && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-sm flex-shrink-0"
                  >
                    <span>{CAMERAS.find(c => c.id === params.camera)?.icon}</span>
                    <span className="max-w-[80px] truncate">
                      {CAMERAS.find(c => c.id === params.camera)?.name}
                    </span>
                  </motion.button>
                )}

                {/* Count - 根据capabilities显示 */}
                {hasCapability('count') && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg flex-shrink-0"
                  >
                    <Settings2 size={14} className="text-white/40" />
                    <span className="text-white/70 text-sm">{params.count}x</span>
                  </motion.div>
                )}

                {/* Generate Button (Mobile) */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className={cn(
                    "ml-auto px-6 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2",
                    isGenerating || !prompt.trim()
                      ? "bg-white/10 text-white/30 cursor-not-allowed"
                      : "bg-white/20 text-white hover:bg-white/30"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      生成中
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      生成
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NodeEditorPanel;