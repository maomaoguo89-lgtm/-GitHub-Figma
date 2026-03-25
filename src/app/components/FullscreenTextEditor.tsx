import React, { useState, useRef, useEffect } from 'react';
import { X, Copy, Type, Bold, Italic, List, ListOrdered, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface FullscreenTextEditorProps {
  content: string;
  onClose: () => void;
  onSave: (content: string) => void;
  title?: string;
}

export const FullscreenTextEditor: React.FC<FullscreenTextEditorProps> = ({
  content: initialContent,
  onClose,
  onSave,
  title = "新的全屏"
}) => {
  const [content, setContent] = useState(initialContent);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // 自动聚焦
    textareaRef.current?.focus();
  }, []);

  const handleCopy = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(content);
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 1500);
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const handleClose = () => {
    onSave(content);
    onClose();
  };

  const applyTextStyle = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      prefix + selectedText + suffix + 
      content.substring(end);
    
    setContent(newContent);
    
    // 重新设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length, 
        end + prefix.length
      );
    }, 0);
  };

  const insertHeading = (level: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const prefix = '#'.repeat(level) + ' ';
    const newContent = 
      content.substring(0, start) + 
      prefix + selectedText + '\n' +
      content.substring(end);
    
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length, 
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  const insertList = (ordered: boolean = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const lines = selectedText.split('\n');
    const listItems = lines.map((line, i) => 
      ordered ? `${i + 1}. ${line}` : `- ${line}`
    ).join('\n');
    
    const newContent = 
      content.substring(0, start) + 
      listItems + 
      content.substring(end);
    
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + listItems.length);
    }, 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
      onClick={handleClose}
      onPointerDown={(e) => e.stopPropagation()}
      data-scrollable="true"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-5xl h-full max-h-[90vh] bg-[#2a2a2a] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <Type size={18} className="text-black" />
            </div>
            <span className="text-white/90 font-medium">{title}</span>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="relative w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Copy size={16} />
              <AnimatePresence>
                {showCopyFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-green-500/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                  >
                    已复制
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <div className="w-px h-5 bg-white/10 mx-1" />

            <button
              onClick={() => insertHeading(1)}
              className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-bold"
              title="标题 1"
            >
              H1
            </button>
            <button
              onClick={() => insertHeading(2)}
              className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-bold"
              title="标题 2"
            >
              H2
            </button>
            <button
              onClick={() => insertHeading(3)}
              className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-bold"
              title="标题 3"
            >
              H3
            </button>

            <div className="w-px h-5 bg-white/10 mx-1" />

            <button
              onClick={() => applyTextStyle('**')}
              className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="粗体"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => applyTextStyle('*')}
              className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="斜体"
            >
              <Italic size={16} />
            </button>

            <div className="w-px h-5 bg-white/10 mx-1" />

            <button
              onClick={() => insertList(false)}
              className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="无序列表"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => insertList(true)}
              className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="有序列表"
            >
              <ListOrdered size={16} />
            </button>

            <div className="w-px h-5 bg-white/10 mx-1" />

            <button className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Minus size={16} />
            </button>

            <div className="w-px h-5 bg-white/10 mx-2" />

            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-hidden p-8">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full bg-transparent text-white/90 text-base leading-relaxed resize-none outline-none placeholder:text-white/20"
            placeholder="在此输入内容..."
            data-scrollable="true"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};
