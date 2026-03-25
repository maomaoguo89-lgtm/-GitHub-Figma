import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, EyeOff, Sparkles, Image, Video, Mic } from 'lucide-react';
import { useApiConfigStore, ApiType, ApiConfig } from '../store/apiConfigStore';
import { useLanguageStore } from '../store/languageStore';
import { cn } from '../../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'text' | 'image' | 'video' | 'audio';

const TabConfig: Record<TabType, { label: string; labelEn: string; icon: React.ReactNode; color: string }> = {
  text: {
    label: '文本生成',
    labelEn: 'Text Generation',
    icon: <Sparkles size={16} />,
    color: 'blue'
  },
  image: {
    label: '图片生成',
    labelEn: 'Image Generation',
    icon: <Image size={16} />,
    color: 'purple'
  },
  video: {
    label: '视频生成',
    labelEn: 'Video Generation',
    icon: <Video size={16} />,
    color: 'pink'
  },
  audio: {
    label: '语音生成',
    labelEn: 'Audio Generation',
    icon: <Mic size={16} />,
    color: 'green'
  }
};

const ApiConfigPanel: React.FC<{ type: ApiType }> = ({ type }) => {
  const { configs, updateConfig } = useApiConfigStore();
  const config = configs[type];
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { language } = useLanguageStore();

  const handleToggle = () => {
    updateConfig(type, { enabled: !config.enabled });
  };

  const handleApiKeyChange = (value: string) => {
    updateConfig(type, { apiKey: value });
    setTestResult(null); // 清除测试结果
    
    // 🔥 自动启用：当用户填写API Key后，自动启用该API
    if (value && value.trim() !== '' && !config.enabled) {
      updateConfig(type, { enabled: true });
    }
  };

  const handleBaseUrlChange = (value: string) => {
    updateConfig(type, { baseUrl: value });
    setTestResult(null); // 清除测试结果
  };

  const handleModelChange = (value: string) => {
    updateConfig(type, { selectedModel: value });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // 检查 Base URL 格式
      if (!config.baseUrl) {
        throw new Error('请输入 Base URL');
      }

      // 检查是否包含了模型名称（常见错误）
      if (config.baseUrl.includes('gemini') || config.baseUrl.includes('nano-banana')) {
        throw new Error('Base URL 不应包含模型名称！\n请使用: https://grsai.dakka.com.cn');
      }

      if (!config.apiKey) {
        throw new Error('请输入 API Key');
      }

      // 根据类型构建不同的测试端点
      let endpoint = '';
      let testBody: any = {};

      switch (type) {
        case 'text':
          endpoint = `${config.baseUrl}/v1/chat/completions`;
          testBody = {
            model: config.selectedModel,
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 10
          };
          break;
        case 'image':
          endpoint = `${config.baseUrl}/v1/draw/completions`;
          testBody = {
            model: config.selectedModel,
            prompt: 'A test image',
            size: '1:1',
            variants: 1,
            shutProgress: true
          };
          break;
        case 'video':
          endpoint = `${config.baseUrl}/v1/videos/generations`;
          testBody = {
            model: config.selectedModel,
            prompt: 'A test video'
          };
          break;
        case 'audio':
          endpoint = `${config.baseUrl}/v1/audio/speech`;
          testBody = {
            model: config.selectedModel,
            input: 'Test audio'
          };
          break;
      }

      console.log('🧪 测试连接:', {
        type,
        endpoint,
        model: config.selectedModel,
        apiKey: config.apiKey.substring(0, 10) + '...'
      });

      // 发送测试请求
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(testBody)
      });

      console.log('✅ 测试响应:', response.status, response.statusText);

      if (response.ok) {
        setTestResult({
          success: true,
          message: `连接成功！状态码: ${response.status}`
        });
        
        // 🔥 测试成功后自动启用
        if (!config.enabled) {
          updateConfig(type, { enabled: true });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API 返回错误: ${response.status} ${response.statusText}\n${JSON.stringify(errorData).substring(0, 100)}`);
      }
    } catch (error) {
      console.error('❌ 测试失败:', error);
      const message = error instanceof Error ? error.message : '未知错误';
      setTestResult({
        success: false,
        message: message
      });
    } finally {
      setTesting(false);
    }
  };

  const tabInfo = TabConfig[type];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            `bg-${tabInfo.color}-500/10 text-${tabInfo.color}-400`
          )}>
            {tabInfo.icon}
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">
              {language === 'zh' ? tabInfo.label : tabInfo.labelEn}
            </h3>
            <p className="text-white/40 text-xs mt-0.5">
              {config.enabled ? '已启用' : '未启用'}
            </p>
          </div>
        </div>
        
        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          className={cn(
            "relative w-12 h-6 rounded-full transition-colors",
            config.enabled ? "bg-blue-500" : "bg-white/10"
          )}
        >
          <motion.div
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg"
            animate={{ x: config.enabled ? 26 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Config Form */}
      <AnimatePresence>
        {config.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Base URL */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                API 端点 (Base URL)
              </label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={(e) => handleBaseUrlChange(e.target.value)}
                placeholder="https://grsai.dakka.com.cn"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              {(config.baseUrl.includes('gemini') || config.baseUrl.includes('nano-banana')) ? (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                  ⚠️ 错误：Base URL 不应包含模型名称！请只填写：https://grsai.dakka.com.cn
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-white/40">
                  ⚠️ 注意：只填写域名，不要包含模型名称（如 /gemini-2.5-pro）
                </p>
              )}
            </div>

            {/* API Key */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                API 密钥 (API Key)
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={config.apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="输入 'test' 启用测试模式，或输入真实API密钥"
                  className="w-full px-4 py-2.5 pr-12 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {config.apiKey === 'test' || config.apiKey === 'demo' || config.apiKey === 'mock' ? (
                <p className="mt-1.5 text-xs text-green-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  测试模式已启用，将生成模拟数据
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-white/40">
                  密钥将安全存储在本地，不会上传到任何服务器
                </p>
              )}
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                选择模型
              </label>
              <select
                value={config.selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
              >
                {config.availableModels.map((model) => (
                  <option key={model} value={model} className="bg-[#1a1a1a]">
                    {model}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-white/40">
                当前选择: {config.selectedModel}
              </p>
            </div>

            {/* Test Button */}
            <button
              className={cn(
                "w-full py-2.5 rounded-lg font-medium text-sm transition-all",
                config.apiKey
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
                  : "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
              )}
              disabled={!config.apiKey}
              onClick={handleTestConnection}
            >
              {testing ? '测试中...' : config.apiKey ? '测试连接' : '请先输入API密钥'}
            </button>

            {/* Test Result */}
            {testResult && (
              <div
                className={cn(
                  "mt-2 px-4 py-2 rounded-lg text-sm",
                  testResult.success ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                )}
              >
                {testResult.message}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('text');
  const { language } = useLanguageStore();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl max-h-[85vh] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-[9999] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">
                {language === 'zh' ? 'AI 服务配置' : 'AI Service Configuration'}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/5">
              {(Object.keys(TabConfig) as TabType[]).map((tab) => {
                const tabInfo = TabConfig[tab];
                const isActive = activeTab === tab;
                
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all",
                      isActive
                        ? "text-white bg-white/5"
                        : "text-white/50 hover:text-white/80 hover:bg-white/[0.02]"
                    )}
                  >
                    {tabInfo.icon}
                    <span>{language === 'zh' ? tabInfo.label : tabInfo.labelEn}</span>
                    
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ApiConfigPanel type={activeTab} />
                </motion.div>
              </AnimatePresence>

              {/* Help Info */}
              <div className="mt-8 space-y-4">
                {/* Auto Enable Info */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-blue-400 font-semibold mb-2 text-sm flex items-center gap-2">
                    ✨ 自动启用机制
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    输入 API Key 或测试连接成功后，该服务将<strong className="text-blue-400">自动启用</strong>！您也可以随时通过右上角的开关手动控制。
                  </p>
                </div>

                {/* Test Mode */}
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <h4 className="text-green-400 font-semibold mb-2 text-sm flex items-center gap-2">
                    🧪 测试模式
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    在 API Key 处输入 <code className="px-1.5 py-0.5 bg-white/10 rounded text-green-400">test</code> 即可启用测试模式，无需真实API密钥即可体验完整功能！
                  </p>
                </div>

                {/* CORS Warning */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <h4 className="text-yellow-400 font-semibold mb-2 text-sm flex items-center gap-2">
                    ⚠️ 关于 CORS 跨域问题
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    部分API服务可能不支持浏览器直接访问。如遇到 "Failed to fetch" 错误，请使用测试模式或联系服务商开启CORS支持。
                  </p>
                </div>

                {/* API Docs */}
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <h4 className="text-purple-400 font-semibold mb-2 text-sm flex items-center gap-2">
                    📚 API 文档参考
                  </h4>
                  <ul className="space-y-1 text-xs text-white/70 list-disc list-inside">
                    <li>文本生成: 遵循 OpenAI Chat Completions 标准</li>
                    <li>图片生成: 端点 /images/generations (待确认)</li>
                    <li>视频生成: 端点 /videos/generations (待确认)</li>
                    <li>语音生成: 端点 /audio/speech (待确认)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
              >
                保存
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};