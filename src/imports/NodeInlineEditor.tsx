import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wand2, Eraser, ImagePlus, Maximize, Scissors, RefreshCw,
  Sun, Pencil, Crop, Download, Fullscreen, X, Send,
  ChevronDown, Settings2, Sparkles
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { Node } from './InfiniteCanvas';

interface NodeInlineEditorProps {
  node: Node;
  scale: number;
  position: { x: number; y: number };
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
  { id: 'download', icon: Download, label: '下载' },
  { id: 'fullscreen', icon: Fullscreen, label: '放大' },
];

const MODELS = [
  { id: 'banana-pro', name: 'Banana Pro', icon: '🍌' },
  { id: 'midjourney', name: 'Midjourney', icon: '🎨' },
  { id: 'dalle3', name: 'DALL-E 3', icon: '🖼️' },
  { id: 'sdxl', name: 'Stable Diffusion XL', icon: '🤖' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1' },
  { id: '4:3', label: '4:3' },
  { id: '3:4', label: '3:4' },
  { id: '16:9', label: '16:9' },
  { id: '9:16', label: '9:16' },
  { id: '4:5', label: '4:5 · 4K' },
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

export const NodeInlineEditor: React.FC<NodeInlineEditorProps> = ({
  node,
  scale,
  position,
  onClose,
  onGenerate,
  isGenerating,
}) => {
  const [prompt, setPrompt] = useState(node.content || '');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [params, setParams] = useState<GenerationParams>({
    model: 'banana-pro',
    aspectRatio: '4:5',
    style: 'realistic',
    camera: 'sony',
    count: 1,
  });
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [showStyleSelect, setShowStyleSelect] = useState(false);
  const [showAspectSelect, setShowAspectSelect] = useState(false);
  const [showCameraSelect, setShowCameraSelect] = useState(false);

  // Calculate position relative to the node
  const nodeScreenX = node.x * scale + position.x;
  const nodeScreenY = node.y * scale + position.y;
  const nodeWidth = 220 * scale; // Original node width
  const nodeHeight = (node.type === 'image' ? 180 : 160) * scale;

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate(prompt, params);
  };

  const handleToolClick = (toolId: string) => {
    if (toolId === 'download') {
      if (node.previewUrl) {
        const link = document.createElement('a');
        link.href = node.previewUrl;
        link.download = `${node.title}-${node.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      setActiveTool(activeTool === toolId ? null : toolId);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowModelSelect(false);
      setShowStyleSelect(false);
      setShowAspectSelect(false);
      setShowCameraSelect(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      {/* Top Toolbar - Above the node */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute z-50 flex items-center gap-0.5 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 px-2 py-1.5 rounded-xl shadow-2xl whitespace-nowrap"
        style={{
          left: node.x + nodeWidth / (2 * scale),
          top: node.y - 50 / scale,
          transform: 'translateX(-50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={(e) => {
              e.stopPropagation();
              handleToolClick(tool.id);
            }}
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all text-xs font-medium",
              activeTool === tool.id
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
            title={tool.label}
          >
            <tool.icon size={14} />
            <span>{tool.label}</span>
          </button>
        ))}
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          title="关闭"
        >
          <X size={14} />
        </button>
      </motion.div>

      {/* Bottom Control Panel - Below the node */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute z-50 w-[420px] bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        style={{
          left: node.x + nodeWidth / (2 * scale),
          top: node.y + nodeHeight / scale + 16 / scale,
          transform: 'translateX(-50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prompt Input */}
        <div className="p-3 border-b border-white/5">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要的图片..."
              className="w-full h-16 bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-white/90 text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleGenerate();
              }}
              disabled={isGenerating || !prompt.trim()}
              className={cn(
                "absolute right-2 bottom-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                isGenerating || !prompt.trim()
                  ? "bg-white/10 text-white/30 cursor-not-allowed"
                  : "bg-white text-black hover:bg-white/90"
              )}
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>

        {/* Parameters Bar */}
        <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto">
          {/* Model */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModelSelect(!showModelSelect);
              }}
              className="flex items-center gap-1.5 px-2 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 transition-all text-xs"
            >
              <span>{MODELS.find(m => m.id === params.model)?.icon}</span>
              <span className="max-w-[60px] truncate">
                {MODELS.find(m => m.id === params.model)?.name}
              </span>
              <ChevronDown size={12} className="text-white/40" />
            </button>
            
            {showModelSelect && (
              <div 
                className="absolute bottom-full left-0 mb-1 w-40 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setParams({ ...params, model: model.id });
                      setShowModelSelect(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors text-xs",
                      params.model === model.id ? "bg-white/10 text-white" : "text-white/70"
                    )}
                  >
                    <span>{model.icon}</span>
                    <span>{model.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Aspect Ratio */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAspectSelect(!showAspectSelect);
              }}
              className="flex items-center gap-1 px-2 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 transition-all text-xs"
            >
              <span>{ASPECT_RATIOS.find(r => r.id === params.aspectRatio)?.label}</span>
              <ChevronDown size={12} className="text-white/40" />
            </button>
            
            {showAspectSelect && (
              <div 
                className="absolute bottom-full left-0 mb-1 flex gap-1 p-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => {
                      setParams({ ...params, aspectRatio: ratio.id });
                      setShowAspectSelect(false);
                    }}
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium transition-all",
                      params.aspectRatio === ratio.id
                        ? "bg-white/20 text-white"
                        : "text-white/40 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Style */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStyleSelect(!showStyleSelect);
              }}
              className="flex items-center gap-1.5 px-2 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 transition-all text-xs"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STYLES.find(s => s.id === params.style)?.color }}
              />
              <span>风格</span>
              <ChevronDown size={12} className="text-white/40" />
            </button>
            
            {showStyleSelect && (
              <div 
                className="absolute bottom-full left-0 mb-1 w-28 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setParams({ ...params, style: style.id });
                      setShowStyleSelect(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors text-xs",
                      params.style === style.id ? "bg-white/10 text-white" : "text-white/70"
                    )}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: style.color }}
                    />
                    <span>{style.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Camera */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCameraSelect(!showCameraSelect);
              }}
              className="flex items-center gap-1 px-2 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 transition-all text-xs"
            >
              <span>{CAMERAS.find(c => c.id === params.camera)?.icon}</span>
              <span className="max-w-[50px] truncate">
                {CAMERAS.find(c => c.id === params.camera)?.name}
              </span>
              <ChevronDown size={12} className="text-white/40" />
            </button>
            
            {showCameraSelect && (
              <div 
                className="absolute bottom-full left-0 mb-1 w-36 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {CAMERAS.map((camera) => (
                  <button
                    key={camera.id}
                    onClick={() => {
                      setParams({ ...params, camera: camera.id });
                      setShowCameraSelect(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors text-xs",
                      params.camera === camera.id ? "bg-white/10 text-white" : "text-white/70"
                    )}
                  >
                    <span>{camera.icon}</span>
                    <span>{camera.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Count */}
          <div className="flex items-center gap-1 px-2 py-1.5 bg-[#0d0d0d] border border-white/10 rounded-lg text-xs">
            <Settings2 size={12} className="text-white/40" />
            <span className="text-white/70">{params.count}x</span>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default NodeInlineEditor;