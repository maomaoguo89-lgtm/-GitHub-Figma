import { create } from 'zustand';
import { Node } from './canvasStore';

export interface Group {
  id: string;
  nodeIds: string[]; // 组内节点ID列表
  x: number; // 组框位置
  y: number;
  width: number;
  height: number;
  name: string;
  color: string; // 背景颜色
  createdAt: number;
}

interface GroupStore {
  groups: Group[];
  addGroup: (nodeIds: string[], nodes: Node[], name?: string) => string;
  removeGroup: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  getGroupByNodeId: (nodeId: string) => Group | undefined;
  isNodeInGroup: (nodeId: string) => boolean;
  getGroupNodes: (groupId: string, allNodes: Node[]) => Node[];
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],

  addGroup: (nodeIds, nodes, name = '新建组') => {
    const groupId = `group-${Date.now()}`;
    
    // 计算组框的边界（包围所有节点）
    const groupNodes = nodes.filter(n => nodeIds.includes(n.id));
    if (groupNodes.length === 0) return groupId;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    groupNodes.forEach(node => {
      const nodeWidth = 360; // 默认节点宽度
      const nodeHeight = 400; // 默认节点高度
      
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + nodeWidth);
      maxY = Math.max(maxY, node.y + nodeHeight);
    });

    const padding = 40; // 组框内边距
    const newGroup: Group = {
      id: groupId,
      nodeIds: [...nodeIds],
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
      name,
      color: 'rgba(255, 255, 255, 0.05)', // 默认颜色
      createdAt: Date.now(),
    };

    set(state => ({
      groups: [...state.groups, newGroup]
    }));

    return groupId;
  },

  removeGroup: (groupId) => {
    set(state => ({
      groups: state.groups.filter(g => g.id !== groupId)
    }));
  },

  updateGroup: (groupId, updates) => {
    set(state => ({
      groups: state.groups.map(g => 
        g.id === groupId ? { ...g, ...updates } : g
      )
    }));
  },

  getGroupByNodeId: (nodeId) => {
    return get().groups.find(g => g.nodeIds.includes(nodeId));
  },

  isNodeInGroup: (nodeId) => {
    return get().groups.some(g => g.nodeIds.includes(nodeId));
  },

  getGroupNodes: (groupId, allNodes) => {
    const group = get().groups.find(g => g.id === groupId);
    if (!group) return [];
    return allNodes.filter(n => group.nodeIds.includes(n.id));
  },
}));
