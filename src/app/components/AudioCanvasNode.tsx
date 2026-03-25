import React, { useState, memo, useRef, useEffect } from 'react';
import { 
  Plus, Music, Upload, ChevronUp, Mic, SlidersHorizontal, Zap, Maximize2, Image as ImageIcon, ArrowUp
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Node, useCanvasStore } from '../store/canvasStore';
import { motion, AnimatePresence } from 'motion/react';
import { GenerateCheckbox } from './GenerateCheckbox';
import { AIService } from '../services/aiService';
import { useApiConfigStore } from '../store/apiConfigStore';
import { useUIStore } from '../store/uiStore';

interface AudioCanvasNodeProps {
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

export const AudioCanvasNode = memo(({ 
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
}: AudioCanvasNodeProps) => {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(node.status === 'done');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const updateNode = useCanvasStore((state) => state.updateNode);
  const { configs } = useApiConfigStore();
  const { openSettings } = useUIStore();

  // 计算连接点的精确位置：
  // 标签行高(约20px) + 标签底部margin(8px = mb-2) + 音频高度的一半
  const LABEL_HEIGHT_WITH_MARGIN = 28;  // 标签高度 + mb-2
  const AUDIO_HEIGHT = 360;
  const portTopPosition = LABEL_HEIGHT_WITH_MARGIN + AUDIO_HEIGHT / 2;

  useEffect(() => {
    setPreview(node.status === 'done');
  }, [node.status]);

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

  const processAndSetAudio = (file: File) => {
    if (!file) return;
    
    // For now we just show the audio preview state
    setPreview(true);
    // In a real app we would create an object URL or upload to server
    // const tempUrl = URL.createObjectURL(file);
    // setAudioUrl(tempUrl);
    updateNode(node.id, { status: 'done' });
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setPreview(true);
      setGenerating(false);
    }, 1500);
  };

