# 🔧 故障排除指南

## 常见错误及解决方案

### ❌ 错误: "Failed to fetch dynamically imported module"

**原因:** 这通常是由于缺少入口文件或配置不正确导致的。

**解决方案:**

1. **验证项目设置**
   ```bash
   pnpm verify
   ```

2. **清除缓存并重新安装**
   ```bash
   rm -rf node_modules
   rm -rf dist
   rm pnpm-lock.yaml
   pnpm install
   ```

3. **重新启动开发服务器**
   ```bash
   pnpm dev
   ```

4. **强制刷新浏览器**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

---

### ❌ 错误: "Cannot find module '@/...'"

**原因:** 路径别名配置问题。

**解决方案:**

检查以下文件是否包含正确的路径配置:

**vite.config.ts:**
```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

### ❌ 错误: React 或 React-DOM 未找到

**原因:** Peer dependencies 未正确安装。

**解决方案:**

1. 创建 `.npmrc` 文件 (已包含在项目中):
   ```
   auto-install-peers=true
   strict-peer-dependencies=false
   ```

2. 重新安装依赖:
   ```bash
   pnpm install --force
   ```

---

### ❌ 错误: Tailwind CSS 样式未应用

**原因:** Tailwind v4 配置问题。

**解决方案:**

1. 检查 `src/styles/tailwind.css`:
   ```css
   @import 'tailwindcss' source(none);
   @source '../**/*.{js,ts,jsx,tsx}';
   
   @import 'tw-animate-css';
   ```

2. 确保 `src/styles/index.css` 导入了 tailwind.css:
   ```css
   @import './fonts.css';
   @import './tailwind.css';
   @import './theme.css';
   ```

---

### ❌ 错误: Motion/Framer Motion 导入失败

**原因:** 导入路径错误。

**解决方案:**

使用正确的导入语法:
```tsx
// ✅ 正确
import { motion, AnimatePresence } from 'motion/react';

// ❌ 错误
import { motion } from 'framer-motion';
```

---

### ❌ 错误: 图片资源加载失败

**原因:** `figma:asset` 导入路径问题。

**解决方案:**

1. **Raster 图片** - 使用 `figma:asset`:
   ```tsx
   import img from "figma:asset/abc123.png";
   ```

2. **SVG 文件** - 使用相对路径:
   ```tsx
   import svg from "../imports/svg-wg56ef214f";
   ```

3. **新图片** - 使用 ImageWithFallback 组件:
   ```tsx
   import { ImageWithFallback } from './components/figma/ImageWithFallback';
   ```

---

### ❌ 错误: 节点连接点位置不正确

**原因:** Transform 层的 pointer-events 阻塞。

**解决方案:**

已在最新版本中修复。确保底部功能框有 `pointer-events-auto`:
```tsx
<div className="pointer-events-auto">
  {/* 交互元素 */}
</div>
```

---

## 📊 调试技巧

### 1. 启用详细日志

在浏览器控制台查看详细错误信息:
```javascript
// 打开控制台 (F12 或 Cmd+Option+I)
// 查看 Console、Network 和 Sources 标签
```

### 2. 检查网络请求

查看是否有 404 错误或模块加载失败:
1. 打开 DevTools
2. 切换到 Network 标签
3. 刷新页面
4. 查找红色的失败请求

### 3. 清除浏览器缓存

有时旧的缓存会导致问题:
1. 打开 DevTools
2. 右键点击刷新按钮
3. 选择 "清空缓存并硬性重新加载"

---

## 🆘 仍然无法解决?

1. **查看完整错误栈**
   ```bash
   pnpm dev --debug
   ```

2. **检查 Node.js 版本**
   ```bash
   node --version  # 应该 >= 18.0.0
   ```

3. **检查 pnpm 版本**
   ```bash
   pnpm --version  # 应该 >= 8.0.0
   ```

4. **完全重置项目**
   ```bash
   # 备份 src/ 目录
   rm -rf node_modules dist
   rm pnpm-lock.yaml
   pnpm install
   pnpm dev
   ```

---

## 📧 获取帮助

如果以上方法都无法解决问题:

1. 收集错误信息（截图 + 完整错误日志）
2. 记录重现步骤
3. 检查浏览器控制台的完整输出
4. 联系开发团队

---

**最后更新:** 2026-03-19  
**版本:** 1.0.0
