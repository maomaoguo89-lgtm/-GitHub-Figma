# 🚀 语言切换功能 - 5分钟快速上手

## 📍 在哪里找到语言切换？

```
┌─────────────────────────────────────────────────────────────┐
│ [iooi] [iooi空间] [工作空间]    [挑战赛] [CN ▼] [进入画板] │  ← 这里！
└─────────────────────────────────────────────────────────────┘
```

**位置：** 顶部导航栏右侧，「进入画板」按钮左边

---

## 🎯 如何使用？

### 方法 1️⃣：点击切换

1. 找到导航栏右上角的 **CN** 或 **EN** 按钮
2. 点击按钮
3. 在弹出菜单中选择您想要的语言
4. 完成！页面立即切换

### 方法 2️⃣：键盘快捷键（即将推出）

```
Ctrl/Cmd + Shift + L  →  快速切换语言
```

---

## 💡 效果预览

### 切换前（中文）
```
导航栏：
[I'm iooi] [iooi空间] [工作空间] [挑战赛] [CN ▼] [进入画板]

按钮文本：
• 新建画板
• 创建新项目
• 保存
• 导出
```

### 切换后（英文）
```
Navigation:
[I'm iooi] [iooi Space] [Workspace] [Challenges] [EN ▼] [Enter Canvas]

Button Text:
• New Canvas
• Create New Project
• Save
• Export
```

---

## ✅ 支持的语言

| 语言 | 代码 | 状态 |
|------|------|------|
| 🇨🇳 中文 | zh | ✅ 完整支持 |
| 🇺🇸 English | en | ✅ 完整支持 |
| 🇯🇵 日本語 | ja | 🔜 计划中 |
| 🇰🇷 한국어 | ko | 🔜 计划中 |

---

## 🔍 常见问题

### Q1: 语言会自动保存吗？
**A:** ✅ 是的！您的语言偏好会自动保存到本地存储，下次访问时自动加载。

### Q2: 切换语言需要刷新页面吗？
**A:** ❌ 不需要！语言切换是即时生效的，无需刷新。

### Q3: 所有页面都会切换语言吗？
**A:** ✅ 是的！包括首页、工作空间、iooi TV、画布等所有页面。

### Q4: 如果我想恢复默认语言？
**A:** 点击语言按钮，选择「中文」即可恢复默认设置。

### Q5: 可以添加更多语言吗？
**A:** ✅ 可以！查看 [LANGUAGE_FEATURE.md](./LANGUAGE_FEATURE.md) 了解如何添加新语言。

---

## 🎨 语言切换菜单预览

```
┌─────────────────────────────┐
│  🌐 Select Language         │
├─────────────────────────────┤
│  🇨🇳  中文              ✓   │  ← 当前语言
│  🇺🇸  English               │
├─────────────────────────────┤
│  语言偏好将被保存           │
└─────────────────────────────┘
```

**设计特点：**
- 🎨 暗黑毛玻璃背景
- 🏴 国旗图标快速识别
- ✓ 选中状态清晰标记
- 💾 底部提示自动保存

---

## 📱 移动端支持

语言切换在移动设备上同样可用：
- 响应式设计
- 触摸友好的按钮
- 优化的菜单布局

---

## 🛠️ 开发者信息

### 在代码中使用翻译

```typescript
import { useTranslation } from '../i18n/useTranslation';

function MyComponent() {
  const { t, language } = useTranslation();
  
  return (
    <div>
      <h1>{t.home.title}</h1>
      <button>{t.common.save}</button>
      <p>当前语言: {language}</p>
    </div>
  );
}
```

### 添加新的翻译

编辑 `/src/app/i18n/translations.ts`:

```typescript
export const translations = {
  zh: {
    myNewFeature: {
      title: "新功能标题",
      description: "新功能描述"
    }
  },
  en: {
    myNewFeature: {
      title: "New Feature Title",
      description: "New Feature Description"
    }
  }
};
```

---

## 🎓 进阶技巧

### 技巧 1: 查看当前语言
打开浏览器控制台（F12）：
```javascript
console.log(localStorage.getItem('iooi-language-storage'));
```

### 技巧 2: 手动设置语言
```javascript
// 设置为英文
localStorage.setItem('iooi-language-storage', JSON.stringify({
  state: { language: 'en' },
  version: 0
}));
location.reload();
```

### 技巧 3: 清除语言设置
```javascript
localStorage.removeItem('iooi-language-storage');
location.reload();  // 将恢复为默认的中文
```

---

## 📚 相关文档

- 📖 [完整功能文档](./LANGUAGE_FEATURE.md) - 深入了解语言系统
- 🎨 [交互演示](./LANGUAGE_DEMO.html) - 在浏览器中体验
- 📋 [变更日志](./CHANGELOG.md) - 查看版本历史
- 🏠 [README](./README.md) - 项目概述

---

## 💬 反馈与支持

遇到问题或有建议？

- 🐛 报告 Bug
- 💡 提出新想法
- 🌍 建议新语言
- ✍️ 改进翻译

---

## 🎉 开始使用

1. 打开 iooi 应用
2. 找到右上角的 **CN** 按钮
3. 点击并选择您的语言
4. 享受双语体验！

---

**最后更新:** 2026-03-19  
**版本:** 1.1.0  
**支持的语言:** 中文、English

---

<div align="center">
  <strong>🌐 让 iooi 说您的语言！</strong>
</div>
