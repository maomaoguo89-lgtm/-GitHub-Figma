import React, { useState, useRef, useEffect } from 'react';
import { Palette, X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCanvasStore } from '../store/canvasStore';
import { useThemePresetStore } from '../store/themePresetStore';
import { cn } from '../../lib/utils';
import texture1 from "figma:asset/9f5331598102f1db75f9798bc5792370b464b6f1.png";
import texture2 from "figma:asset/fb884269cc6f847eca45821676b09395b414f950.png";
import texture3 from "figma:asset/82b36c6ff05288adc92d6bff072d613e131ec06d.png";
import texture4 from "figma:asset/0e8987126a11b2ae1b2b1acf9b9ed934dbcc3219.png";
import texture5 from "figma:asset/808f35c54ee109e2a84e4b6add92c2b98c9d8749.png";
import texture6 from "figma:asset/3dc4b7563b53360be6a0f8858b8867411b733226.png";
import texture7 from "figma:asset/269eafb9e80cce3c715a11e2a37f6cc7e37faec4.png";
import texture8 from "figma:asset/3cb77d288667b410987bcd4dbdaa4053d8e7d432.png";

const TEXTURES = [
  { id: 'none', name: '无纹理', preview: null },
  { id: 'texture1', name: '深色小点', preview: texture1 },
  { id: 'texture2', name: '深色大点', preview: texture2 },
  { id: 'texture3', name: '浅色对角', preview: texture3 },
  { id: 'texture4', name: '浅灰规则', preview: texture4 },
  { id: 'texture5', name: '浅紫规则', preview: texture5 },
  { id: 'texture6', name: '白色规则', preview: texture6 },
  { id: 'texture7', name: '浅蓝规则', preview: texture7 },
  { id: 'texture8', name: '深色不规则', preview: texture8 },
];