  const generateAudio = async () => {
    console.log('=== 开始音频生成流程 ===');
    console.log('1. Prompt:', prompt);
    
    if (!prompt.trim()) {
      alert('请先输入生成内容的描述');
      return;
    }
    
    console.log('2. 查找API配置...');
    console.log('   - 音频生成配置:', configs.audio);
    
    // 获取音频生成的API配置
    const audioConfig = configs.audio;
    
    console.log('3. 音频配置状态:', audioConfig);
    
    if (!audioConfig.enabled) {
      console.error('❌ 音频生成API未启用');
      const shouldOpenSettings = confirm(
        '音频生成API未启用\n\n点击"确定"前往设置页面配置，或点击"取消"稍后配置。'
      );
      if (shouldOpenSettings) {
        openSettings();
      }
      return;
    }

    if (!audioConfig.apiKey) {
      console.error('❌ API密钥未配置');
      const shouldOpenSettings = confirm(
        `音频生成API密钥未配置\n\n点击"确定"前往设置页面配置API密钥，或点击"取消"稍后配置。`
      );
      if (shouldOpenSettings) {
        openSettings();
      }
      return;
    }

    console.log('4. API密钥已配置（前10位）:', audioConfig.apiKey.substring(0, 10) + '...');
    
    setGenerating(true);
    updateNode(node.id, { status: 'generating', content: prompt });

    try {
      console.log('5. 准备调用API:');
      console.log('   - Base URL:', audioConfig.baseUrl);
      console.log('   - Model:', audioConfig.selectedModel);
      console.log('   - Prompt:', prompt.substring(0, 100) + '...');

      const result = await AIService.generateAudio(
        audioConfig,
        prompt,
        {
          voice: 'alloy', // 默认音色
          format: 'mp3'
        }
      );

      console.log('6. ✅ 音频生成成功！');
      console.log('   - 音频URL:', result.url);
      console.log('   - 任务ID:', result.taskId);

      setPreview(true);
      setGenerating(false);
      setPrompt(''); // 清空输入框
      
      updateNode(node.id, { 
        previewUrl: result.url || '',
        status: 'done'
      });
    } catch (error) {
      console.error('❌ AI音频生成失败:', error);
      setGenerating(false);
      updateNode(node.id, { status: 'idle' });
      
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`音频生成失败: ${errorMessage}\n\n请检查:\n1. API密钥是否正确\n2. 网络连接是否正常\n3. API服务是否可用\n\n详细错误信息请查看浏览器控制台（F12）`);
    }
  };

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
        accept="audio/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            processAndSetAudio(file);
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
          <Music size={14} />
          <span className="text-xs font-medium">Audio</span>
        </div>
        
        <div 
          className={cn(
            "rounded-xl border bg-black/40 backdrop-blur-xl transition-all relative overflow-hidden",
            preview ? "p-0" : "p-1",
            isSelected 
              ? "border-white/[0.15] shadow-[0_0_30px_rgba(255,255,255,0.12),0_0_60px_rgba(255,255,255,0.06)]" 
              : "border-white/[0.03] hover:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
          )}
          style={{
            width: 640,
            height: 360,
            backgroundColor: `color-mix(in srgb, var(--node-bg, #000000) 40%, transparent)`
          }}
        >
          {preview ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/60 gap-4">
              <div className="flex items-center justify-center gap-1 h-8">
                {[1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5].map((h, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: [8, h * 6, 8] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                    className="w-1 bg-white/40 rounded-full"
                  />
                ))}
              </div>
              <div className="text-xs">00:00 / 00:15</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/10">
              <div className="flex items-center justify-center gap-1">
                {[2, 4, 6, 4, 2].map((h, i) => (
                  <div key={i} className="w-1.5 bg-white/20 rounded-full" style={{ height: h * 4 }} />
                ))}
              </div>
            </div>
          )}
          {generating && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Connection Ports - 放在 group div 外层，使用动态计算的位置对齐音频中心 */}
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
            className="absolute top-full mt-4 w-[480px] bg-[#1e1e1e] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={3000}
                className="w-full h-16 bg-transparent text-sm text-white/90 resize-none outline-none placeholder:text-white/30 pr-8 scrollbar-thin"
                placeholder="描述你想要生成的任何内容。可用方括号描述情感,如 [咯咯笑]"
              />
              <button className="absolute top-0 right-0 text-white/40 hover:text-white">
                <Maximize2 size={14} />
              </button>
            </div>
            
            <div className="flex flex-col gap-3 mt-4">
              {/* 第一行功能选项 */}
              <div className="flex items-center gap-2.5">
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/90 font-medium text-xs whitespace-nowrap">
                  <Mic size={13} />
                  文字转语音
                </button>
                <div className="w-px h-3.5 bg-white/10" />
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/90 font-medium text-xs whitespace-nowrap">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-2.5 bg-white/60" />
                    <div className="w-1 h-2.5 bg-white/60" />
                  </div>
                  ElevenLabs V3
                </button>
                <div className="w-px h-3.5 bg-white/10" />
                <button className="w-7 h-7 flex items-center justify-center hover:bg-white/5 rounded-lg text-white/60">
                  <SlidersHorizontal size={13} />
                </button>
                
                <div className="flex-1" />
                
                <span className="text-white/30 text-xs whitespace-nowrap">{prompt.length}/3000</span>
              </div>

              {/* 第二行：费用和生成按钮 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                  <Zap size={11} className="text-white/70" />
                  <span className="text-white/80 text-xs font-medium whitespace-nowrap">5/百字符</span>
                </div>
                
                <button 
                  onClick={() => {
                    if (!generating && prompt.trim()) {
                      generateAudio();
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 pl-3 pr-1 py-1 rounded-full transition-all whitespace-nowrap",
                    generating ? "bg-white/10 opacity-50 cursor-not-allowed" : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                >
                  <span className="text-[13px] font-medium text-white/90">生成</span>
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

AudioCanvasNode.displayName = 'AudioCanvasNode';