import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, Download, Trash2, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAssetStore, Asset, Template, AssetCategory } from '../store/assetStore';
import { useCanvasStore } from '../store/canvasStore';

interface AssetPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssetPanel: React.FC<AssetPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'assets' | 'templates'>('assets');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const { assets, templates, removeAsset, removeTemplate, getAssetsByCategory } = useAssetStore();
  const setNodes = useCanvasStore((state) => state.setNodes);
  const setConnections = useCanvasStore((state) => state.setConnections);

  const categories: { value: AssetCategory; label: string; icon: string }[] = [
    { value: 'all', label: '全部', icon: '📦' },
    { value: 'character', label: '人物', icon: '👤' },
    { value: 'scene', label: '场景', icon: '🏞️' },
    { value: 'item', label: '物品', icon: '🎁' },
    { value: 'style', label: '风格', icon: '🎨' },
    { value: 'audio', label: '音效', icon: '🎵' },
    { value: 'other', label: '其他', icon: '📌' },
  ];

  const filteredAssets = getAssetsByCategory(selectedCategory).filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApplyAsset = (asset: Asset) => {
    // 将资产应用到画布
    const nodeIdMap = new Map<string, string>();
    const newNodes: any[] = [];
    const newConnections: any[] = [];

    // 创建节点
    asset.nodes.forEach(node => {
      const newId = `node-${Date.now()}-${Math.random()}`;
      nodeIdMap.set(node.id, newId);
      
      newNodes.push({
        ...node,
        id: newId,
        x: node.x + 100, // 稍微偏移位置
        y: node.y + 100,
      });
    });

    // 创建连接
    asset.connections.forEach(conn => {
      const newSourceId = nodeIdMap.get(conn.from);
      const newTargetId = nodeIdMap.get(conn.to);
      
      if (newSourceId && newTargetId) {
        newConnections.push({
          from: newSourceId,
          to: newTargetId,
        });
      }
    });

    // 应用到画布
    setNodes(prev => [...prev, ...newNodes]);
    setConnections(prev => [...prev, ...newConnections]);

    setPreviewAsset(null);
    alert(`资产 "${asset.name}" 已应用到画布！`);
  };

  const handleApplyTemplate = (template: Template) => {
    // 将模板应用到画布（逻辑同资产）
    const nodeIdMap = new Map<string, string>();
    const newNodes: any[] = [];
    const newConnections: any[] = [];

    template.nodes.forEach(node => {
      const newId = `node-${Date.now()}-${Math.random()}`;
      nodeIdMap.set(node.id, newId);
      
      newNodes.push({
        ...node,
        id: newId,
        x: node.x + 100,
        y: node.y + 100,
      });
    });

    template.connections.forEach(conn => {
      const newSourceId = nodeIdMap.get(conn.from);
      const newTargetId = nodeIdMap.get(conn.to);
      
      if (newSourceId && newTargetId) {
        newConnections.push({
          from: newSourceId,
          to: newTargetId,
        });
      }
    });

    // 应用到画布
    setNodes(prev => [...prev, ...newNodes]);
    setConnections(prev => [...prev, ...newConnections]);

    setPreviewTemplate(null);
    alert(`模板 "${template.name}" 已应用到画布！`);
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        exit={{ x: -320 }}
        className="fixed left-0 top-0 bottom-0 w-80 bg-[#1a1a1a] border-r border-white/10 shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white text-lg font-semibold">资产管理</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-white/10">
          <button
            onClick={() => setActiveTab('assets')}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'assets'
                ? "bg-white text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            我的资产
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'templates'
                ? "bg-white text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            我的模板
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索..."
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-white/30"
            />
          </div>
        </div>

        {/* Categories (仅资产显示) */}
        {activeTab === 'assets' && (
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  selectedCategory === cat.value
                    ? "bg-white/10 border border-white/20 text-white"
                    : "bg-white/5 border border-white/10 text-white/60 hover:border-white/20"
                )}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {activeTab === 'assets' ? (
            filteredAssets.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onPreview={() => setPreviewAsset(asset)}
                    onDelete={() => {
                      if (confirm(`确定删除资产 "${asset.name}" 吗？`)) {
                        removeAsset(asset.id);
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/40">
                <Package size={48} className="mb-2" />
                <p className="text-sm">暂无资产</p>
              </div>
            )
          ) : (
            filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onPreview={() => setPreviewTemplate(template)}
                    onDelete={() => {
                      if (confirm(`确定删除模板 "${template.name}" 吗？`)) {
                        removeTemplate(template.id);
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/40">
                <Package size={48} className="mb-2" />
                <p className="text-sm">暂无模板</p>
              </div>
            )
          )}
        </div>
      </motion.div>

      {/* Asset Preview Dialog */}
      <AnimatePresence>
        {previewAsset && (
          <AssetPreviewDialog
            asset={previewAsset}
            onClose={() => setPreviewAsset(null)}
            onApply={() => handleApplyAsset(previewAsset)}
          />
        )}
      </AnimatePresence>

      {/* Template Preview Dialog */}
      <AnimatePresence>
        {previewTemplate && (
          <TemplatePreviewDialog
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onApply={() => handleApplyTemplate(previewTemplate)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Asset Card Component
interface AssetCardProps {
  asset: Asset;
  onPreview: () => void;
  onDelete: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, onPreview, onDelete }) => {
  return (
    <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-white/20 transition-colors group">
      {/* Thumbnail */}
      <div className="aspect-square bg-white/5 flex items-center justify-center text-4xl">
        {asset.thumbnail ? (
          <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
        ) : (
          <span>📦</span>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <div className="text-white/80 text-xs font-medium truncate mb-1">{asset.name}</div>
        <div className="text-white/40 text-[10px]">{asset.nodes.length} 个节点</div>
      </div>

      {/* Actions */}
      <div className="flex items-center border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onPreview}
          className="flex-1 py-2 flex items-center justify-center gap-1 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Eye size={12} />
          <span className="text-[10px]">查看</span>
        </button>
        <div className="w-px h-4 bg-white/10" />
        <button
          onClick={onDelete}
          className="flex-1 py-2 flex items-center justify-center gap-1 text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <Trash2 size={12} />
          <span className="text-[10px]">删除</span>
        </button>
      </div>
    </div>
  );
};

// Template Card Component (similar to AssetCard)
interface TemplateCardProps {
  template: Template;
  onPreview: () => void;
  onDelete: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onPreview, onDelete }) => {
  return (
    <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-white/20 transition-colors group">
      <div className="aspect-square bg-white/5 flex items-center justify-center text-4xl">
        {template.thumbnail ? (
          <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
        ) : (
          <span>📋</span>
        )}
      </div>

      <div className="p-2">
        <div className="text-white/80 text-xs font-medium truncate mb-1">{template.name}</div>
        <div className="text-white/40 text-[10px]">{template.nodes.length} 个节点</div>
      </div>

      <div className="flex items-center border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onPreview}
          className="flex-1 py-2 flex items-center justify-center gap-1 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Eye size={12} />
          <span className="text-[10px]">查看</span>
        </button>
        <div className="w-px h-4 bg-white/10" />
        <button
          onClick={onDelete}
          className="flex-1 py-2 flex items-center justify-center gap-1 text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <Trash2 size={12} />
          <span className="text-[10px]">删除</span>
        </button>
      </div>
    </div>
  );
};

// Asset Preview Dialog
interface AssetPreviewDialogProps {
  asset: Asset;
  onClose: () => void;
  onApply: () => void;
}

const AssetPreviewDialog: React.FC<AssetPreviewDialogProps> = ({ asset, onClose, onApply }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#2a2a2a] rounded-2xl p-6 w-[500px] border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">{asset.name}</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {asset.description && (
          <p className="text-white/60 text-sm mb-4">{asset.description}</p>
        )}

        <div className="mb-4">
          <div className="text-white/60 text-sm mb-2">包含节点：</div>
          <div className="flex flex-wrap gap-2">
            {asset.nodes.map((node) => (
              <div key={node.id} className="px-3 py-1.5 bg-white/10 rounded-lg text-white/80 text-xs">
                {node.type === 'text' && '📝 文本节点'}
                {node.type === 'image' && '🖼️ 图片节点'}
                {node.type === 'video' && '🎬 视频节点'}
                {node.type === 'audio' && '🎵 音频节点'}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
          >
            关闭
          </button>
          <button
            onClick={onApply}
            className="flex-1 px-4 py-2 rounded-lg bg-white hover:bg-white/90 text-black font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} />
            应用到画布
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Template Preview Dialog (similar structure)
interface TemplatePreviewDialogProps {
  template: Template;
  onClose: () => void;
  onApply: () => void;
}

const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = ({ template, onClose, onApply }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#2a2a2a] rounded-2xl p-6 w-[500px] border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">{template.name}</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {template.description && (
          <p className="text-white/60 text-sm mb-4">{template.description}</p>
        )}

        <div className="mb-4">
          <div className="text-white/60 text-sm mb-2">包含节点：</div>
          <div className="flex flex-wrap gap-2">
            {template.nodes.map((node) => (
              <div key={node.id} className="px-3 py-1.5 bg-white/10 rounded-lg text-white/80 text-xs">
                {node.type === 'text' && '📝 文本节点'}
                {node.type === 'image' && '🖼️ 图片节点'}
                {node.type === 'video' && '🎬 视频节点'}
                {node.type === 'audio' && '🎵 音频节点'}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
          >
            关闭
          </button>
          <button
            onClick={onApply}
            className="flex-1 px-4 py-2 rounded-lg bg-white hover:bg-white/90 text-black font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} />
            应用到画布
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Placeholder icon
const Package: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);