export const ThemeColorPicker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const { themeColors, setThemeColors } = useCanvasStore();
  const { presets, savePreset, deletePreset, renamePreset } = useThemePresetStore();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSaveDialogOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Apply colors to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--canvas-bg', themeColors.canvasBg);
    document.documentElement.style.setProperty('--node-bg', themeColors.nodeBg);
    document.documentElement.style.setProperty('--ui-bg', themeColors.uiBg);
  }, [themeColors]);

  const handleApplyPreset = (preset: any) => {
    setThemeColors(preset.colors);
  };

  const handleSavePreset = () => {
    if (presets.length >= 3) {
      alert('最多只能保存 3 组配色方案');
      return;
    }
    setSaveDialogOpen(true);
    setNewPresetName(`配色方案 ${presets.length + 1}`);
  };

  const confirmSavePreset = () => {
    if (!newPresetName.trim()) return;
    savePreset(newPresetName.trim(), themeColors);
    setSaveDialogOpen(false);
    setNewPresetName('');
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定删除这个配色方案吗？')) {
      deletePreset(id);
    }
  };

  const startRenaming = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPresetId(id);
    setEditingName(currentName);
  };

  const confirmRename = (id: string) => {
    if (editingName.trim()) {
      renamePreset(id, editingName.trim());
    }
    setEditingPresetId(null);
    setEditingName('');
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-lg transition-all",
          isOpen 
            ? "bg-white/20 text-white" 
            : "bg-white/10 hover:bg-white/15 text-white/80"
        )}
        title="主题配色"
      >
        <Palette size={16} />
      </button>

      {/* Color Picker Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 bg-[#111]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Palette size={16} className="text-white/60" />
                <span className="text-sm font-medium text-white/90">主题配色</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white/80 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* User Presets */}
            <div className="p-4 border-b border-white/10">
              <div className="text-xs text-white/40 mb-3">我的配色方案</div>
              <div className="grid grid-cols-3 gap-2">
                {/* Existing Presets */}
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="group relative"
                  >
                    <button
                      onClick={() => handleApplyPreset(preset)}
                      className="w-full flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {/* Preview */}
                      <div className="w-full h-16 rounded-md border border-white/10 overflow-hidden relative">
                        {/* Canvas */}
                        <div 
                          className="absolute inset-0"
                          style={{ backgroundColor: preset.colors.canvasBg }}
                        />
                        {/* Color Gradient */}
                        <div 
                          className="absolute inset-0 opacity-[0.04]"
                          style={{
                            background: 'radial-gradient(circle at 30% 40%, rgba(138, 43, 226, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(75, 0, 130, 0.08) 0%, transparent 50%)'
                          }}
                        />
                        {/* Noise */}
                        <div 
                          className="absolute inset-0 opacity-[0.02]"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'repeat',
                            mixBlendMode: 'overlay'
                          }}
                        />
                        {/* Vignette */}
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.2) 100%)'
                          }}
                        />
                        {/* Texture */}
                        {preset.colors.canvasTexture && preset.colors.canvasTexture !== 'none' && (
                          <div 
                            className="absolute inset-0 opacity-[0.15]"
                            style={{
                              backgroundImage: `url(${TEXTURES.find(t => t.id === preset.colors.canvasTexture)?.preview})`,
                              backgroundSize: '40px 40px',
                              backgroundRepeat: 'repeat',
                              mixBlendMode: 'soft-light'
                            }}
                          />
                        )}
                        {/* Grid */}
                        <div 
                          className="absolute inset-0"
                          style={{
                            backgroundSize: '12px 12px',
                            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 0.5px, transparent 0.5px)'
                          }}
                        />
                        {/* Node */}
                        <div 
                          className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-6 rounded border border-white/20"
                          style={{ backgroundColor: `${preset.colors.nodeBg}66` }}
                        />
                        {/* UI Element */}
                        <div 
                          className="absolute bottom-1 left-1 right-1 h-2 rounded-sm"
                          style={{ backgroundColor: `${preset.colors.uiBg}99` }}
                        />
                      </div>

                      {/* Name */}
                      {editingPresetId === preset.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmRename(preset.id);
                            if (e.key === 'Escape') setEditingPresetId(null);
                          }}
                          onBlur={() => confirmRename(preset.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-1 py-0.5 text-[10px] text-center text-white/90 bg-white/10 border border-white/20 rounded outline-none"
                          autoFocus
                        />
                      ) : (
                        <span className="text-[10px] text-white/60 group-hover:text-white/90 transition-colors truncate w-full text-center">
                          {preset.name}
                        </span>
                      )}
                    </button>

                    {/* Action Buttons */}
                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={(e) => startRenaming(preset.id, preset.name, e)}
                        className="w-5 h-5 bg-blue-500/90 hover:bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg"
                        title="重命名"
                      >
                        <Edit2 size={10} />
                      </button>
                      <button
                        onClick={(e) => handleDeletePreset(preset.id, e)}
                        className="w-5 h-5 bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg"
                        title="删除"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Empty Slots */}
                {Array.from({ length: 3 - presets.length }).map((_, i) => (
                  <button
                    key={`empty-${i}`}
                    onClick={handleSavePreset}
                    className="w-full flex flex-col items-center justify-center gap-2 p-2 h-[88px] rounded-lg border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 transition-all group"
                  >
                    <Plus size={20} className="text-white/30 group-hover:text-white/50 transition-colors" />
                    <span className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">
                      保存配色
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="p-4 space-y-4">
              <div className="text-xs text-white/40 mb-3">自定义配色</div>
              
              {/* Canvas Background */}
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs text-white/60">
                  <span>画布背景</span>
                  <span className="text-white/40 font-mono text-[10px]">{themeColors.canvasBg}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeColors.canvasBg || '#27252A'}
                    onChange={(e) => setThemeColors({ canvasBg: e.target.value })}
                    className="w-12 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={themeColors.canvasBg || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        setThemeColors({ canvasBg: val });
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white/90 font-mono outline-none focus:border-white/20 transition-colors"
                    placeholder="#27252A"
                  />
                </div>
              </div>

              {/* Node Background */}
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs text-white/60">
                  <span>节点底色</span>
                  <span className="text-white/40 font-mono text-[10px]">{themeColors.nodeBg}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeColors.nodeBg || '#000000'}
                    onChange={(e) => setThemeColors({ nodeBg: e.target.value })}
                    className="w-12 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={themeColors.nodeBg || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        setThemeColors({ nodeBg: val });
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white/90 font-mono outline-none focus:border-white/20 transition-colors"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* UI Background */}
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs text-white/60">
                  <span>UI 元素色</span>
                  <span className="text-white/40 font-mono text-[10px]">{themeColors.uiBg}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeColors.uiBg || '#111111'}
                    onChange={(e) => setThemeColors({ uiBg: e.target.value })}
                    className="w-12 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={themeColors.uiBg || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        setThemeColors({ uiBg: val });
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white/90 font-mono outline-none focus:border-white/20 transition-colors"
                    placeholder="#111111"
                  />
                </div>
              </div>

              {/* Canvas Texture */}
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs text-white/60">
                  <span>画布质感</span>
                  <span className="text-white/40 text-[10px]">
                    {TEXTURES.find(t => t.id === (themeColors.canvasTexture || 'none'))?.name}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TEXTURES.map((texture) => (
                    <button
                      key={texture.id}
                      onClick={() => setThemeColors({ canvasTexture: texture.id })}
                      className={cn(
                        "relative h-14 rounded-lg border-2 transition-all overflow-hidden",
                        themeColors.canvasTexture === texture.id || (!themeColors.canvasTexture && texture.id === 'none')
                          ? "border-white/40 ring-2 ring-white/20"
                          : "border-white/10 hover:border-white/20"
                      )}
                      title={texture.name}
                    >
                      {texture.preview ? (
                        <img 
                          src={texture.preview} 
                          alt={texture.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <X size={12} className="text-white/30" />
                        </div>
                      )}
                      {/* Selection indicator */}
                      {(themeColors.canvasTexture === texture.id || (!themeColors.canvasTexture && texture.id === 'none')) && (
                        <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                            <Check size={10} className="text-black" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="pt-2">
                <div className="text-xs text-white/40 mb-2">实时预览</div>
                <div 
                  className="w-full h-24 rounded-lg border border-white/10 relative overflow-hidden"
                  style={{ backgroundColor: themeColors.canvasBg }}
                >
                  {/* Color Gradient */}
                  <div 
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                      background: 'radial-gradient(circle at 30% 40%, rgba(138, 43, 226, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(75, 0, 130, 0.08) 0%, transparent 50%)'
                    }}
                  />
                  
                  {/* Noise Layer */}
                  <div 
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'repeat',
                      mixBlendMode: 'overlay'
                    }}
                  />
                  
                  {/* Vignette */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.2) 100%)'
                    }}
                  />
                  
                  {/* Texture Layer */}
                  {themeColors.canvasTexture && themeColors.canvasTexture !== 'none' && (
                    <div 
                      className="absolute inset-0 opacity-[0.15]"
                      style={{
                        backgroundImage: `url(${TEXTURES.find(t => t.id === themeColors.canvasTexture)?.preview})`,
                        backgroundSize: '80px 80px',
                        backgroundRepeat: 'repeat',
                        mixBlendMode: 'soft-light'
                      }}
                    />
                  )}
                  
                  {/* Grid */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundSize: '24px 24px',
                      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)'
                    }}
                  />
                  
                  {/* Node Preview */}
                  <div 
                    className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-14 rounded-lg border border-white/20 backdrop-blur-xl flex items-center justify-center"
                    style={{ backgroundColor: `${themeColors.nodeBg}66` }}
                  >
                    <div className="text-[8px] text-white/60">节点</div>
                  </div>
                  
                  {/* UI Element Preview */}
                  <div 
                    className="absolute bottom-2 left-2 right-2 h-4 rounded-md backdrop-blur-xl flex items-center justify-center gap-1"
                    style={{ backgroundColor: `${themeColors.uiBg}CC` }}
                  >
                    <div className="w-1 h-1 rounded-full bg-white/40" />
                    <div className="w-1 h-1 rounded-full bg-white/40" />
                    <div className="w-1 h-1 rounded-full bg-white/40" />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Dialog */}
            <AnimatePresence>
              {saveDialogOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-10"
                >
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 w-full max-w-xs">
                    <div className="text-sm text-white/90 mb-3">保存配色方案</div>
                    <input
                      type="text"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmSavePreset();
                        if (e.key === 'Escape') setSaveDialogOpen(false);
                      }}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/90 outline-none focus:border-white/20 transition-colors mb-3"
                      placeholder="输入方案名称"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSaveDialogOpen(false)}
                        className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-xs transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={confirmSavePreset}
                        className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition-colors"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};