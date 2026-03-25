import React, { useMemo } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { TextCanvasNode } from './TextCanvasNode';
import { ImageCanvasNode } from './ImageCanvasNode';
import { VideoCanvasNode } from './VideoCanvasNode';
import { AudioCanvasNode } from './AudioCanvasNode';
import { Node } from '../store/canvasStore';

interface VirtualNodesLayerProps {
  windowSize: { width: number; height: number };
  selectedNodes: string[];
  generatingNodes: Record<string, boolean>;
  handleNodePointerDown: (e: React.PointerEvent, node: Node) => void;
  handleSettingsClick: (e: React.MouseEvent, id: string) => void;
  handlePortPointerDown: (e: React.PointerEvent, nodeId: string, port: 'left' | 'right') => void;
  handlePortPointerUp: (e: React.PointerEvent, nodeId: string, port: 'left' | 'right') => void;
}

export const VirtualNodesLayer: React.FC<VirtualNodesLayerProps> = React.memo(({
  windowSize,
  selectedNodes,
  generatingNodes,
  handleNodePointerDown,
  handleSettingsClick,
  handlePortPointerDown,
  handlePortPointerUp
}) => {
  const nodes = useCanvasStore((state) => state.nodes);
  const connections = useCanvasStore((state) => state.connections);
  const viewState = useCanvasStore((state) => state.viewState);

  // Compute which ports are connected
  const connectedPorts = useMemo(() => {
    const ports: Record<string, { left: number; right: number; leftNodeIds: string[]; rightNodeIds: string[] }> = {};
    for (const conn of connections) {
      if (!ports[conn.from]) ports[conn.from] = { left: 0, right: 0, leftNodeIds: [], rightNodeIds: [] };
      if (!ports[conn.to]) ports[conn.to] = { left: 0, right: 0, leftNodeIds: [], rightNodeIds: [] };
      
      ports[conn.from].right++;
      ports[conn.from].rightNodeIds.push(conn.to);
      ports[conn.to].left++;
      ports[conn.to].leftNodeIds.push(conn.from);
    }
    return ports;
  }, [connections]);

  // Compute connected source nodes for each node
  const connectedSourceNodesMap = useMemo(() => {
    const map: Record<string, Node[]> = {};
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    for (const conn of connections) {
      if (!map[conn.to]) map[conn.to] = [];
      const sourceNode = nodeMap.get(conn.from);
      if (sourceNode) {
        map[conn.to].push(sourceNode);
      }
    }
    return map;
  }, [connections, nodes]);

  // Viewport culling
  const visibleNodes = useMemo(() => {
    const { x, y, scale } = viewState;
    const viewportLeft = -x / scale;
    const viewportTop = -y / scale;
    const viewportRight = viewportLeft + windowSize.width / scale;
    const viewportBottom = viewportTop + windowSize.height / scale;

    return nodes.filter(node => {
      // Assuming a max node size of 800x800 for culling safety
      const nodeRight = node.x + 800;
      const nodeBottom = node.y + 800;
      
      return (
        nodeRight >= viewportLeft &&
        node.x <= viewportRight &&
        nodeBottom >= viewportTop &&
        node.y <= viewportBottom
      );
    });
  }, [nodes, viewState, windowSize]);

  // Use a Set for optimized lookup
  const selectedNodesSet = useMemo(() => new Set(selectedNodes), [selectedNodes]);

  return (
    <>
      {visibleNodes.map(node => {
        const commonProps = {
          node,
          isSelected: selectedNodesSet.has(node.id),
          isGenerating: !!generatingNodes[node.id],
          onPointerDown: handleNodePointerDown,
          onSettingsClick: handleSettingsClick,
          onPortPointerDown: handlePortPointerDown,
          onPortPointerUp: handlePortPointerUp,
          hasLeftConnection: connectedPorts[node.id]?.left || false,
          hasRightConnection: connectedPorts[node.id]?.right || false,
          connectedSourceNodes: connectedSourceNodesMap[node.id] || [],
          isSingleSelection: selectedNodes.length === 1 && selectedNodesSet.has(node.id)
        };
        
        if (node.type === 'text') return <TextCanvasNode key={node.id} {...commonProps} />;
        if (node.type === 'image') return <ImageCanvasNode key={node.id} {...commonProps} />;
        if (node.type === 'video') return <VideoCanvasNode key={node.id} {...commonProps} />;
        if (node.type === 'audio') return <AudioCanvasNode key={node.id} {...commonProps} />;
        
        return null;
      })}
    </>
  );
});

VirtualNodesLayer.displayName = 'VirtualNodesLayer';