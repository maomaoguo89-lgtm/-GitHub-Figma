import { Node } from '../store/canvasStore';
import { NODE_DIMENSIONS } from '../config/canvasConstants';

/**
 * 获取节点尺寸
 */
export const getNodeDimensions = (nodeType: Node['type']) => {
  return NODE_DIMENSIONS[nodeType];
};

/**
 * 获取节点宽度
 */
export const getNodeWidth = (nodeType: Node['type']) => {
  return NODE_DIMENSIONS[nodeType].width;
};

/**
 * 获取节点高度
 */
export const getNodeHeight = (nodeType: Node['type']) => {
  return NODE_DIMENSIONS[nodeType].height;
};

/**
 * 获取节点边界框
 */
export const getNodeBounds = (node: Node) => {
  const { width, height } = getNodeDimensions(node.type);
  return {
    x: node.x,
    y: node.y,
    width,
    height,
    right: node.x + width,
    bottom: node.y + height
  };
};

/**
 * 检查点是否在节点内
 */
export const isPointInNode = (x: number, y: number, node: Node, padding = 0) => {
  const { width, height } = getNodeDimensions(node.type);
  return (
    x >= node.x - padding &&
    x <= node.x + width + padding &&
    y >= node.y - padding &&
    y <= node.y + height + padding
  );
};

/**
 * 检查矩形是否与节点相交
 */
export const isRectIntersectNode = (
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number,
  node: Node
) => {
  const { width, height } = getNodeDimensions(node.type);
  return !(
    node.x + width < rectX ||
    node.x > rectX + rectWidth ||
    node.y + height < rectY ||
    node.y > rectY + rectHeight
  );
};
