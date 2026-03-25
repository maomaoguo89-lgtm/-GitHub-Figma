import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, Download, Trash2, Edit, Save, ArrowLeft, Maximize2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAssetStore, Asset, Template, AssetCategory } from '../store/assetStore';
import { useCanvasStore } from '../store/canvasStore';
import { useGroupStore } from '../store/groupStore';

interface AssetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

type DetailView = { type: 'asset' | 'template'; data: Asset | Template } | null;

export const AssetLibrary: React.FC<AssetLibraryProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'assets'>('templates');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('all');
  const [detailView, setDetailView] = useState<DetailView>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedView, setExpandedView] = useState(false);

  const { assets, templates, removeAsset, removeTemplate, getAssetsByCategory } = useAssetStore();
  const setNodes = useCanvasStore((state) => state.setNodes);
  const setConnections = useCanvasStore((state) => state.setConnections);
  const { addGroup } = useGroupStore();

  const categories: { value: AssetCategory; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'character', label: '人物' },
    { value: 'scene', label: '场景' },
    { value: 'item', label: '物品' },
    { value: 'style', label: '风格' },
    { value: 'audio', label: '音效' },
    { value: 'other', label: '其他' },
  ];

  const filteredAssets = getAssetsByCategory(selectedCategory);
  const displayItems = activeTab === 'templates' ? templates : filteredAssets;

  const handleUse = (item: Asset | Template) => {
    const nodeIdMap = new Map<string, string>();
    const newNodes: any[] = [];
    const newConnections: any[] = [];
    const newNodeIds: string[] = [];

    // 创建节点
    item.nodes.forEach(node => {
      const newId = `node-${Date.now()}-${Math.random()}`;
      nodeIdMap.set(node.id, newId);
      newNodeIds.push(newId);
      
      newNodes.push({
        ...node,
        id: newId,
        x: node.x + 100,
        y: node.y + 100,
      });
    });

    // 创建连接
    item.connections.forEach(conn => {
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

    // 自动打组
    if (newNodes.length > 1) {
      addGroup(newNodeIds, newNodes, item.name);
    }

    setDetailView(null);
    onClose();
  };

  const handleDelete = (id: string, type: 'asset' | 'template') => {
    if (type === 'asset') {
      removeAsset(id);
    } else {
      removeTemplate(id);
    }
    setDetailView(null);
  };

  if (!isOpen) return null;

  // 详情视图
  if (detailView) {
    return (
      <DetailViewComponent
        data={detailView.data}
        type={detailView.type}
        onClose={() => setDetailView(null)}
        onUse={() => handleUse(detailView.data)}
        onDelete={() => handleDelete(detailView.data.id, detailView.type)}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
    );
  }

  // 展开视图
  if (expandedView) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center"
        onClick={() => setExpandedView(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-[90vw] h-[85vh] bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('templates')}
                className={cn(
                  "text-lg font-medium transition-colors relative pb-1",
                  activeTab === 'templates' ? "text-white" : "text-white/40 hover:text-white/60"
                )}
              >
                我的模板
                {activeTab === 'templates' && (
                  <motion.div
                    layoutId="activeTabExpanded"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={cn(
                  "text-lg font-medium transition-colors relative pb-1",
                  activeTab === 'assets' ? "text-white" : "text-white/40 hover:text-white/60"
                )}
              >
                我的资产
                {activeTab === 'assets' && (
                  <motion.div
                    layoutId="activeTabExpanded"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                  />
                )}
              </button>
            </div>

            <button
              onClick={() => setExpandedView(false)}
              className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  selectedCategory === cat.value
                    ? "bg-white/15 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Content Grid */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {displayItems.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {displayItems.map((item) => (
                  <AssetCard
                    key={item.id}
                    item={item}
                    type={activeTab === 'templates' ? 'template' : 'asset'}
                    onView={() => setDetailView({ type: activeTab === 'templates' ? 'template' : 'asset', data: item })}
                    onUse={() => handleUse(item)}
                    onDelete={() => handleDelete(item.id, activeTab === 'templates' ? 'template' : 'asset')}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-white/40 relative overflow-hidden">
                {/* 眼睛 Logo */}
                <div className="relative w-[168px] h-[80px] flex justify-between items-center mb-10">
                  <div className="expanded-empty-eye"></div>
                  <div className="expanded-empty-eye"></div>
                  <style dangerouslySetInnerHTML={{__html: `
                    .expanded-empty-eye {
                      width: 80px;
                      height: 80px;
                      background-color: #fff;
                      background-image: radial-gradient(circle 22px, #161616 100%, transparent 0);
                      background-repeat: no-repeat;
                      border-radius: 50%;
                      animation: expandedEmptyEyeMove 4s infinite, expandedEmptyBlink 4s infinite;
                      box-shadow: 0 0 35px rgba(255, 255, 255, 0.18);
                    }
                    
                    @keyframes expandedEmptyEyeMove {
                      0%, 10% { 
                        background-position: center; 
                      }
                      15%, 25% { 
                        background-position: 55% center; 
                      }
                      30%, 40% { 
                        background-position: 45% center; 
                      }
                      45%, 55% { 
                        background-position: center 55%; 
                      }
                      60%, 70% { 
                        background-position: center 45%; 
                      }
                      75%, 85% { 
                        background-position: 45% 45%; 
                      }
                      90%, 100% { 
                        background-position: center; 
                      }
                    }
                    
                    @keyframes expandedEmptyBlink {
                      0%, 39%, 41%, 100% { 
                        transform: scaleY(1); 
                      }
                      40% { 
                        transform: scaleY(0.1); 
                      }
                    }
                  `}} />
                </div>

                {/* 文字提示 */}
                <div className="text-sm font-medium text-white/60">
                  暂无{activeTab === 'templates' ? '模板' : '资产'}
                </div>
                
                <div className="text-xs mt-2 text-white/40">
                  使用 Cmd+S 保存选中节点
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // 侧边面板视图（默认）
  return (
    <motion.div
      initial={{ opacity: 0, x: -12, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -12, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="fixed left-[88px] top-1/2 -translate-y-1/2 w-[320px] bg-[#161616]/95 backdrop-blur-2xl rounded-[28px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[90] flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header - 红色区域：50px */}
      <div className="h-[48px] px-4 border-b border-white/10 flex-shrink-0 flex items-center">
        {/* Tab 切换和工具按钮在同一行 */}
        <div className="flex items-center flex-1">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('templates')}
              className={cn(
                "text-[11px] font-bold uppercase tracking-[0.15em] transition-colors relative pb-0.5",
                activeTab === 'templates' ? "text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              模板
              {activeTab === 'templates' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={cn(
                "text-[11px] font-bold uppercase tracking-[0.15em] transition-colors relative pb-0.5",
                activeTab === 'assets' ? "text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              资产
              {activeTab === 'assets' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                />
              )}
            </button>
          </div>

          <div className="flex items-center gap-0.5 ml-auto">
            <button
              onClick={() => setExpandedView(true)}
              className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="展开"
            >
              <Maximize2 size={13} />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs - 黄色区域：46px，在模板时隐藏但保持高度 */}
      <div className={cn(
        "h-[40px] flex items-center gap-1 px-4 border-b border-white/10 flex-shrink-0",
        activeTab === 'templates' && "invisible"
      )}>
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={cn(
              "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors",
              selectedCategory === cat.value
                ? "bg-white/15 text-white"
                : "text-white/40 hover:text-white hover:bg-white/5"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content Grid - 内容区域，3列布局 */}
      <div className="h-[301px] overflow-y-auto overflow-x-hidden px-3 pt-3 pb-0 flex-shrink-0 scrollbar-thin">
        {displayItems.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {displayItems.map((item) => (
              <AssetCard
                key={item.id}
                item={item}
                type={activeTab === 'templates' ? 'template' : 'asset'}
                onView={() => setDetailView({ type: activeTab === 'templates' ? 'template' : 'asset', data: item })}
                onUse={() => handleUse(item)}
                onDelete={() => handleDelete(item.id, activeTab === 'templates' ? 'template' : 'asset')}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white/40 relative overflow-hidden">
            {/* 眼睛 Logo */}
            <div className="relative w-[88px] h-[40px] flex justify-between items-center mb-8">
              <div className="empty-eye"></div>
              <div className="empty-eye"></div>
              <style dangerouslySetInnerHTML={{__html: `
                .empty-eye {
                  width: 40px;
                  height: 40px;
                  background-color: #fff;
                  background-image: radial-gradient(circle 12px, #161616 100%, transparent 0);
                  background-repeat: no-repeat;
                  border-radius: 50%;
                  animation: emptyEyeMove 4s infinite, emptyBlink 4s infinite;
                  box-shadow: 0 0 20px rgba(255, 255, 255, 0.12);
                }
                
                @keyframes emptyEyeMove {
                  0%, 10% { 
                    background-position: center; 
                  }
                  15%, 25% { 
                    background-position: 55% center; 
                  }
                  30%, 40% { 
                    background-position: 45% center; 
                  }
                  45%, 55% { 
                    background-position: center 55%; 
                  }
                  60%, 70% { 
                    background-position: center 45%; 
                  }
                  75%, 85% { 
                    background-position: 45% 45%; 
                  }
                  90%, 100% { 
                    background-position: center; 
                  }
                }
                
                @keyframes emptyBlink {
                  0%, 39%, 41%, 100% { 
                    transform: scaleY(1); 
                  }
                  40% { 
                    transform: scaleY(0.1); 
                  }
                }
              `}} />
            </div>

            {/* 文字提示 */}
            <div className="text-sm font-medium text-white/60">
              暂无{activeTab === 'templates' ? '模板' : '资产'}
            </div>
            
            <div className="text-xs mt-2 text-white/40">
              使用 Cmd+S 保存选中节点
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// 资产卡片组件
interface AssetCardProps {
  item: Asset | Template;
  type: 'asset' | 'template';
  onView: () => void;
  onUse: () => void;
  onDelete: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ item, type, onView, onUse, onDelete }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="flex flex-col mb-2 last:mb-0">
      {/* 🔵 卡片图片区：正方形 113px */}
      <div
        className="relative bg-[#2a2a2a] rounded-lg border border-white/10 overflow-hidden group cursor-pointer transition-all hover:border-white/20 aspect-square"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* 缩略图 */}
        <div className="w-full h-full flex items-center justify-center">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-3xl opacity-40">
              {type === 'template' ? '📋' : '📦'}
            </div>
          )}
        </div>

        {/* 悬浮操作 */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onView}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-md transition-colors flex items-center gap-1"
              >
                <Eye size={11} />
                看
              </button>
              <button
                onClick={onUse}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-md transition-colors flex items-center gap-1"
              >
                <Download size={11} />
                使用
              </button>
              <button
                onClick={onDelete}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-md transition-colors flex items-center gap-1"
              >
                <Trash2 size={11} />
                删除
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ⚪ 文件名区：36px，卡片外部下方 */}
      <div className="h-[36px] flex items-center mt-3">
        <div className="text-white/90 text-xs truncate font-medium">{item.name}</div>
      </div>
    </div>
  );
};

// 详情视图组件
interface DetailViewComponentProps {
  data: Asset | Template;
  type: 'asset' | 'template';
  onClose: () => void;
  onUse: () => void;
  onDelete: () => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
}

const DetailViewComponent: React.FC<DetailViewComponentProps> = ({
  data,
  type,
  onClose,
  onUse,
  onDelete,
  isEditing,
  setIsEditing,
}) => {
  const [editedData, setEditedData] = useState(data);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-white text-lg font-semibold">
              {type === 'template' ? '模板详情' : '资产详情'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-white hover:bg-white/90 text-black text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                保存
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit size={16} />
                编辑
              </button>
            )}
            <button
              onClick={onUse}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              应用
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-8">
            {/* 左侧预览 */}
            <div>
              <div className="aspect-square bg-[#2a2a2a] rounded-xl border border-white/10 flex items-center justify-center mb-4 overflow-hidden">
                {data.thumbnail ? (
                  <img src={data.thumbnail} alt={data.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-8xl opacity-30">
                    {type === 'template' ? '📋' : '📦'}
                  </div>
                )}
              </div>
              
              {/* 包含节点 */}
              <div className="space-y-3">
                <h3 className="text-white/60 text-sm font-medium">包含节点</h3>
                <div className="grid grid-cols-3 gap-2">
                  {data.nodes.slice(0, 6).map((node, idx) => (
                    <div key={idx} className="aspect-square bg-[#2a2a2a] rounded-lg border border-white/10 flex items-center justify-center">
                      <span className="text-2xl">
                        {node.type === 'text' && '📝'}
                        {node.type === 'image' && '🖼️'}
                        {node.type === 'video' && '🎬'}
                        {node.type === 'audio' && '🎵'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 右侧信息 */}
            <div>
              <h3 className="text-white text-2xl font-bold mb-2">{data.name}</h3>
              <div className="text-white/40 text-sm mb-6">
                更新于 {new Date(data.updatedAt).toLocaleString('zh-CN')}
              </div>

              <div className="space-y-6">
                {/* 描述 */}
                <div>
                  <h4 className="text-white/60 text-sm font-medium mb-3">描述</h4>
                  {isEditing ? (
                    <textarea
                      value={data.description || ''}
                      onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                      className="w-full h-32 bg-[#2a2a2a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-white/30 resize-none"
                      placeholder="请介绍组织的模板，比如使用场景、操作步骤以及特殊价"
                    />
                  ) : (
                    <p className="text-white/80 text-sm leading-relaxed">
                      {data.description || '暂无描述'}
                    </p>
                  )}
                </div>

                {/* 节点内容详情 */}
                <div>
                  <h4 className="text-white/60 text-sm font-medium mb-3">节点内容</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {data.nodes.map((node, idx) => (
                      <div key={idx} className="bg-[#2a2a2a] rounded-lg p-3 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">
                            {node.type === 'text' && '📝'}
                            {node.type === 'image' && '🖼️'}
                            {node.type === 'video' && '🎬'}
                            {node.type === 'audio' && '🎵'}
                          </span>
                          <span className="text-white text-sm font-medium">{node.title}</span>
                        </div>
                        {node.content && (
                          <div className="text-white/60 text-xs line-clamp-2">{node.content}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};