# 🎨 全新设置界面指南

## ✅ 界面已完全重构！

按照你的建议，我已经将设置界面重新组织为**按功能分类**，而不是按提供商分类。

---

## 📋 新界面结构

### Tab 分类
1. **文本生成** - 用于 TextNode
2. **图片生成** - 用于 ImageNode  
3. **视频生成** - 用于 VideoNode
4. **语音生成** - 用于 AudioNode

### 每个 Tab 包含
- **API 端点** (Base URL) - 可编辑输入框
- **API 密钥** (API Key) - 密码输入框，带显示/隐藏切换
- **模型选择** - 下拉列表
- **启用开关** - Toggle 开关
- **测试按钮** - 测试连接（即将实现）

---

## 🎯 配置流程

### 方式一：测试模式（无需真实API）

```
1. 打开设置 (Cmd/Ctrl + ,)
2. 点击"文本生成"Tab
3. 打开右上角的启用开关（变蓝色）
4. API Key 输入: test
5. 保持默认的 Base URL 和模型
6. 点击"保存"
7. 开始使用！
```

### 方式二：真实API配置

```
1. 打开设置 (Cmd/Ctrl + ,)
2. 点击对应的Tab（文本/图片/视频/语音）
3. 打开启用开关
4. 输入 Base URL: https://grsai.dakka.com.cn
5. 输入你的真实API密钥
6. 选择模型（例如: gemini-2.5-pro）
7. 点击"保存"
```

---

##元配置

### 文本生成（Text Generation）

```json
{
  "baseUrl": "https://grsai.dakka.com.cn",
  "apiKey": "your-api-key-here",
  "selectedModel": "gemini-2.5-pro",
  "availableModels": [
    "gemini-2.5-pro",
    "gemini-3.1-pro",
    "gemini-3-pro",
    "nano-banana",
    "nano-banana-fast",
    "nano-banana-pro",
    "nano-banana-2",
    "nano-banana-pro-vt",
    "nano-banana-2-cl",
    "nano-banana-pro-cl"
  ],
  "enabled": true
}
```

**API 端点**: `/chat/completions`  
**完整URL**: `https://grsai.dakka.com.cn/chat/completions`

### 图片生成（Image Generation）

```json
{
  "baseUrl": "https://grsai.dakka.com.cn",
  "apiKey": "your-api-key-here",
  "selectedModel": "sora-image",
  "availableModels": [
    "sora-image",
    "nano-banana-pro",
    "gpt-image-1.5",
    "nano-banana-fast"
  ],
  "enabled": false
}
```

**API 端点**: `/images/generations` (待确认)  
**说明**: 请提供图片生成的API文档以完善集成

### 视频生成（Video Generation）

```json
{
  "baseUrl": "https://grsai.dakka.com.cn",
  "apiKey": "your-api-key-here",
  "selectedModel": "veo3.1-fast-4k",
  "availableModels": [
    "veo3.1-fast-4k",
    "veo3.1-pro-1080p",
    "veo3.1-pro-4k"
  ],
  "enabled": false
}
```

**API 端点**: `/videos/generations` (待确认)  
**说明**: 请提供视频生成的API文档以完善集成

### 语音生成（Audio Generation）

```json
{
  "baseUrl": "https://grsai.dakka.com.cn",
  "apiKey": "your-api-key-here",
  "selectedModel": "sora-create-character",
  "availableModels": [
    "sora-create-character",
    "sora-upload-character"
  ],
  "enabled": false
}
```

**API 端点**: `/audio/speech` (待确认)  
**说明**: 请提供语音生成的API文档以完善集成

---

## 🎨 界面设计细节

### Tab 切换
- 带图标的Tab按钮
- 平滑的切换动画
- 活动Tab下方有蓝色高亮条

### 启用开关
- 右上角Toggle开关
- 开启：蓝色背景
- 关闭：灰色背景
- 带流畅的滑动动画

### Base URL 输入框
- 支持编辑
- 默认值：`https://grsai.dakka.com.cn`
- 带有说明文字

### API Key 输入框
- 密码类型输入
- 带显示/隐藏眼睛图标
- 测试模式检测（输入test时显示绿色提示）

