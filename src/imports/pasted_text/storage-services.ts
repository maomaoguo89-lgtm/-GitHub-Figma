// 数据持久化服务 - 支持 LocalStorage 和 Tauri 文件系统

import { Node, Connection } from '@/src/components/InfiniteCanvas';

const STORAGE_KEY = 'ai-creative-canvas-project';
const AUTOSAVE_INTERVAL = 30000; // 30秒

interface ProjectData {
  nodes: Node[];
  connections: Connection[];
  version: string;
  lastSaved: string;
}

// 检测是否在 Tauri 环境
const isTauri = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
};

// 保存到 LocalStorage
export const saveToLocalStorage = (data: ProjectData): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('✅ 已保存到 LocalStorage');
    return true;
  } catch (error) {
    console.error('❌ 保存到 LocalStorage 失败:', error);
    return false;
  }
};

// 从 LocalStorage 读取
export const loadFromLocalStorage = (): ProjectData | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved) as ProjectData;
      console.log('✅ 已从 LocalStorage 恢复');
      return data;
    }
  } catch (error) {
    console.error('❌ 从 LocalStorage 读取失败:', error);
  }
  return null;
};

// 导出为 JSON 文件（下载）
export const exportToFile = (data: ProjectData, filename?: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `project-${Date.now()}.canvas`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log('✅ 已导出文件:', a.download);
};

// 从文件导入
export const importFromFile = (file: File): Promise<ProjectData | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ProjectData;
        console.log('✅ 已从文件导入');
        resolve(data);
      } catch (error) {
        console.error('❌ 解析文件失败:', error);
        resolve(null);
      }
    };
    reader.readAsText(file);
  });
};

// Tauri 文件系统操作（桌面版）
export const tauriStorage = {
  // 保存到本地文件
  save: async (data: ProjectData, path?: string): Promise<boolean> => {
    if (!isTauri()) return false;
    
    try {
      const { writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const fileName = path || `project-${Date.now()}.canvas`;
      
      await writeTextFile(fileName, JSON.stringify(data, null, 2), {
        baseDir: BaseDirectory.Document,
      });
      
      console.log('✅ 已保存到 Tauri 文件:', fileName);
      return true;
    } catch (error) {
      console.error('❌ Tauri 保存失败:', error);
      return false;
    }
  },

  // 从本地文件读取
  load: async (path: string): Promise<ProjectData | null> => {
    if (!isTauri()) return null;
    
    try {
      const { readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const content = await readTextFile(path, {
        baseDir: BaseDirectory.Document,
      });
      
      const data = JSON.parse(content) as ProjectData;
      console.log('✅ 已从 Tauri 文件读取:', path);
      return data;
    } catch (error) {
      console.error('❌ Tauri 读取失败:', error);
      return null;
    }
  },

  // 打开文件选择对话框
  openDialog: async (): Promise<string | null> => {
    if (!isTauri()) return null;
    
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Canvas Project',
          extensions: ['canvas', 'json']
        }]
      });
      return selected as string | null;
    } catch (error) {
      console.error('❌ 打开对话框失败:', error);
      return null;
    }
  },

  // 保存文件对话框
  saveDialog: async (): Promise<string | null> => {
    if (!isTauri()) return null;
    
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const filePath = await save({
        filters: [{
          name: 'Canvas Project',
          extensions: ['canvas']
        }]
      });
      return filePath;
    } catch (error) {
      console.error('❌ 保存对话框失败:', error);
      return null;
    }
  }
};

// 自动保存管理器
export class AutoSaveManager {
  private intervalId: number | null = null;
  private lastData: ProjectData | null = null;

  start(
    getData: () => { nodes: Node[]; connections: Connection[] },
    onSave?: (data: ProjectData) => void
  ) {
    this.stop();
    
    this.intervalId = window.setInterval(() => {
      const { nodes, connections } = getData();
      
      const data: ProjectData = {
        nodes,
        connections,
        version: '1.0.0',
        lastSaved: new Date().toISOString()
      };
      
      // 检查数据是否有变化
      if (JSON.stringify(data) !== JSON.stringify(this.lastData)) {
        this.lastData = data;
        
        // 保存到 LocalStorage
        saveToLocalStorage(data);
        
        // 如果在 Tauri 环境，同时保存到文件
        if (isTauri()) {
          tauriStorage.save(data, 'autosave.canvas');
        }
        
        onSave?.(data);
      }
    }, AUTOSAVE_INTERVAL);
    
    console.log('✅ 自动保存已启动');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ 自动保存已停止');
    }
  }

  // 立即保存
  saveNow(getData: () => { nodes: Node[]; connections: Connection[] }) {
    const { nodes, connections } = getData();
    const data: ProjectData = {
      nodes,
      connections,
      version: '1.0.0',
      lastSaved: new Date().toISOString()
    };
    
    this.lastData = data;
    saveToLocalStorage(data);
    
    if (isTauri()) {
      tauriStorage.save(data, 'autosave.canvas');
    }
    
    console.log('💾 手动保存完成');
  }
}

export default {
  saveToLocalStorage,
  loadFromLocalStorage,
  exportToFile,
  importFromFile,
  tauriStorage,
  AutoSaveManager,
  isTauri
};
