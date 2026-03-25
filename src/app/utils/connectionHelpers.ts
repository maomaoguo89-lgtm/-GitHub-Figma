import { Connection } from '../store/canvasStore';

/**
 * 规范化连线方向
 * 确保连线总是从右端口指向左端口
 */
export const normalizeConnection = (
  fromNodeId: string,
  toNodeId: string,
  fromPort: 'left' | 'right',
  toPort: 'left' | 'right'
): { from: string; to: string } => {
  // 如果从左端口拖到右端口，反转方向
  if (fromPort === 'left' && toPort === 'right') {
    return { from: toNodeId, to: fromNodeId };
  }
  
  // 如果从右端口拖到左端口，保持方向
  if (fromPort === 'right' && toPort === 'left') {
    return { from: fromNodeId, to: toNodeId };
  }
  
  // 默认保持原方向
  return { from: fromNodeId, to: toNodeId };
};

/**
 * 检查连线是否已存在（包括反向）
 */
export const isConnectionExists = (
  connections: Connection[],
  fromNodeId: string,
  toNodeId: string
): boolean => {
  return connections.some(
    (conn) =>
      (conn.from === fromNodeId && conn.to === toNodeId) ||
      (conn.from === toNodeId && conn.to === fromNodeId)
  );
};

/**
 * 检查是否可以创建连线
 */
export const canCreateConnection = (
  fromPort: 'left' | 'right',
  toPort: 'left' | 'right'
): boolean => {
  // 不能连接相同类型的端口
  return fromPort !== toPort;
};

/**
 * 获取连线的目标端口类型
 */
export const getTargetPortType = (sourcePort: 'left' | 'right'): 'left' | 'right' => {
  return sourcePort === 'left' ? 'right' : 'left';
};
