import React, { useState, memo, useRef, useEffect } from 'react';
import { 
  Plus, Video, Upload, ChevronUp, Play, SlidersHorizontal, Zap, Camera, Maximize2, Film,
  Sparkles, RefreshCw, Volume2, Image as ImageIcon, Monitor, ArrowRightLeft, Mic, ArrowUp, Box
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Node, useCanvasStore } from '../store/canvasStore';
import { motion, AnimatePresence } from 'motion/react';
import { GeneratingOverlay } from './GeneratingOverlay';
import { AIService } from '../services/aiService';
import { useApiConfigStore } from '../store/apiConfigStore';
import { useUIStore } from '../store/uiStore';

interface VideoCanvasNodeProps {
  node: Node;
  isSelected: boolean;
  isGenerating: boolean;
  onPointerDown: (e: React.PointerEvent, node: Node) => void;
  onSettingsClick: (e: React.MouseEvent, id: string) => void;
  onPortPointerDown?: (e: React.PointerEvent, nodeId: string, port: 'left' | 'right') => void;
  onPortPointerUp?: (e: React.PointerEvent, nodeId: string, port: 'left' | 'right') => void;
  hasLeftConnection?: number | boolean;
  hasRightConnection?: number | boolean;
  connectedSourceNodes?: Node[];
  isSingleSelection?: boolean;
}

