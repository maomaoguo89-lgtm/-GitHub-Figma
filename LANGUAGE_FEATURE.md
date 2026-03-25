# 🌐 中英文切换功能说明

## 功能概述

iooi 无限画板现已支持完整的中英文双语切换功能，用户可以在界面右上角轻松切换语言偏好。

---

## 🎯 功能特点

### 1. **智能语言切换**
- ✅ 点击顶部导航栏的 **CN/EN** 按钮即可切换语言
- ✅ 优雅的下拉菜单，带有国旗图标
- ✅ 当前选中语言会显示勾选标记

### 2. **持久化存储**
- ✅ 语言偏好自动保存到本地存储
- ✅ 刷新页面后保持用户的语言选择
- ✅ 基于 Zustand + localStorage 实现

### 3. **全局生效**
- ✅ 所有页面实时响应语言切换
- ✅ 导航栏、按钮、菜单全部翻译
- ✅ 无需刷新页面即可看到变化

---

## 📱 使用方法

### **切换语言的步骤：**

1. 打开 iooi 应用首页
2. 找到右上角的 **CN** 或 **EN** 按钮
3. 点击按钮，弹出语言选择菜单
4. 选择您想要的语言：
   - 🇨🇳 **中文** - 默认语言
   - 🇺🇸 **English** - 英文界面

---

## 🛠️ 技术实现

### **架构组件**

```
/src/app/
├── store/
│   └── languageStore.ts       # 语言状态管理 (Zustand + Persist)
├── i18n/
│   ├── translations.ts         # 翻译内容配置
│   └── useTranslation.ts       # 翻译 Hook
└── components/
    └── LanguageSwitcher.tsx    # 语言切换组件
```

### **核心文件说明**

#### 1️⃣ **languageStore.ts** - 状态管理
```typescript
// 管理当前语言状态
export const useLanguageStore = create(
  persist(
    (set) => ({
      language: 'zh',  // 默认中文
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => ...
    })
  )
);
```

#### 2️⃣ **translations.ts** - 翻译配置
```typescript
export const translations = {
  zh: {
    nav: {
      workspace: "工作空间",
      challenges: "挑战赛",
      ...
    }
  },
  en: {
    nav: {
      workspace: "Workspace",
      challenges: "Challenges",
      ...
    }
  }
};
```

#### 3️⃣ **LanguageSwitcher.tsx** - UI 组件
- 优雅的 Popover 下拉菜单
- 国旗图标 + 语言名称
- 选中状态标记
- 暗黑毛玻璃风格

#### 4️⃣ **useTranslation Hook** - 使用翻译
```typescript
// 在任何组件中使用
const { t, language } = useTranslation();

// 访问翻译文本
<button>{t.nav.workspace}</button>
```

---

## 🎨 UI 设计

### **语言切换按钮**
```
┌─────────────┐
│  CN  ▼      │  ← 默认显示 CN（中文）或 EN（英文）
└─────────────┘
```

### **下拉菜单**
```
┌────────────────────────────┐
│  🌐 Select Language         │
├────────────────────────────┤
│  🇨🇳  中文              ✓   │  ← 已选中
│  🇺🇸  English               │
├────────────────────────────┤
│  语言偏好将被保存           │
└────────────────────────────┘
```

---

## 📋 已翻译内容

### ✅ 导航栏
- I'm iooi
- iooi空间 / iooi Space
- 工作空间 / Workspace
- 挑战赛 / Challenges
- 赚取 ioos / Earn ioos
- 价格方案 / Pricing
- 进入画板 / Enter Canvas

### ✅ 用户菜单
- 个人主页 / Profile
- 设置 / Settings
- 登出 / Logout

### ✅ 工作空间页面
- 新建画板 / New Canvas
- 所有项目 / All Projects
- 最近编辑 / Recently Edited
- 创建新项目 / Create New Project
- 项目名称 / Project Name

### ✅ iooi TV
- 全部 / All
- 精选发布 / Featured
- 电视广告 / TV Commercial
- 动画 / Animation
- MV / Music Video
- 教程 / Tutorial

### ✅ 画布页面
- 选择 / Select
- 拖拽 / Hand
- 文本 / Text
- 图片 / Image
- 视频 / Video
- 音频 / Audio
- 撤销 / Undo
- 重做 / Redo
- 保存 / Save
- 导出 / Export
- 分享 / Share

---

## 🔄 扩展翻译

### **添加新的翻译内容**

1. 打开 `/src/app/i18n/translations.ts`
2. 在 `zh` 和 `en` 对象中同时添加新的键值对：

```typescript
export const translations = {
  zh: {
    // 添加新内容
    newFeature: {
      title: "新功能标题",
      description: "新功能描述"
    }
  },
  en: {
    // 对应的英文翻译
    newFeature: {
      title: "New Feature Title",
      description: "New Feature Description"
    }
  }
};
```

3. 在组件中使用：
```typescript
const { t } = useTranslation();
console.log(t.newFeature.title);
```

---

## 🌍 未来计划

- [ ] 支持更多语言（日语、韩语、法语等）
- [ ] 自动检测浏览器语言
- [ ] 支持 RTL（从右到左）语言
- [ ] 翻译管理后台
- [ ] 社区贡献翻译

---

## 📸 效果预览

### **中文界面**
```
导航栏: [I'm iooi] [iooi空间] [工作空间] ... [CN ▼] [进入画板]
```

### **英文界面**
```
Nav Bar: [I'm iooi] [iooi Space] [Workspace] ... [EN ▼] [Enter Canvas]
```

---

## 🔍 调试技巧

### **查看当前语言**
```javascript
// 在浏览器控制台
localStorage.getItem('iooi-language-storage')
```

### **手动切换语言**
```javascript
// 在浏览器控制台
const store = JSON.parse(localStorage.getItem('iooi-language-storage'));
store.state.language = 'en';  // 或 'zh'
localStorage.setItem('iooi-language-storage', JSON.stringify(store));
location.reload();
```

### **清除语言设置**
```javascript
localStorage.removeItem('iooi-language-storage');
location.reload();
```

---

## 💡 最佳实践

1. **始终保持中英文同步**
   - 添加新文本时，同时添加中英文翻译
   - 确保翻译键名一致

2. **使用语义化的键名**
   ```typescript
   // ✅ 好的命名
   t.nav.workspace
   t.workspace.createProject
   
   // ❌ 不好的命名
   t.text1
   t.btn_01
   ```

3. **保持翻译简洁**
   - 导航按钮: 2-4 个字
   - 提示文本: 一句话以内
   - 描述性文本: 适当换行

4. **测试两种语言**
   - 切换到英文检查布局
   - 确保长文本不会溢出
   - 验证所有界面元素

---

## 📧 反馈与建议

如果您发现翻译问题或有改进建议：

1. 记录具体的翻译错误
2. 提供更好的翻译建议
3. 指出缺失的翻译内容

我们会持续优化双语体验！🚀

---

**最后更新:** 2026-03-19  
**版本:** 1.0.0  
**支持语言:** 中文 (zh)、English (en)
