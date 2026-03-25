import { ApiConfig } from '../store/apiConfigStore';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message?: {
      role: string;
      content: string;
      refusal: string | null;
      annotations: any[];
    };
    delta?: {
      role?: string;
      content?: string;
      refusal?: string | null;
      annotations?: any[];
    };
    finish_reason: string | null;
  }[];
}

// 图片生成请求接口
export interface ImageGenerationRequest {
  model: string;
  prompt: string;
  size?: string; // 图片比例: "auto", "1:1", "3:2", "2:3"
  variants?: number; // 生成数量: 1, 2
  urls?: string[]; // 参考图片URLs
  webHook?: string; // 回调地址，"-1" 表示立即返回id用于轮询
  shutProgress?: boolean; // 关闭进度回复
}

// 图片生成响应接口（流式或webHook）
export interface ImageGenerationResponse {
  id: string;
  url?: string; // 第一张图片URL（兼容旧参数）
  width?: number; // 第一张图片宽度（兼容旧参数）
  height?: number; // 第一张图片高度（兼容旧参数）
  progress: number; // 0-100
  results?: { // 批量生成结果
    url: string;
    width: number;
    height: number;
  }[];
  status: 'running' | 'succeeded' | 'failed';
  failure_reason?: 'output_moderation' | 'input_moderation' | 'error' | '';
  error?: string;
}

// 图片生成结果获取响应
export interface ImageResultResponse {
  code: number; // 0成功, -22任务不存在
  msg: string;
  data?: ImageGenerationResponse;
}

// 视频生成请求接口
export interface VideoGenerationRequest {
  model: string;
  prompt: string;
  duration?: number; // 视频时长（秒）
  aspect_ratio?: string; // 宽高比
  quality?: string; // 质量
}

// 视频生成响应接口
export interface VideoGenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  created: number;
}

// 音频生成请求接口
export interface AudioGenerationRequest {
  model: string;
  prompt: string;
  voice?: string; // 音色/角色
  duration?: number; // 时长
  format?: string; // 音频格式
}

// 音频生成响应接口
export interface AudioGenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audio_url?: string;
  duration?: number;
  created: number;
}

/**
 * AI文本生成服务
 */