### 模型选择
- 下拉选择框
- 显示当前选择
- 暗色背景适配

---

## 📊 数据存储结构

```typescript
{
  configs: {
    text: { type, baseUrl, apiKey, selectedModel, availableModels, enabled },
    image: { ... },
    video: { ... },
    audio: { ... }
  }
}
```

**存储位置**: LocalStorage  
**键名**: `api-config-storage-v2`  
**版本**: 2

---

## 🔧 API 调用逻辑

### TextNode 生成流程

```javascript
// 1. 获取配置
const textConfig = configs.text;

// 2. 检查启用状态
if (!textConfig.enabled) {
  alert('请先启用文本生成API');
  return;
}

// 3. 检查API密钥
if (!textConfig.apiKey) {
  alert('请先配置API密钥');
  return;
}

// 4. 调用API
const result = await AIService.generateText(
  textConfig,      // ApiConfig对象
  prompt,          // 用户输入
  undefined,       // system prompt
  textConfig.selectedModel  // 模型名
);
```

### API请求构建

```javascript
// 端点URL
const endpoint = `${textConfig.baseUrl}/chat/completions`;
// => https://grsai.dakka.com.cn/chat/completions

// 请求头
{
  "Content-Type": "application/json",
  "Authorization": `Bearer ${textConfig.apiKey}`
}

// 请求体
{
  "model": "gemini-2.5-pro",
  "messages": [
    { "role": "user", "content": "用户输入的prompt" }
  ],
  "stream": false
}
```

---

## ✨ 特色功能

### 1. 测试模式
输入 `test`、`demo` 或 `mock` 作为API Key，自动进入测试模式：
- 生成模拟数据
- 模拟网络延迟（1.5秒）
- 完整UI体验
- 控制台显示🧪标识

### 2. CORS错误检测
自动识别跨域错误并提供解决方案：
- 详细的错误说明
- 多种解决方案建议
- 测试模式fallback

### 3. 智能提示
- 配置未完成时自动引导
- 点击确定直接跳转设置页
- 密码框显示/隐藏切换
- 测试模式实时检测

---

## 🚀 下一步集成

### ImageNode 图片生成
**需要的信息**：
- API 端点路径（例如：`/images/generations`）
- 请求参数格式
- 响应数据格式
- 是否支持流式输出

### VideoNode 视频生成
**需要的信息**：
- API 端点路径
- 请求参数（尺寸、时长等）
- 响应格式
- 生成时间预估

### AudioNode 语音生成
**需要的信息**：
- API 端点路径
- 请求参数（语音角色等）
- 响应格式（音频URL还是Base64？）

---

## 📝 现在可以测试了！

### 快速测试步骤

```bash
1. Cmd/Ctrl + ,         # 打开设置
2. 点击"文本生成"Tab
3. 打开启用开关
4. API Key 输入: test
5. 点击"保存"
6. 选中一个TextNode
7. 输入: "写一首诗"
8. 点击生成按钮
9. 查看控制台和结果！
```

### 控制台输出示例

```
=== 开始生成流程 ===
1. Prompt: 写一首诗
2. 查找API配置...
   - 文本生成配置: {enabled: true, apiKey: "test", ...}
3. 文本配置状态: {type: "text", enabled: true}
4. API密钥已配置（前10位）: test...
5. 准备调用API:
   - Base URL: https://grsai.dakka.com.cn
   - Model: gemini-2.5-pro
   - Prompt: 写一首诗...
🧪 测试模式：生成模拟响应
6. ✅ 生成成功！
```

---

## 💡 提示

1. **同一个API密钥可用于多个功能**
   - 只需要一个账号/密钥
   - 在每个Tab分别配置即可

2. **Base URL 可以不同**
   - 如果图片和文本使用不同服务器
   - 可以分别配置不同的Base URL

3. **模型可以独立选择**
   - 文本用 gemini-2.5-pro
   - 图片用 sora-image
   - 互不影响

4. **启用状态独立控制**
   - 可以只启用文本生成
   - 其他功能暂时禁用
   - 需要时再启用

---

现在界面更加清晰和专业了！🎉 

如果你能提供图片、视频、语音生成的API文档，我会立即完成其他三个Node的集成！
