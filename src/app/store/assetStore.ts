import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Connection } from './canvasStore';
import { Group } from './groupStore';

export type AssetCategory = 'all' | 'character' | 'scene' | 'item' | 'style' | 'audio' | 'other';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  description?: string;
  thumbnail?: string; // base64 缩略图
  nodes: Node[]; // 保存的节点数据
  connections: Connection[]; // 保存的连接关系
  groups: Group[]; // 保存的组信息
  createdAt: number;
  updatedAt: number;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  nodes: Node[];
  connections: Connection[];
  groups: Group[];
  createdAt: number;
  updatedAt: number;
}

interface AssetStore {
  assets: Asset[];
  templates: Template[];
  
  // 资产操作
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => string;
  removeAsset: (assetId: string) => void;
  updateAsset: (assetId: string, updates: Partial<Asset>) => void;
  getAssetsByCategory: (category: AssetCategory) => Asset[];
  
  // 模板操作
  addTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => string;
  removeTemplate: (templateId: string) => void;
  updateTemplate: (templateId: string, updates: Partial<Template>) => void;
}

export const useAssetStore = create<AssetStore>()(
  persist(
    (set, get) => ({
      assets: [],
      templates: [],

      addAsset: (asset) => {
        const assetId = `asset-${Date.now()}`;
        const newAsset: Asset = {
          ...asset,
          id: assetId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set(state => ({
          assets: [...state.assets, newAsset]
        }));

        return assetId;
      },

      removeAsset: (assetId) => {
        set(state => ({
          assets: state.assets.filter(a => a.id !== assetId)
        }));
      },

      updateAsset: (assetId, updates) => {
        set(state => ({
          assets: state.assets.map(a => 
            a.id === assetId 
              ? { ...a, ...updates, updatedAt: Date.now() } 
              : a
          )
        }));
      },

      getAssetsByCategory: (category) => {
        const assets = get().assets;
        if (category === 'all') return assets;
        return assets.filter(a => a.category === category);
      },

      addTemplate: (template) => {
        const templateId = `template-${Date.now()}`;
        const newTemplate: Template = {
          ...template,
          id: templateId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set(state => ({
          templates: [...state.templates, newTemplate]
        }));

        return templateId;
      },

      removeTemplate: (templateId) => {
        set(state => ({
          templates: state.templates.filter(t => t.id !== templateId)
        }));
      },

      updateTemplate: (templateId, updates) => {
        set(state => ({
          templates: state.templates.map(t => 
            t.id === templateId 
              ? { ...t, ...updates, updatedAt: Date.now() } 
              : t
          )
        }));
      },
    }),
    {
      name: 'iooi-asset-storage', // localStorage key
    }
  )
);
