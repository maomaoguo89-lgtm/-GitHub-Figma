import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Play, Save, Ungroup, Edit3, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Group, useGroupStore } from '../store/groupStore';
import { useCanvasStore, Node } from '../store/canvasStore';
import { useAssetStore } from '../store/assetStore';

interface GroupFrameProps {
  group: Group;
  isSelected: boolean;
  scale: number;
  onPointerDown: (e: React.PointerEvent, group: Group) => void;
}

export const GroupFrame: React.FC<GroupFrameProps> = ({
  group,
  isSelected,
  scale,
  onPointerDown,
}) => {
  const [showColors, setShowColors] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [isResizing, setIsResizing] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  
  const resizeStartRef = useRef({ 
    x: 0, y: 0, width: 0, height: 0, groupX: 0, groupY: 0, corner: '' 
  });
  const initialNodesRef = useRef<{ id: string; x: number; y: number }[]>([]);

  const updateGroup = useGroupStore((state) => state.updateGroup);
  const removeGroup = useGroupStore((state) => state.removeGroup);
  const getGroupNodes = useGroupStore((state) => state.getGroupNodes);
  const { nodes, updateNode, connections } = useCanvasStore();
  const { addTemplate } = useAssetStore();

  const colors = [
    { name: '默认', value: 'rgba(255, 255, 255, 0.05)' },
    { name: '红色', value: 'rgba(239, 68, 68, 0.08)' },
    { name: '橙色', value: 'rgba(249, 115, 22, 0.08)' },
    { name: '黄色', value: 'rgba(234, 179, 8, 0.08)' },
    { name: '绿色', value: 'rgba(34, 197, 94, 0.08)' },
    { name: '青色', value: 'rgba(6, 182, 212, 0.08)' },
    { name: '蓝色', value: 'rgba(59, 130, 246, 0.08)' },
    { name: '紫色', value: 'rgba(168, 85, 247, 0.08)' },
  ];

  const handleUngroup = () => {
    removeGroup(group.id);
  };

  const handleExecuteAll = async () => {
    const groupNodes = getGroupNodes(group.id, nodes);
    console.log('整组执行:', groupNodes.length, '个节点');
    
    // 触发所有节点的生成操作
    groupNodes.forEach(node => {
      // 更新节点状态为生成中
      updateNode(node.id, { status: 'generating' });
    });

    // TODO: 实际的并发执行逻辑将在各个节点组件中处理
    alert(`开始并发执行 ${groupNodes.length} 个节点的生成任务`);
  };

  const handleSaveAsTemplate = () => {
    setShowTemplateDialog(true);
  };

  const handleConfirmTemplate = (name: string, description: string) => {
    const groupNodes = getGroupNodes(group.id, nodes);
    const groupConnections = connections.filter(
      conn => group.nodeIds.includes(conn.source) && group.nodeIds.includes(conn.target)
    );

    addTemplate({
      name,
      description,
      nodes: groupNodes,
      connections: groupConnections,
      groups: [group],
    });

    setShowTemplateDialog(false);
    alert(`模板 "${name}" 已保存！`);
  };

  const handleResizeStart = (
    e: React.PointerEvent, 
    corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  ) => {
    e.stopPropagation();
    const currentRef = e.currentTarget;
    
    // 保存初始状态
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: group.width,
      height: group.height,
      groupX: group.x,
      groupY: group.y,
      corner
    };

    // 保存组内节点的初始位置
    const groupNodes = getGroupNodes(group.id, nodes);
    initialNodesRef.current = groupNodes.map(n => ({ id: n.id, x: n.x, y: n.y }));

    setIsResizing(true);
    currentRef.setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!isResizing) return;
    e.stopPropagation();

    const { x, y, width, height, groupX, groupY, corner } = resizeStartRef.current;
    const dx = (e.clientX - x) / scale;
    const dy = (e.clientY - y) / scale;

    let newWidth = width;
    let newHeight = height;
    let newX = groupX;
    let newY = groupY;

    // 计算新的尺寸和位置
    if (corner.includes('left')) {
      newWidth = Math.max(200, width - dx);
      newX = groupX + (width - newWidth);
    } else if (corner.includes('right')) {
      newWidth = Math.max(200, width + dx);
    }

    if (corner.includes('top')) {
      newHeight = Math.max(150, height - dy);
      newY = groupY + (height - newHeight);
    } else if (corner.includes('bottom')) {
      newHeight = Math.max(150, height + dy);
    }

    // 计算缩放比例
    const scaleX = newWidth / width;
    const scaleY = newHeight / height;

    // 同步缩放组内节点
    initialNodesRef.current.forEach(({ id, x: nodeX, y: nodeY }) => {
      // 计算节点相对组框的位置
      const relativeX = nodeX - groupX;
      const relativeY = nodeY - groupY;

      // 应用缩放
      const newNodeX = newX + relativeX * scaleX;
      const newNodeY = newY + relativeY * scaleY;

      updateNode(id, { x: newNodeX, y: newNodeY });
    });

    // 更新组框
    updateGroup(group.id, {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  };

  const handleResizeEnd = (e: React.PointerEvent) => {
    if (!isResizing) return;
    e.stopPropagation();
    const currentRef = e.currentTarget;
    try {
      currentRef.releasePointerCapture(e.pointerId);
    } catch (err) {}
    setIsResizing(false);
  };

  const handleNameSave = () => {
    updateGroup(group.id, { name: editName });
    setIsEditingName(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "absolute pointer-events-auto rounded-3xl border-2 transition-all",
          isSelected 
            ? "border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.15)]" 
            : "border-white/10 hover:border-white/20"
        )}
        style={{
          left: `${group.x}px`,
          top: `${group.y}px`,
          width: `${group.width}px`,
          height: `${group.height}px`,
          backgroundColor: group.color,
          backdropFilter: 'blur(20px)',
        }}
        onPointerDown={(e) => onPointerDown(e, group)}
      >
        {/* 组名称 */}
        <div className="absolute -top-10 left-0 flex items-center gap-2">
          {isEditingName ? (
            <div className="flex items-center gap-1 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-lg px-2 py-1">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') {
                    setEditName(group.name);
                    setIsEditingName(false);
                  }
                }}
                className="bg-transparent text-white text-sm outline-none w-32"
                autoFocus
                onPointerDown={(e) => e.stopPropagation()}
              />
              <button
                onClick={handleNameSave}
                className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div 
              className="flex items-center gap-2 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-[#222]/95"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
            >
              <span className="text-white/90 text-sm font-medium">{group.name}</span>
              <Edit3 size={12} className="text-white/40" />
            </div>
          )}
        </div>

        {/* 四个角的调整大小手柄 */}
        {isSelected && (
          <>
            <div
              onPointerDown={(e) => handleResizeStart(e, 'top-left')}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeEnd}
              className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-white/30 border-2 border-white/60 cursor-nwse-resize hover:bg-white/50 hover:scale-125 transition-all"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 'top-right')}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeEnd}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white/30 border-2 border-white/60 cursor-nesw-resize hover:bg-white/50 hover:scale-125 transition-all"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 'bottom-left')}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeEnd}
              className="absolute -bottom-1.5 -left-1.5 w-4 h-4 rounded-full bg-white/30 border-2 border-white/60 cursor-nesw-resize hover:bg-white/50 hover:scale-125 transition-all"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 'bottom-right')}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeEnd}
              className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-white/30 border-2 border-white/60 cursor-nwse-resize hover:bg-white/50 hover:scale-125 transition-all"
            />
          </>
        )}
      </motion.div>

      {/* 组工具栏 */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute flex items-center gap-1 p-1.5 rounded-full bg-[#1e1e1e] border border-white/10 shadow-xl pointer-events-auto"
            style={{
              left: `${group.x}px`,
              top: `${group.y - 60}px`,
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* 背景颜色选择器 */}
            <div className="relative">
              <button
                onClick={() => setShowColors(!showColors)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
                style={{ backgroundColor: group.color }}
              >
                <Palette size={16} className="text-white/80" />
              </button>

              <AnimatePresence>
                {showColors && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-12 left-0 bg-[#1e1e1e] border border-white/10 p-2 rounded-2xl flex flex-col gap-2 shadow-2xl z-50"
                  >
                    {colors.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          updateGroup(group.id, { color: c.value });
                          setShowColors(false);
                        }}
                        className="w-8 h-8 rounded-full border-2 border-white/20 transition-transform hover:scale-110 relative group"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      >
                        {group.color === c.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* 整组执行 */}
            <button
              onClick={handleExecuteAll}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              title="整组执行"
            >
              <Play size={16} />
            </button>

            {/* 创建模板 */}
            <button
              onClick={handleSaveAsTemplate}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              title="创建模板"
            >
              <Save size={16} />
            </button>

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* 解组 */}
            <button
              onClick={handleUngroup}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              title="解组"
            >
              <Ungroup size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 保存模板对话框 */}
      <AnimatePresence>
        {showTemplateDialog && (
          <TemplateDialog
            onClose={() => setShowTemplateDialog(false)}
            onConfirm={handleConfirmTemplate}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// 保存模板对话框组件
interface TemplateDialogProps {
  onClose: () => void;
  onConfirm: (name: string, description: string) => void;
}

const TemplateDialog: React.FC<TemplateDialogProps> = ({ onClose, onConfirm }) => {
  const [name, setName] = useState('新模板');
  const [description, setDescription] = useState('');

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
        className="bg-[#2a2a2a] rounded-2xl p-6 w-[400px] border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white text-lg font-semibold mb-4">保存为模板</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-white/60 text-sm mb-2 block">模板名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-white/30"
              placeholder="输入模板名称"
            />
          </div>

          <div>
            <label className="text-white/60 text-sm mb-2 block">描述（可选）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-white/30 resize-none"
              placeholder="输入模板描述"
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
            onClick={() => onConfirm(name, description)}
            className="flex-1 px-4 py-2 rounded-lg bg-white hover:bg-white/90 text-black font-medium transition-colors"
          >
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