export class AIService {
  /**
   * Mock响应生成器（用于测试）
   */
  private static generateMockResponse(prompt: string): string {
    const responses = [
      `根据您的要求"${prompt}"，这是生成的内容：\n\n这是一段示例文本，展示了AI生成的效果。在实际使用中，这里会是来自真实AI模型的响应内容。\n\n当前处于测试模式，请配置真实的API密钥以使用完整功能。`,
      `关于"${prompt}"的回答：\n\n1. 这是第一点说明\n2. 这是第二点说明\n3. 这是第三点说明\n\n测试模式下的模拟响应，实际API会返回更智能的内容。`,
      `"${prompt}"\n\n让我为您创作一段内容：\n\n从前有座山，山里有座庙，庙里有个老和尚在讲故事...\n\n这是测试模式的示例内容。配置API密钥后可使用真实AI生成。`,
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * 生成 Mock 图片（用于测试）
   */
  private static generateMockImage(prompt: string): string {
    // 生成一个简单的彩色渐变图片作为测试
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // 随机渐变色
      const colors = [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#43e97b', '#38f9d7'],
        ['#fa709a', '#fee140'],
      ];
      const colorPair = colors[Math.floor(Math.random() * colors.length)];
      
      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, colorPair[0]);
      gradient.addColorStop(1, colorPair[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
      
      // 添加文字
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('测试模式', 256, 230);
      ctx.font = '16px sans-serif';
      ctx.fillText(prompt.substring(0, 30), 256, 270);
      ctx.fillText('配置 API Key 以使用真实生成', 256, 300);
    }
    
    return canvas.toDataURL('image/png');
  }

  /**
   * 检查是否使用测试模式
   */
  private static isTestMode(provider: ApiConfig): boolean {
    return provider.apiKey === 'test' || 
           provider.apiKey === 'demo' || 
           provider.apiKey === 'mock' ||
           provider.apiKey.startsWith('test-');
  }

  /**
   * 发送聊天请求
   */
  static async chatCompletion(
    provider: ApiConfig,
    messages: ChatMessage[],
    model?: string,
    stream: boolean = false
  ): Promise<ChatCompletionResponse> {
    if (!provider.apiKey) {
      throw new Error('API密钥未配置，请在设置中添加API Key');
    }

    // 测试模式
    if (this.isTestMode(provider)) {
      console.log('🧪 测试模式：生成模拟响应');
      const userMessage = messages.find(m => m.role === 'user')?.content || '';
      const mockContent = this.generateMockResponse(userMessage);
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        id: 'mock-' + Date.now(),
        object: 'chat.completion',
        created: Date.now(),
        model: model || 'test-model',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: mockContent,
            refusal: null,
            annotations: []
          },
          finish_reason: 'stop'
        }]
      };
    }

    // 构建正确的端点URL
    // 对于OpenAI兼容的API（Nano Banana, OpenAI）
    const endpoint = `${provider.baseUrl}/v1/chat/completions`;
    const selectedModel = model || provider.selectedModel || provider.availableModels[0];

    console.log('📡 发送API请求:', {
      endpoint,
      model: selectedModel,
      messageCount: messages.length,
      stream
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          stream
        })
      });

      console.log('📡 API响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API错误响应:', errorData);
        throw new Error(
          errorData.error?.message || 
          `API请求失败: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('✅ API响应成功:', data);
      return data;
    } catch (error) {
      console.error('❌ 网络请求异常:', error);
      
      // 详细的错误分类
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(
          'CORS跨域错误：无法访问API服务器\n\n' +
          '可能的原因：\n' +
          '1. API服务器不允许浏览器跨域请求\n' +
          '2. API服务器地址不正确\n' +
          '3. 网络连接问题\n\n' +
          '💡 解决方案：\n' +
          '• 在API Key处输入 "test" 启用测试模式\n' +
          '• 或联系API服务商开启CORS支持\n' +
          '• 或使用支持CORS的代理服务器'
        );
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络请求失败，请检查网络连接');
    }
  }

  /**
   * 流式聊天请求
   */
  static async chatCompletionStream(
    provider: ApiConfig,
    messages: ChatMessage[],
    model?: string,
    onChunk?: (content: string) => void
  ): Promise<string> {
    if (!provider.apiKey) {
      throw new Error('API密钥未配置，请在设置中添加API Key');
    }

    const endpoint = `${provider.baseUrl}/v1/chat/completions`;
    const selectedModel = model || provider.selectedModel || provider.availableModels[0];

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `API请求失败: ${response.status} ${response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed: ChatCompletionResponse = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onChunk?.(content);
              }
            } catch (e) {
              console.warn('解析流式响应失败:', e);
            }
          }
        }
      }

      return fullContent;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络请求失败，请检查网络连接');
    }
  }

  /**
   * 简单文本生成（单次对话）
   */
  static async generateText(
    provider: ApiConfig,
    prompt: string,
    systemPrompt?: string,
    model?: string
  ): Promise<string> {
    const messages: ChatMessage[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const response = await this.chatCompletion(provider, messages, model);
    return response.choices[0]?.message?.content || '';
  }

  /**
   * 流式文本生成（单次对话）
   */
  static async generateTextStream(
    provider: ApiConfig,
    prompt: string,
    systemPrompt?: string,
    model?: string,
    onChunk?: (content: string) => void
  ): Promise<string> {
    const messages: ChatMessage[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    return await this.chatCompletionStream(provider, messages, model, onChunk);
  }

  /**
   * 图片生成（支持流式进度）
   */
  static async generateImage(
    provider: ApiConfig,
    prompt: string,
    options?: {
      size?: string; // "auto", "1:1", "3:2", "2:3"
      variants?: number; // 1, 2
      referenceUrls?: string[]; // 参考图片URLs
      onProgress?: (progress: number, status: string) => void; // 进度回调
    }
  ): Promise<string> {
    if (!provider.apiKey) {
      throw new Error('API密钥未配置，请在设置中添加API Key');
    }

    // 测试模式
    if (this.isTestMode(provider)) {
      console.log('🧪 测试模式：生成模拟图片');
      // 模拟进度
      if (options?.onProgress) {
        for (let i = 0; i <= 100; i += 20) {
          options.onProgress(i, i === 100 ? 'succeeded' : 'running');
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      return this.generateMockImage(prompt);
    }

    // 新API端点：/v1/draw/completions
    const endpoint = `${provider.baseUrl}/v1/draw/completions`;
    const selectedModel = provider.selectedModel || provider.availableModels[0];

    console.log('🎨 发送图片生成请求:', {
      endpoint,
      model: selectedModel,
      prompt: prompt.substring(0, 100),
      options
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt,
          size: options?.size || '1:1',
          variants: options?.variants || 1,
          urls: options?.referenceUrls,
          shutProgress: false // 不关闭进度
        })
      });

      console.log('🎨 图片生成响应状态:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 图片生成错误:', errorData);
        throw new Error(
          errorData.error?.message || 
          `图片生成失败: ${response.status} ${response.statusText}`
        );
      }

      // 检查是否是流式响应
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/event-stream') || contentType?.includes('application/stream')) {
        // 流式响应 - 读取进度
        return await this.handleImageStreamResponse(response, options?.onProgress);
      } else {
        // 普通JSON响应
        const data: ImageGenerationResponse = await response.json();
        return this.extractImageUrl(data);
      }
    } catch (error) {
      console.error('❌ 图片生成异常:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(
          'CORS跨域错误：无法访问图片生成API\n\n' +
          '💡 解决方案：\n' +
          '• 在API Key处输入 "test" 启用测试模式\n' +
          '• 或联系API服务商开启CORS支持'
        );
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('图片生成请求失败');
    }
  }

  /**
   * 处理图片生成的流式响应
   */
  private static async handleImageStreamResponse(
    response: Response,
    onProgress?: (progress: number, status: string) => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let finalUrl = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          // 跳过SSE注释行
          if (line.startsWith(':')) continue;
          
          // 处理 data: 行
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const data: ImageGenerationResponse = JSON.parse(jsonStr);
              
              // 更新进度
              if (onProgress && data.progress !== undefined) {
                onProgress(data.progress, data.status);
              }

              console.log('📊 图片生成进度:', {
                progress: data.progress,
                status: data.status
              });

              // 检查是否完成
              if (data.status === 'succeeded') {
                finalUrl = this.extractImageUrl(data);
                console.log('✅ 图片生成成功:', finalUrl.substring(0, 100));
              } else if (data.status === 'failed') {
                const errorMsg = this.getFailureMessage(data.failure_reason, data.error);
                throw new Error(errorMsg);
              }
            } catch (e) {
              if (e instanceof SyntaxError) {
                console.warn('⚠️ 解析流式响应失败:', jsonStr);
              } else {
                throw e;
              }
            }
          }
        }
      }

      if (!finalUrl) {
        throw new Error('未收到图片生成结果');
      }

      return finalUrl;
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 从响应中提取图片URL
   */
  private static extractImageUrl(data: ImageGenerationResponse): string {
    // 优先使用 results 数组
    if (data.results && data.results.length > 0 && data.results[0].url) {
      return data.results[0].url;
    }
    
    // 兼容旧格式
    if (data.url) {
      return data.url;
    }

    throw new Error('响应中未包含图片URL');
  }

  /**
   * 获取失败原因的友好提示
   */
  private static getFailureMessage(reason?: string, error?: string): string {
    const messages: Record<string, string> = {
      'output_moderation': '⚠️ 生成的图片内容违规，已被过滤',
      'input_moderation': '⚠️ 输入的提示词包含违规内容，请修改后重试',
      'error': '❌ 生成过程中发生错误，请重试'
    };

    const baseMsg = messages[reason || 'error'] || '图片生成失败';
    return error ? `${baseMsg}\n详细信息: ${error}` : baseMsg;
  }

  /**
   * 获取图片生成结果（用于轮询）
   */
  static async getImageResult(
    provider: ApiConfig,
    taskId: string
  ): Promise<ImageGenerationResponse> {
    if (!provider.apiKey) {
      throw new Error('API密钥未配置');
    }

    const endpoint = `${provider.baseUrl}/v1/draw/result`;

    console.log('🔍 查询图片生成结果:', taskId);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({ id: taskId })
      });

      if (!response.ok) {
        throw new Error(`查询失败: ${response.status}`);
      }

      const result: ImageResultResponse = await response.json();

      if (result.code === -22) {
        throw new Error('任务不存在');
      }

      if (result.code !== 0) {
        throw new Error(result.msg || '查询失败');
      }

      if (!result.data) {
        throw new Error('未返回任务数据');
      }

      return result.data;
    } catch (error) {
      console.error('❌ 查询图片结果异常:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('查询图片结果失败');
    }
  }

  /**
   * 视频生成
   */
  static async generateVideo(
    provider: ApiConfig,
    prompt: string,
    options?: {
      duration?: number;
      aspect_ratio?: string;
      quality?: string;
    }
  ): Promise<{ url: string; taskId?: string }> {
    if (!provider.apiKey) {
      throw new Error('API密钥未配置，请在设置中添加API Key');
    }

    // 测试模式
    if (this.isTestMode(provider)) {
      console.log('🧪 测试模式：生成模拟视频');
      await new Promise(resolve => setTimeout(resolve, 3000));
      // 返回一个示例视频URL（可以是公开的测试视频）
      return {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        taskId: 'test-' + Date.now()
      };
    }

    const endpoint = `${provider.baseUrl}/v1/videos/generations`;
    const selectedModel = provider.selectedModel || provider.availableModels[0];

    console.log('🎬 发送视频生成请求:', {
      endpoint,
      model: selectedModel,
      prompt: prompt.substring(0, 100),
      options
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt,
          duration: options?.duration || 5,
          aspect_ratio: options?.aspect_ratio || '16:9',
          quality: options?.quality || 'standard'
        })
      });

      console.log('🎬 视频生成响应状态:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 视频生成错误:', errorData);
        throw new Error(
          errorData.error?.message || 
          `视频生成失败: ${response.status} ${response.statusText}`
        );
      }

      const data: VideoGenerationResponse = await response.json();
      console.log('✅ 视频生成任务已提交:', data);

      // 根据不同的响应格式处理
      if (data.status === 'completed' && data.video_url) {
        // 立即完成
        return { url: data.video_url, taskId: data.id };
      } else if (data.status === 'pending' || data.status === 'processing') {
        // 需要轮询状态
        return { url: '', taskId: data.id };
      }

      throw new Error('视频生成响应格式错误');
    } catch (error) {
      console.error('❌ 视频生成异常:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(
          'CORS跨域错误：无法访问视频生成API\\n\\n' +
          '💡 解决方案：\\n' +
          '• 在API Key处输入 \"test\" 启用测试模式\\n' +
          '• 或联系API服务商开启CORS支持'
        );
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('视频生成请求失败');
    }
  }

  /**
   * 音频生成
   */
  static async generateAudio(
    provider: ApiConfig,
    prompt: string,
    options?: {
      voice?: string;
      duration?: number;
      format?: string;
    }
  ): Promise<{ url: string; taskId?: string }> {
    if (!provider.apiKey) {
      throw new Error('API密钥未配置，请在设置中添加API Key');
    }

    // 测试模式
    if (this.isTestMode(provider)) {
      console.log('🧪 测试模式：生成模拟音频');
      await new Promise(resolve => setTimeout(resolve, 2000));
      // 返回一个示例音频URL
      return {
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        taskId: 'test-' + Date.now()
      };
    }

    const endpoint = `${provider.baseUrl}/v1/audio/speech`;
    const selectedModel = provider.selectedModel || provider.availableModels[0];

    console.log('🎵 发送音频生成请求:', {
      endpoint,
      model: selectedModel,
      prompt: prompt.substring(0, 100),
      options
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          input: prompt,
          voice: options?.voice || 'alloy',
          response_format: options?.format || 'mp3'
        })
      });

      console.log('🎵 音频生成响应状态:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 音频生成错误:', errorData);
        throw new Error(
          errorData.error?.message || 
          `音频生成失败: ${response.status} ${response.statusText}`
        );
      }

      // 检查响应类型
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        // JSON 响应（任务ID）
        const data: AudioGenerationResponse = await response.json();
        console.log('✅ 音频生成任务已提交:', data);
        
        if (data.status === 'completed' && data.audio_url) {
          return { url: data.audio_url, taskId: data.id };
        } else if (data.status === 'pending' || data.status === 'processing') {
          return { url: '', taskId: data.id };
        }
      } else if (contentType?.includes('audio/')) {
        // 直接返回音频文件
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        console.log('✅ 音频生成成功（直接返回）');
        return { url };
      }

      throw new Error('音频生成响应格式错误');
    } catch (error) {
      console.error('❌ 音频生成异常:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(
          'CORS跨域错误：无法访问音频生成API\\n\\n' +
          '💡 解决方案：\\n' +
          '• 在API Key处输入 \"test\" 启用测试模式\\n' +
          '• 或联系API服务商开启CORS支持'
        );
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('音频生成请求失败');
    }
  }
}