#!/usr/bin/env node

/**
 * iooi 项目设置验证脚本
 * 检查所有必需的文件和配置是否正确
 */

import { existsSync } from 'fs';
import { join } from 'path';

const checks = [
  { path: 'index.html', desc: 'HTML 入口文件' },
  { path: 'src/main.tsx', desc: 'JS 入口文件' },
  { path: 'src/app/App.tsx', desc: '主应用组件' },
  { path: 'src/app/routes.ts', desc: '路由配置' },
  { path: 'src/styles/index.css', desc: '主样式文件' },
  { path: 'package.json', desc: 'Package 配置' },
  { path: 'vite.config.ts', desc: 'Vite 配置' },
  { path: 'tsconfig.json', desc: 'TypeScript 配置' },
  { path: 'jsconfig.json', desc: 'JavaScript 配置' },
];

console.log('🔍 验证 iooi 项目设置...\n');

let allPassed = true;

checks.forEach(({ path, desc }) => {
  const exists = existsSync(path);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${desc}: ${path}`);
  if (!exists) allPassed = false;
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('✅ 所有检查通过！项目设置正确。');
  console.log('\n💡 提示: 运行 `pnpm dev` 启动开发服务器');
  process.exit(0);
} else {
  console.log('❌ 部分文件缺失，请检查项目结构');
  process.exit(1);
}
