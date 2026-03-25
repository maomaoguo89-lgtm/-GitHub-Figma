import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wand2, Eraser, ImagePlus, Maximize, Scissors, RefreshCw,
  Sun, Pencil, Crop, Download, Fullscreen, X, Send,
  ChevronDown, Settings2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { Node } from './InfiniteCanvas';

interface NodeEditorPanelProps {
  node: Node;
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
  isOpen,
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

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate(prompt, params);
  };

  const handleToolClick = (toolId: string) => {
    if (toolId === 'download') {
      // Trigger download
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
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
                  onClick={() => handleToolClick(tool.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs font-medium",
                    activeTool === tool.id
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  <tool.icon size={14} />
                  <span>{tool.label}</span>
                </button>
              ))}
            </div>

            {/* Main Content */}
            <div className="flex">
              {/* Image Preview Area */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-b from-[#0d0d0d] to-[#1a1a1a]">
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
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="描述你想要的图片..."
                    className="w-full h-20 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-white/20"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className={cn(
                      "absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      isGenerating || !prompt.trim()
                        ? "bg-white/10 text-white/30 cursor-not-allowed"
                        : "bg-white text-black hover:bg-white/90"
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
              <div className="flex items-center gap-2 px-4 py-3 border-t border-white/5">
                {/* Model Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowModelSelect(!showModelSelect)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 transition-all text-sm"
                  >
                    <span>{MODELS.find(m => m.id === params.model)?.icon}</span>
                    <span className="max-w-[100px] truncate">
                      {MODELS.find(m => m.id === params.model)?.name}
                    </span>
                    <ChevronDown size={14} className="text-white/40" />
                  </button>
                  
                  {showModelSelect && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      {MODELS.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setParams({ ...params, model: model.id });
                            setShowModelSelect(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors",
                            params.model === model.id ? "bg-white/10 text-white" : "text-white/70"
                          )}
                        >
                          <span>{model.icon}</span>
                          <span className="text-sm">{model.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Aspect Ratio */}
                <div className="flex items-center gap-1">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setParams({ ...params, aspectRatio: ratio.id })}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium transition-all",
                        params.aspectRatio === ratio.id
                          ? "bg-white/20 text-white"
                          : "text-white/40 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>

                {/* Style Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowStyleSelect(!showStyleSelect)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 transition-all text-sm"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: STYLES.find(s => s.id === params.style)?.color }}
                    />
                    <span>风格</span>
                    <ChevronDown size={14} className="text-white/40" />
                  </button>
                  
                  {showStyleSelect && (
                    <div className="absolute bottom-full left-0 mb-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      {STYLES.map((style) => (
                        <button
                          key={style.id}
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
                </div>

                {/* Camera */}
                <button className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 transition-all text-sm">
                  <span>{CAMERAS.find(c => c.id === params.camera)?.icon}</span>
                  <span className="max-w-[80px] truncate">
                    {CAMERAS.find(c => c.id === params.camera)?.name}
                  </span>
                </button>

                {/* Count */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-white/10 rounded-lg">
                  <Settings2 size={14} className="text-white/40" />
                  <span className="text-white/70 text-sm">{params.count}x</span>
                </div>

                {/* Generate Button (Mobile) */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className={cn(
                    "ml-auto px-6 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2",
                    isGenerating || !prompt.trim()
                      ? "bg-white/10 text-white/30 cursor-not-allowed"
                      : "bg-white text-black hover:bg-white/90"
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