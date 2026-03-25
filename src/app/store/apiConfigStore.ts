import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ApiType = 'text' | 'image' | 'video' | 'audio';

export interface ApiConfig {
  type: ApiType;
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  availableModels: string[];
  enabled: boolean;
}

interface ApiConfigState {
  configs: Record<ApiType, ApiConfig>;
  
  // Actions
  updateConfig: (type: ApiType, updates: Partial<ApiConfig>) => void;
  getConfig: (type: ApiType) => ApiConfig;
  isConfigured: (type: ApiType) => boolean;
}

// 默认配置
const defaultConfigs: Record<ApiType, ApiConfig> = {
  text: {
    type: 'text',
    baseUrl: 'https://grsai.dakka.com.cn',
    apiKey: '',
    selectedModel: 'gemini-2.5-pro',
    availableModels: [
      'gemini-2.5-pro',
      'gemini-3.1-pro',
      'gemini-3-pro',
      'nano-banana',
      'nano-banana-fast',
      'nano-banana-pro',
      'nano-banana-2',
      'nano-banana-pro-vt',
      'nano-banana-2-cl',
      'nano-banana-pro-cl'
    ],
    enabled: false
  },
  image: {
    type: 'image',
    baseUrl: 'https://grsai.dakka.com.cn',
    apiKey: '',
    selectedModel: 'sora-image',
    availableModels: [
      'sora-image',
      'nano-banana-pro',
      'gpt-image-1.5',
      'nano-banana-fast'
    ],
    enabled: false
  },
  video: {
    type: 'video',
    baseUrl: 'https://grsai.dakka.com.cn',
    apiKey: '',
    selectedModel: 'veo3.1-fast-4k',
    availableModels: [
      'veo3.1-fast-4k',
      'veo3.1-pro-1080p',
      'veo3.1-pro-4k'
    ],
    enabled: false
  },
  audio: {
    type: 'audio',
    baseUrl: 'https://grsai.dakka.com.cn',
    apiKey: '',
    selectedModel: 'sora-create-character',
    availableModels: [
      'sora-create-character',
      'sora-upload-character'
    ],
    enabled: false
  }
};

export const useApiConfigStore = create<ApiConfigState>()(
  persist(
    (set, get) => ({
      configs: defaultConfigs,

      updateConfig: (type, updates) => set((state) => ({
        configs: {
          ...state.configs,
          [type]: {
            ...state.configs[type],
            ...updates
          }
        }
      })),

      getConfig: (type) => get().configs[type],

      isConfigured: (type) => {
        const config = get().configs[type];
        return config.enabled && !!config.apiKey && config.apiKey !== '';
      }
    }),
    {
      name: 'api-config-storage-v2',
      version: 2
    }
  )
);