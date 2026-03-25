import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Group as GroupIcon } from 'lucide-react';
import { Node } from '../store/canvasStore';
import { useGroupStore } from '../store/groupStore';
import { AssetCategory } from '../store/assetStore';

interface MultiSelectToolbarProps {
  selectedNodes: Node[];
  position: { x: number; y: number };
  onCreateAsset: () => void;
  onCreateGroup: () => void;
}

export const MultiSelectToolbar: React.FC<MultiSelectToolbarProps> = ({
  selectedNodes,
  position,
  onCreateAsset,
  onCreateGroup,
}) => {
  if (selectedNodes.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed flex items-center gap-2 p-2 rounded-full bg-[#1e1e1e] border border-white/10 shadow-2xl z-[100] pointer-events-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 70}px`,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* 创建资产 */}
      <button
        onClick={onCreateAsset}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
      >
        <Package size={16} />
        <span className="text-sm font-medium">创建资产</span>
      </button>

      <div className="w-px h-6 bg-white/10" />

      {/* 打组 */}
      <button
        onClick={onCreateGroup}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
      >
        <GroupIcon size={16} />
        <span className="text-sm font-medium">打组</span>
      </button>

      {/* 节点数量提示 */}
      <div className="ml-2 px-3 py-1.5 rounded-full bg-white/10 text-white/60 text-xs">
        {selectedNodes.length} 个节点
      </div>
    </motion.div>
  );
};

// 创建资产对话框
interface CreateAssetDialogProps {
  selectedNodes: Node[];
  onClose: () => void;
  onConfirm: (data: {
    name: string;
    category: AssetCategory;
    description: string;
    saveType: 'asset' | 'template';
  }) => void;
}

export const CreateAssetDialog: React.FC<CreateAssetDialogProps> = ({
  selectedNodes,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState('新资产');
  const [category, setCategory] = useState<AssetCategory>('other');
  const [description, setDescription] = useState('');
  const [saveType, setSaveType] = useState<'asset' | 'template'>('asset');

  const categories: { value: AssetCategory; label: string }[] = [
    { value: 'character', label: '人物' },
    { value: 'scene', label: '场景' },
    { value: 'item', label: '物品' },
    { value: 'style', label: '风格' },
    { value: 'audio', label: '音效' },
    { value: 'other', label: '其他' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#2a2a2a] rounded-2xl p-6 w-[480px] border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white text-lg font-semibold mb-4">保存到资产库</h3>

        {/* 保存类型选择 */}
        <div className="mb-4">
          <label className="text-white/60 text-sm mb-2 block">保存为</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSaveType('template')}
              className={`px-4 py-3 rounded-lg border transition-colors ${
                saveType === 'template'
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              <div className="text-xl mb-1">📋</div>
              <div className="text-sm font-medium">我的模板</div>
            </button>
            <button
              onClick={() => setSaveType('asset')}
              className={`px-4 py-3 rounded-lg border transition-colors ${
                saveType === 'asset'
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              <div className="text-xl mb-1">📦</div>
              <div className="text-sm font-medium">我的资产</div>
            </button>
          </div>
        </div>

        {/* 节点预览 */}
        <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="text-white/60 text-xs mb-2">包含节点：</div>
          <div className="flex flex-wrap gap-2">
            {selectedNodes.map((node) => (
              <div
                key={node.id}
                className="px-2 py-1 bg-white/10 rounded text-white/80 text-xs"
              >
                {node.type === 'text' && '📝 文本'}
                {node.type === 'image' && '🖼️ 图片'}
                {node.type === 'video' && '🎬 视频'}
                {node.type === 'audio' && '🎵 音频'}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white/60 text-sm mb-2 block">
              {saveType === 'template' ? '模板名称' : '资产名称'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-white/30"
              placeholder={
                saveType === 'template' ? '输入模板名称' : '输入资产名称'
              }
            />
          </div>

          {saveType === 'asset' && (
            <div>
              <label className="text-white/60 text-sm mb-2 block">分类</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`px-3 py-2 rounded-lg border transition-colors ${
                      category === cat.value
                        ? 'bg-white/10 border-white/30 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-white/60 text-sm mb-2 block">描述（可选）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-white/30 resize-none"
              placeholder={
                saveType === 'template' ? '输入模板描述' : '输入资产描述'
              }
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm({ name, category, description, saveType })}
            className="flex-1 px-4 py-2 rounded-lg bg-white hover:bg-white/90 text-black font-medium transition-colors"
          >
            保存{saveType === 'template' ? '模板' : '资产'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};