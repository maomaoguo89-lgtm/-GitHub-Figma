# 🔗 API 端点参考

## ✅ 正确配置

根据 API 文档，所有端点都需要 `/v1` 前缀！

---

## 📋 完整端点列表

### Base URL
```
https://grsai.dakka.com.cn
```

### 文本生成 (Chat API)
- **端点**: `/v1/chat/completions`
- **完整URL**: `https://grsai.dakka.com.cn/v1/chat/completions`
- **方法**: POST
- **请求体**:
```json
{
  "model": "gemini-2.5-pro",
  "messages": [
    { "role": "user", "content": "你的问题" }
  ],
  "stream": false
}
```

### 图片生成 (Images API)
- **端点**: `/v1/images/generations`
- **完整URL**: `https://grsai.dakka.com.cn/v1/images/generations`
- **方法**: POST
- **请求体**:
```json
{
  "model": "sora-image",
  "prompt": "图片描述",
  "n": 1
}
```

### 视频生成 (Videos API)
- **端点**: `/v1/videos/generations`
- **完整URL**: `https://grsai.dakka.com.cn/v1/videos/generations`
- **方法**: POST
- **请求体**:
```json
{
  "model": "veo3.1-fast-4k",
  "prompt": "视频描述"
}
```

### 语音生成 (Audio API)
- **端点**: `/v1/audio/speech`
- **完整URL**: `https://grsai.dakka.com.cn/v1/audio/speech`
- **方法**: POST
- **请求体**:
```json
{
  "model": "sora-create-character",
  "input": "要转换的文本"
}
```

---

## 🔑 请求头

所有请求都需要以下请求头：

```http
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY_HERE
```

---

## ✅ 已修复

### 问题
之前使用的端点是 `/chat/completions`（缺少 `/v1`），导致 404 错误。

### 解决方案
所有端点都已更新为包含 `/v1` 前缀：
- ✅ `/v1/chat/completions`
- ✅ `/v1/images/generations`
- ✅ `/v1/videos/generations`
- ✅ `/v1/audio/speech`

---

## 🧪 测试连接

配置好后，点击**"测试连接"**按钮验证配置是否正确：

### 成功响应
```
✅ 连接成功！状态码: 200
```

### 失败响应
- `404 Not Found` - 端点路径错误（已修复）
- `401 Unauthorized` - API密钥无效
- `Failed to fetch` - CORS 跨域问题

---

## 💡 提示

1. **Base URL 只填写域名**
   - ✅ 正确：`https://grsai.dakka.com.cn`
   - ❌ 错误：`https://grsai.dakka.com.cn/v1`
   - ❌ 错误：`https://grsai.dakka.com.cn/gemini-2.5-pro`

2. **模型名称在下拉列表选择**
   - 不要包含在 Base URL 中

3. **测试模式**
   - API Key 输入 `test` 可跳过真实API调用

---

现在配置应该完全正确了！🎉