export const VideoCanvasNode = memo(({ 
  node, 
  isSelected, 
  isGenerating,
  onPointerDown, 
  onSettingsClick,
  onPortPointerDown,
  onPortPointerUp,
  hasLeftConnection,
  hasRightConnection,
  connectedSourceNodes = [],
  isSingleSelection
}: VideoCanvasNodeProps) => {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(node.previewUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateNode = useCanvasStore((state) => state.updateNode);
  const { configs } = useApiConfigStore();
  const { openSettings } = useUIStore();

  useEffect(() => {
    if (node.previewUrl !== preview) {
      setPreview(node.previewUrl || "");
    }
  }, [node.previewUrl]);

  // 自动更新节点尺寸
  const nodeSizeRef = useRef({ width: node.width || 0, height: node.height || 0 });
  useEffect(() => {
    nodeSizeRef.current = { width: node.width || 0, height: node.height || 0 };
  }, [node.width, node.height]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
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

  const processAndSetVideo = (file: File) => {
    if (!file) return;
    
    const tempUrl = URL.createObjectURL(file);
    const videoElem = document.createElement('video');
    videoElem.src = tempUrl;
    videoElem.onloadedmetadata = () => {
      setPreview(tempUrl);
      updateNode(node.id, { 
        previewUrl: tempUrl, 
        status: 'done',
        isUploaded: true,
        naturalWidth: videoElem.videoWidth,
        naturalHeight: videoElem.videoHeight
      });
    };
  };

  const handleGenerate = async () => {
    console.log('=== 开始视频生成流程 ===');
    console.log('1. Prompt:', prompt);
    
    if (!prompt.trim()) {
      alert('请先输入生成内容的描述');
      return;
    }
    
    console.log('2. 查找API配置...');
    console.log('   - 视频生成配置:', configs.video);
    
    // 获取视频生成的API配置
    const videoConfig = configs.video;
    
    console.log('3. 视频配置状态:', videoConfig);
    
    if (!videoConfig.enabled) {
      console.error('❌ 视频生成API未启用');
      const shouldOpenSettings = confirm(
        '视频生成API未启用\n\n点击"确定"前往设置页面配置，或点击"取消"稍后配置。'
      );
      if (shouldOpenSettings) {
        openSettings();
      }
      return;
    }

    if (!videoConfig.apiKey) {
      console.error('❌ API密钥未配置');
      const shouldOpenSettings = confirm(
        `视频生成API密钥未配置\n\n点击"确定"前往设置页面配置API密钥，或点击"取消"稍后配置。`
      );
      if (shouldOpenSettings) {
        openSettings();
      }
      return;
    }

    console.log('4. API密钥已配置（前10位）:', videoConfig.apiKey.substring(0, 10) + '...');
    
    setGenerating(true);
    updateNode(node.id, { status: 'generating', content: prompt });

    try {
      console.log('5. 准备调用API:');
      console.log('   - Base URL:', videoConfig.baseUrl);
      console.log('   - Model:', videoConfig.selectedModel);
      console.log('   - Prompt:', prompt.substring(0, 100) + '...');

      const result = await AIService.generateVideo(
        videoConfig,
        prompt,
        {
          duration: 8, // 8秒视频
          aspect_ratio: '16:9', // 16:9比例
          quality: 'standard'
        }
      );

      console.log('6. ✅ 视频生成成功！');
      console.log('   - 视频URL:', result.url);
      console.log('   - 任务ID:', result.taskId);

      setPreview(result.url || 'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=400&h=300&fit=crop'); // 使用生成的URL或占位图
      setGenerating(false);
      setPrompt(''); // 清空输入框
      
      updateNode(node.id, { 
        previewUrl: result.url || '',
        status: 'done'
      });
    } catch (error) {
      console.error('❌ AI视频生成失败:', error);
      setGenerating(false);
      updateNode(node.id, { status: 'idle' });
      
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`视频生成失败: ${errorMessage}\n\n请检查:\n1. API密钥是否正确\n2. 网络连接是否正常\n3. API服务是否可用\n\n详细错误信息请查看浏览器控制台（F12）`);
    }
  };

  const getDimensions = () => {
    let ratioValue = 16 / 9; // Default video aspect ratio

    if (node.isUploaded && node.naturalWidth && node.naturalHeight) {
      ratioValue = node.naturalWidth / node.naturalHeight;
    } else if (node.aspectRatio) {
      const [wStr, hStr] = node.aspectRatio.split(':');
      if (wStr && hStr) {
        ratioValue = parseInt(wStr) / parseInt(hStr);
      }
    }

    const STANDARD_SIZE = 360;
    let width, height;

    if (ratioValue >= 1) {
      // Horizontal or square
      height = STANDARD_SIZE;
      width = Math.round(STANDARD_SIZE * ratioValue);
    } else {
      // Vertical
      width = STANDARD_SIZE;
      height = Math.round(STANDARD_SIZE / ratioValue);
    }

    return { width, height };
  };

  const dimensions = getDimensions();
  
  // 计算连接点的精确位置：
  // 标签行高(约20px) + 标签底部margin(8px = mb-2) + 视频高度的一半
  const LABEL_HEIGHT_WITH_MARGIN = 28;  // 标签高度 + mb-2
  const portTopPosition = LABEL_HEIGHT_WITH_MARGIN + dimensions.height / 2;

  return (
    <div
      className={cn(
        "absolute cursor-default flex flex-col items-center",
        isSelected ? "z-20" : "z-10"
      )}
      style={{
        transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
        willChange: 'transform',
      }}
      onPointerDown={(e) => onPointerDown(e, node)}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="video/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            processAndSetVideo(file);
          }
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }} 
      />
      {/* 1. Top Toolbar */}
      <AnimatePresence>
        {isSingleSelection && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-12 flex items-center p-1.5 rounded-full bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/10 shadow-xl"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-2 px-3 py-1 hover:bg-white/10 rounded-full text-white/80 text-xs font-medium transition-colors"
            >
              <Upload size={14} />
              上传
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Content Editor */}
      <div className="relative group" ref={containerRef}>
        <div className="flex items-center gap-1.5 mb-2 px-1 text-white/60">
          <Video size={14} />
          <span className="text-xs font-medium">Video</span>
        </div>
        
        <div 
          className={cn(
            "rounded-xl border backdrop-blur-xl transition-all relative overflow-hidden",
            preview ? "p-0" : "p-1",
            isSelected 
              ? "border-white/[0.15] shadow-[0_0_30px_rgba(255,255,255,0.12),0_0_60px_rgba(255,255,255,0.06)]" 
              : "border-white/[0.03] hover:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
          )}
          style={{
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: `color-mix(in srgb, var(--node-bg, #000000) 40%, transparent)`
          }}
        >
          {preview ? (
            <div className="relative w-full h-full">
              <img src={preview} alt="Generated" className="w-full h-full object-cover rounded-xl pointer-events-none" draggable={false} />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <button className="w-12 h-12 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm hover:scale-105 transition-transform">
                  <Play size={20} className="ml-1" />
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/10">
              <div className="w-12 h-12 rounded-2xl border-2 border-white/10 flex items-center justify-center">
                <Play size={24} className="ml-1" />
              </div>
            </div>
          )}
          {generating && (
            <GeneratingOverlay />
          )}
        </div>

        {/* Connection Ports - 放在 group div，视频预览 div 外部 */}
        <div 
          onPointerDown={(e) => { 
            e.stopPropagation(); 
            try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(err) {}
            onPortPointerDown?.(e, node.id, 'left'); 
          }}
          onPointerUp={(e) => { e.stopPropagation(); onPortPointerUp?.(e, node.id, 'left'); }}
          className={cn(
            "absolute -left-9 w-6 h-6 rounded-full border bg-[#111] flex items-center justify-center transition-all cursor-crosshair z-10",
            hasLeftConnection 
              ? "border-white/40 bg-white/10 opacity-100 hover:border-white/60 hover:bg-white/20" 
              : "border-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:border-white/40"
          )}
          style={{ top: portTopPosition }}
        >
          {hasLeftConnection && typeof hasLeftConnection === 'number' ? (
            <span className="text-[10px] font-bold text-white">{hasLeftConnection}</span>
          ) : (
            <Plus size={12} className="text-white/60" />
          )}
        </div>
        <div 
          onPointerDown={(e) => { 
            e.stopPropagation(); 
            try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(err) {}
            onPortPointerDown?.(e, node.id, 'right'); 
          }}
          onPointerUp={(e) => { e.stopPropagation(); onPortPointerUp?.(e, node.id, 'right'); }}
          className={cn(
            "absolute -right-9 w-6 h-6 rounded-full border bg-[#111] flex items-center justify-center transition-all cursor-crosshair z-10",
            hasRightConnection 
              ? "border-white/40 bg-white/10 opacity-100 hover:border-white/60 hover:bg-white/20" 
              : "border-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:border-white/40"
          )}
          style={{ top: portTopPosition }}
        >
          {hasRightConnection && typeof hasRightConnection === 'number' ? (
            <span className="text-[10px] font-bold text-white">{hasRightConnection}</span>
          ) : (
            <Plus size={12} className="text-white/60" />
          )}
        </div>
      </div>

      {/* 3. Bottom Control Bar */}
      <AnimatePresence>
        {isSingleSelection && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-4 bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 pointer-events-auto"
            style={{ width: Math.max(640, dimensions.width) }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-5 mt-1">
              <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <ImageIcon size={14} />
              </button>
              <div className="w-[1px] h-4 bg-white/10 mx-3"></div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  <Plus size={14} />
                </button>
                <ArrowRightLeft size={14} className="text-white/40" />
                <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onBlur={() => updateNode(node.id, { content: prompt })}
              onWheel={(e) => e.stopPropagation()} // 阻止滚轮事件传播到画布
              className="w-full h-24 bg-transparent text-[15px] text-white/90 resize-none outline-none placeholder:text-white/30 leading-relaxed mb-4 px-1 scrollbar-thin"
              placeholder="描述任何你想要生成的内容，如：一只小狗在草坪上奔跑，阳光洒在它的毛发上..."
            />
            
            {/* Bottom Controls */}
            <div className="flex items-center justify-between px-1 whitespace-nowrap">
              <div className="flex items-center text-[13px] gap-3">
                <button className="flex items-center gap-1.5 text-white/90 font-medium hover:text-white transition-colors">
                  <Sparkles size={14} className="text-white/70" />
                  Kling 3.0 Omni
                </button>
                
                <div className="w-[1px] h-3 bg-white/20" />
                
                <div className="flex items-center font-medium text-white/90 gap-1.5">
                  <span>首尾帧</span>
                  <span className="text-white/40">·</span>
                  <span>16:9</span>
                  <span className="text-white/40">·</span>
                  <span>自适应</span>
                  <span className="text-white/40">·</span>
                  <span>8s</span>
                  <span className="text-white/40">·</span>
                  <Volume2 size={14} className="text-white/70" />
                </div>

                <div className="w-[1px] h-3 bg-white/20" />
                
                <button className="text-white/70 hover:text-white transition-colors">
                  <SlidersHorizontal size={14} />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button className="text-white/70 hover:text-white transition-colors">
                  <Mic size={14} />
                </button>
                <span className="text-[13px] font-medium text-white/90">1x</span>
                
                {/* Capsule Button */}
                <button 
                  onClick={() => {
                    if (!generating && prompt.trim()) {
                      handleGenerate();
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 pl-3 pr-1 py-1 rounded-full transition-all whitespace-nowrap",
                    generating ? "bg-white/10 opacity-50 cursor-not-allowed" : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                >
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-white/90">
                    <Box size={14} className="text-white/70" />
                    18/秒
                  </div>
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-transform",
                    generating ? "bg-white/20" : "bg-[#444] hover:bg-[#555] hover:scale-105 shadow-sm"
                  )}>
                    {generating ? (
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    ) : (
                      <ArrowUp size={14} className="text-white" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

VideoCanvasNode.displayName = 'VideoCanvasNode';