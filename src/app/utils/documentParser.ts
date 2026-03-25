import { Node } from '../store/canvasStore';

// 动态加载 mammoth 浏览器端脚本，绕过 Webpack/Vite 中的 Node 核心模块丢失问题
async function loadMammoth(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if ((window as any).mammoth) return (window as any).mammoth;
  if (typeof document === 'undefined') return null;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
    script.onload = () => resolve((window as any).mammoth);
    script.onerror = () => reject(new Error('Failed to load mammoth'));
    document.head.appendChild(script);
  });
}

/**
 * 解析Word文档(.docx)并返回Node对象
 */
export async function parseWordDocument(
  file: File,
  fileName: string,
  baseX: number,
  baseY: number,
  index: number
): Promise<Node | null> {
  try {
    const mammoth = await loadMammoth();
    
    // 读取文件为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // 使用 mammoth 提取文本
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value || `[空文档] ${fileName}`;
    
    console.log(`[Word解析成功] ${fileName}: ${text.length} 字符`);
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      x: baseX + (index * 40),
      y: baseY + (index * 40),
      title: `📝 ${fileName}`,
      content: text,
      width: 320,
      height: 400
    };
  } catch (error) {
    console.error('Word解析失败:', error);
    // 降级方案
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      x: baseX + (index * 40),
      y: baseY + (index * 40),
      title: `📝 ${fileName} (解析失败)`,
      content: `文档名称: ${fileName}\n\n[提示] Word解析失败，请检查文件格式或网络连接。`,
      width: 280,
      height: 320
    };
  }
}

/**
 * 创建其他文档类型的信息节点
 */
export function createDocumentInfoNode(
  file: File,
  fileName: string,
  fileExtension: string,
  baseX: number,
  baseY: number,
  index: number
): Node {
  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
  const icons: Record<string, string> = {
    'doc': '📝',
    'xls': '📊',
    'xlsx': '📊',
    'ppt': '📽️',
    'pptx': '📽️',
    'pdf': '📕'
  };
  const icon = icons[fileExtension] || '📄';
  const fileInfo = `${icon} ${fileName}

📦 大小: ${fileSizeMB} MB
📅 类型: ${fileExtension.toUpperCase()}

💡 此文件暂不支持预览
如需查看，请使用对应软件打开`;
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    type: 'text',
    x: baseX + (index * 40),
    y: baseY + (index * 40),
    title: `${icon} ${fileName}`,
    content: fileInfo
  };
}
