import React, { useState, memo, useRef } from 'react';
import { 
  Plus, FileText, Upload, ChevronUp, Monitor, Palette, Zap, Maximize2, Clock,
  Sparkles, List, ListOrdered, Copy, Pilcrow, Minus, Edit3
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Node, useCanvasStore } from '../store/canvasStore';
import { motion, AnimatePresence } from 'motion/react';
import { GenerateCheckbox } from './GenerateCheckbox';
import { parseWordDocument } from '../utils/documentParser';
import { AIService } from '../services/aiService';
import { useApiConfigStore } from '../store/apiConfigStore';
import { useUIStore } from '../store/uiStore';
import { FullscreenTextEditor } from './FullscreenTextEditor';

interface TextCanvasNodeProps {
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

export const TextCanvasNode = memo(({ 
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
}: TextCanvasNodeProps) => {
  const [content, setContent] = useState(node.content || "1. 开启你的创作...");
  const [prompt, setPrompt] = useState("");
  const [showModels, setShowModels] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [bgColor, setBgColor] = useState("bg-[#1a1a1a]"); // Default color
  const [selectedModel, setSelectedModel] = useState("Gemini 3.1 Flash Lite");
  const [generating, setGenerating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showTextActions, setShowTextActions] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [size, setSize] = useState({ width: 280, height: 280 });
  const [isResizing, setIsResizing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, corner: '' });
  
  const updateNode = useCanvasStore((state) => state.updateNode);
  const { configs } = useApiConfigStore();
  const { openSettings } = useUIStore();

  const models = [
    { name: "Gemini 3.1 Pro", time: "10 ~ 20s" },
    { name: "Gemini 3.1 Flash Lite", desc: "Gemini 3.1 系列轻量快速 AI 模型", time: "5 ~ 10s" },
    { name: "Gemini 3 Flash", time: "10 ~ 20s" },
    { name: "Gemini 2.5 Flash", time: "5 ~ 10s" },
    { name: "Gemini 2.5 Pro", time: "20 s" },
  ];

  const colors = [
    "bg-[#1a1a1a]", // Default dark
    "bg-[#4a2e2e]", // Red
    "bg-[#4a3620]", // Orange
    "bg-[#454020]", // Yellow
    "bg-[#2d402b]", // Green
    "bg-[#244042]", // Cyan
    "bg-[#243545]", // Blue
    "bg-[#3d2a45]"  // Purple
  ];

  const processAndSetText = async (file: File) => {
    if (!file) return;
    
    if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const nodeData = await parseWordDocument(file, file.name, 0, 0, 0);
        if (nodeData && nodeData.content) {
          setContent(nodeData.content);
          updateNode(node.id, { content: nodeData.content, title: file.name });
        }
      } catch (err) {
        console.error("Error parsing word document:", err);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setContent(text);
          updateNode(node.id, { content: text, title: file.name });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleGenerate = async () => {
    console.log('=== 开始生成流程 ===');
    console.log('1. Prompt:', prompt);
    
    if (!prompt.trim()) {
      alert('请先输入生成内容的描述');
      return;
    }
    
    console.log('2. 查找API配置...');
    console.log('   - 文本生成配置:', configs.text);
    
    // 获取文本生成的API配置
    const textConfig = configs.text;
    
    console.log('3. 文本配置状态:', textConfig);
    
    if (!textConfig.enabled) {
      console.error('❌ 文本生成API未启用');
      const shouldOpenSettings = confirm(
        '文本生成API未启用\n\n点击"确定"前往设置页面配置，或点击"取消"稍后配置。'
      );
      if (shouldOpenSettings) {
        openSettings();
      }
      return;
    }

    if (!textConfig.apiKey) {
      console.error('❌ API密钥未配置');
      const shouldOpenSettings = confirm(
        `API密钥未配置\n\n点击"确定"前往设置页面配置API密钥，或点击"取消"稍后配置。`
      );
      if (shouldOpenSettings) {
        openSettings();
      }
      return;
    }

    console.log('4. API密钥已配置（前10位）:', textConfig.apiKey.substring(0, 10) + '...');
    
    setGenerating(true);
    updateNode(node.id, { status: 'generating' });

    try {
      // 使用配置中的模型
      const modelId = textConfig.selectedModel;

      console.log('5. 准备调用API:');
      console.log('   - Base URL:', textConfig.baseUrl);
      console.log('   - Model:', modelId);
      console.log('   - Prompt:', prompt.substring(0, 100) + '...');

      // 添加 System Prompt 来约束AI输出格式
      const systemPrompt = `你是一个专业的内容创作助手。请直接输出用户要求的内容，不要包含：
- 思考过程（如 "I'm now refining..."）
- 元标签（如 **Refining the Narrative**）
- 解释性文字（如 "接下来我将..."）
- 自我对话（如 "让我想想..."）

只输出最终的内容结果，简洁、专业、直接。`;

      const generatedContent = await AIService.generateText(
        textConfig,
        prompt,
        systemPrompt, // 传入 system prompt
        modelId
      );

      console.log('6. ✅ 生成成功！');
      console.log('   - 内容长度:', generatedContent.length);
      console.log('   - 内容预览:', generatedContent.substring(0, 100) + '...');

      setContent(generatedContent);
      setGenerating(false);
      setPrompt(''); // 清空输入框
      
      updateNode(node.id, { 
        content: generatedContent,
        status: 'done'
      });
    } catch (error) {
      console.error('❌ AI生成失败:', error);
      setGenerating(false);
      updateNode(node.id, { status: 'idle' });
      
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`生成失败: ${errorMessage}\n\n请检查:\n1. API密钥是否正确\n2. 网络连接是否正常\n3. API服务是否可用\n\n详细错误信息请查看浏览器控制台（F12）`);
    }
  };

  const handleTextAreaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected && !isEditMode) {
      setIsEditMode(true);
    }
  };

  const handleBlur = () => {
    setIsEditMode(false);
    updateNode(node.id, { content });
  };

  const tooltipClasses = "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1a1a1a] border border-white/10 text-white/90 text-[10px] rounded whitespace-nowrap opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-opacity shadow-xl";

  const handleResizeStart = (e: React.PointerEvent, corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
    e.stopPropagation();
    const currentRef = e.currentTarget;
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      corner
    };
    setIsResizing(true);
    currentRef.setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!isResizing) return;
    e.stopPropagation();
    const { x, y, width, height, corner } = resizeStartRef.current;
    const dx = e.clientX - x;
    const dy = e.clientY - y;
    
    let newWidth = width;
    let newHeight = height;
    
    if (corner.includes('left')) {
      newWidth = Math.max(200, width - dx);
    } else if (corner.includes('right')) {
      newWidth = Math.max(200, width + dx);
    }
    
    if (corner.includes('top')) {
      newHeight = Math.max(150, height - dy);
    } else if (corner.includes('bottom')) {
      newHeight = Math.max(150, height + dy);
    }
    
    setSize({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = (e: React.PointerEvent) => {
    if (!isResizing) return;
    e.stopPropagation();
    const currentRef = e.currentTarget;
    try {
      currentRef.releasePointerCapture(e.pointerId);
    } catch(err) {}
    setIsResizing(false);
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
        accept=".txt,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            processAndSetText(file);
          }
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }} 
      />
      {/* 1. Top Toolbar (Floating) */}
      <AnimatePresence>
        {isSingleSelection && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-16 flex items-center gap-1 p-1.5 rounded-full bg-[#1e1e1e] border border-white/10 shadow-xl"
            onPointerDown={(e) => e.stopPropagation()} // Prevent dragging node when clicking toolbar
          >
            {/* Color Picker */}
            <div className="relative group/btn">
              <button 
                onClick={() => setShowColors(!showColors)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
              />
              <div className={tooltipClasses}>
                背景颜色
              </div>
              <AnimatePresence>
                {showColors && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-10 left-0 bg-[#1e1e1e] border border-white/10 p-2 rounded-2xl flex flex-col gap-2 shadow-2xl z-50"
                  >
                    {colors.map((c, i) => (
                      <button 
                        key={i}
                        onClick={() => { setBgColor(c); setShowColors(false); }}
                        className={cn("w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110", c)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-5 bg-white/10 mx-1" />

            <div className="relative group/btn">
              <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-full"><FileText size={14} /></button>
              <div className={tooltipClasses}>文本文件</div>
            </div>
            <div className="relative group/btn">
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-full"
              >
                <Upload size={14} />
              </button>
              <div className={tooltipClasses}>上传文件</div>
            </div>
            <div className="relative group/btn">
              <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-full"><Monitor size={14} /></button>
              <div className={tooltipClasses}>监视器</div>
            </div>
            <div className="relative group/btn">
              <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-full"><Palette size={14} /></button>
              <div className={tooltipClasses}>调色板</div>
            </div>

            <div className="w-px h-5 bg-white/10 mx-1" />

            <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-full"><Plus size={14} /></button>
            
            <div className="relative group/btn">
              <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-full"><List size={14} /></button>
              <div className={tooltipClasses}>无序列表</div>
            </div>
            
            <div className="relative group/btn">
              <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-full"><ListOrdered size={14} /></button>
              <div className={tooltipClasses}>有序列表</div>
            </div>

            <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-full"><Minus size={14} /></button>

            <div className="w-px h-5 bg-white/10 mx-1" />

            <div className="relative group/btn">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullscreen(true);
                }}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-full"
              >
                <Maximize2 size={14} />
              </button>
              <div className={tooltipClasses}>
                全屏
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Content Editor */}
      <div className="relative group">
        <div className="flex items-center gap-1.5 mb-2 px-1 text-white/60">
          <Pilcrow size={14} />
          <span className="text-xs font-medium">Text</span>
        </div>
        
        <div 
          className={cn(
            "rounded-2xl border transition-all p-4 relative",
            "backdrop-blur-xl",
            isSelected 
              ? "border-white/[0.15] shadow-[0_0_30px_rgba(255,255,255,0.12),0_0_60px_rgba(255,255,255,0.06)]" 
              : "border-white/[0.08] hover:border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
          )}
          style={{ 
            backgroundColor: `color-mix(in srgb, var(--node-bg, #000000) 40%, transparent)`,
            width: `${size.width}px`,
            height: `${size.height}px`
          }}
          onMouseEnter={() => !isEditMode && setShowTextActions(true)}
          onMouseLeave={() => setShowTextActions(false)}
        >
          {isEditMode ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()} // Stop drag when focusing text
              className="w-full h-full bg-transparent text-sm text-white/80 resize-none outline-none placeholder:text-white/20"
              placeholder="在此输入内容..."
              onBlur={handleBlur}
              autoFocus
            />
          ) : (
            <>
              <div 
                className="w-full h-full bg-transparent text-sm text-white/80 cursor-text whitespace-pre-wrap overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                onClick={handleTextAreaClick}
                data-scrollable="true"
              >
                {content}
              </div>

              {/* 文本框内的悬停操作按钮 */}
              <AnimatePresence>
                {showTextActions && isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-lg p-1 shadow-xl"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        try {
                          if (navigator?.clipboard?.writeText) {
                            navigator.clipboard.writeText(content);
                            setCopyFeedback(true);
                            setTimeout(() => setCopyFeedback(false), 1500);
                          }
                        } catch (e) {
                          console.warn('Clipboard write failed:', e);
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded transition-colors relative"
                    >
                      <Copy size={13} />
                      {copyFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-green-500/90 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap"
                        >
                          已复制
                        </motion.div>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditMode(true);
                      }}
                      className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded transition-colors"
                    >
                      <Edit3 size={13} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* 四个角的调整大小手柄 */}
          {isSelected && (
            <>
              {/* 左上角 */}
              <div
                onPointerDown={(e) => handleResizeStart(e, 'top-left')}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeEnd}
                className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-white/20 border-2 border-white/40 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 hover:scale-125"
              />
              
              {/* 右上角 */}
              <div
                onPointerDown={(e) => handleResizeStart(e, 'top-right')}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeEnd}
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white/20 border-2 border-white/40 cursor-nesw-resize opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 hover:scale-125"
              />
              
              {/* 左下角 */}
              <div
                onPointerDown={(e) => handleResizeStart(e, 'bottom-left')}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeEnd}
                className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-white/20 border-2 border-white/40 cursor-nesw-resize opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 hover:scale-125"
              />
              
              {/* 右下角 */}
              <div
                onPointerDown={(e) => handleResizeStart(e, 'bottom-right')}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeEnd}
                className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-white/20 border-2 border-white/40 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 hover:scale-125"
              />
            </>
          )}
        </div>

        {/* Connection Ports */}
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
      <AnimatePresence>
        {isSingleSelection && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-4 w-[420px] bg-[#1e1e1e] border border-white/10 rounded-2xl p-4 shadow-2xl"
            onPointerDown={(e) => e.stopPropagation()} // Prevent dragging
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-16 bg-transparent text-sm text-white/90 resize-none outline-none placeholder:text-white/30"
              placeholder="描述任何你想要生成的内容"
            />
            
            <div className="flex items-center justify-between mt-4">
              <div className="relative">
                <button 
                  onClick={() => setShowModels(!showModels)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/90 font-medium text-sm"
                >
                  <Sparkles size={14} className="text-white/60" />
                  {selectedModel}
                </button>
                
                <AnimatePresence>
                  {showModels && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bottom-full mb-2 left-0 w-[300px] bg-[#2a2a2a] border border-white/10 rounded-xl py-2 shadow-2xl z-50 overflow-hidden"
                    >
                      {models.map((m, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setSelectedModel(m.name); setShowModels(false); }}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left",
                            selectedModel === m.name ? "bg-white/5" : ""
                          )}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Sparkles size={14} className={selectedModel === m.name ? "text-white" : "text-white/40"} />
                              <span className="text-sm font-medium text-white/90">{m.name}</span>
                            </div>
                            {m.desc && <div className="text-[11px] text-white/40 mt-1 ml-6">{m.desc}</div>}
                          </div>
                          <span className="text-[11px] text-white/30">{m.time}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-white/50 text-sm font-medium">1x</span>
                <div className="flex items-center gap-2 bg-white/10 border border-white/5 rounded-full pl-3 pr-1 py-1">
                  <div className="flex items-center gap-1.5 opacity-70">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="15" cy="9" r="6" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="15" r="6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span className="text-white/80 text-sm font-medium mr-1">1</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!generating && prompt.trim()) {
                        handleGenerate();
                      }
                    }}
                    disabled={!prompt.trim() || generating}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                      generating 
                        ? "border-purple-500 bg-purple-500/20 animate-pulse cursor-wait"
                        : prompt.trim()
                          ? "border-white/30 hover:border-purple-500 hover:bg-purple-500/20 cursor-pointer"
                          : "border-white/10 cursor-not-allowed opacity-30"
                    )}
                  >
                    {generating ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 全屏文本编辑器 */}
      <AnimatePresence>
        {showFullscreen && (
          <FullscreenTextEditor
            content={content}
            title="新的全屏"
            onClose={() => setShowFullscreen(false)}
            onSave={(newContent) => {
              setContent(newContent);
              updateNode(node.id, { content: newContent });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

TextCanvasNode.displayName = 'TextCanvasNode';