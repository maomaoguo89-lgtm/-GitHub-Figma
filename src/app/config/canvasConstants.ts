/**
 * Canvas 画布常量配置
 * 统一管理所有硬编码的魔法数字
 */

export const NODE_DIMENSIONS = {
  text: { width: 280, height: 308 },     // 标签28 + 内容280
  image: { width: 320, height: 228 },    // 标签28 + 内容200
  video: { width: 640, height: 388 },    // 标签28 + 内容360 (16:9默认)
  audio: { width: 640, height: 388 }     // 标签28 + 内容360
} as const;

export const PORT_CONFIG = {
  radius: 12,              // 端口圆圈半径
  snapDistance: 100,       // 连线吸附检测距离（增加容错）
  releaseDistance: 150,    // 松开鼠标时的吸附距离（更宽松）
  hoverRadius: 20,         // hover 检测范围
  strokeWidth: 2           // 端口边框宽度
} as const;

export const MINIMAP_CONFIG = {
  width: 240,
  height: 180,
  padding: 500,           // 边界 padding
  aspectRatio: 4 / 3      // 宽高比
} as const;

export const SELECTION_CONFIG = {
  boxBorderColor: 'rgba(59, 130, 246, 0.5)',
  boxFillColor: 'rgba(59, 130, 246, 0.1)',
  selectedBorderColor: 'rgb(59, 130, 246)',
  selectedBorderWidth: 2
} as const;

export const CANVAS_CONFIG = {
  worldSize: 4000,
  worldOffset: 2000,
  gridSize: 20,            // 网格大小
  minScale: 0.2,           // 最小缩放 20%
  maxScale: 2.2,           // 最大缩放 220%
  scaleStep: 0.1,          // 缩放步长
  smoothZoomFactor: 0.0008 // 平滑缩放系数（降低灵敏度）
} as const;

export const ANIMATION_CONFIG = {
  zoomToastDuration: 800,      // 缩放提示显示时长
  generateDelay: 2000,         // 生成内容模拟延迟
  minimapNavDuration: 600,     // 小地图导航动画时长（ms）
  minimapNavEasing: 'cubic-bezier(0.4, 0, 0.2, 1)' // 缓动函数
} as const;