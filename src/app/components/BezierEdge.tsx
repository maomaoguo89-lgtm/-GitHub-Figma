import React, { useState, useRef } from 'react';
import { Scissors } from 'lucide-react';

interface BezierEdgeProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  fromPort?: 'left' | 'right';
  toPort?: 'left' | 'right';
  isTemp?: boolean;
  onDelete?: () => void;
  onHoverChange?: (isHovered: boolean, edgeId: string) => void;
  edgeId: string; // 唯一标识
}

// 定义多种脉冲颜色
const PULSE_COLORS = [
  { main: '#3b82f6', gradient: 'rgba(59, 130, 246, 0.8)' },   // 蓝色
  { main: '#8b5cf6', gradient: 'rgba(139, 92, 246, 0.8)' },   // 紫色
  { main: '#ec4899', gradient: 'rgba(236, 72, 153, 0.8)' },   // 粉色
  { main: '#10b981', gradient: 'rgba(16, 185, 129, 0.8)' },   // 绿色
  { main: '#f59e0b', gradient: 'rgba(245, 158, 11, 0.8)' },   // 橙色
  { main: '#06b6d4', gradient: 'rgba(6, 182, 212, 0.8)' },    // 青色
  { main: '#f43f5e', gradient: 'rgba(244, 63, 94, 0.8)' },    // 红色
];

// 获取连线颜色的纯函数
const getPulseColor = (startX: number, startY: number, endX: number, endY: number) => {
  const sum = Math.abs(Math.round(startX + startY + endX + endY));
  const index = sum % PULSE_COLORS.length;
  return PULSE_COLORS[index];
};

export const BezierEdge = React.memo(({
  startX,
  startY,
  endX,
  endY,
  fromPort = 'right',
  toPort = 'left',
  isTemp = false,
  onDelete,
  onHoverChange,
  edgeId
}: BezierEdgeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showScissor, setShowScissor] = useState(false); // 延迟显示剪刀
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pulseColor = getPulseColor(startX, startY, endX, endY);

  // 计算两点之间的距离，用于动态调整曲线弯曲度
  const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
  const curvature = Math.max(150, distance * 0.4); // 至少150px，或距离的40%

  const cp1X = startX + (fromPort === 'right' ? curvature : -curvature);
  const cp1Y = startY;
  const cp2X = endX + (toPort === 'left' ? -curvature : curvature);
  const cp2Y = endY;

  const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

  // 计算贝塞尔曲线上的点
  const getPointOnCubicBezier = (t: number) => {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    
    return {
      x: startX * mt3 + 3 * cp1X * mt2 * t + 3 * cp2X * mt * t2 + endX * t3,
      y: startY * mt3 + 3 * cp1Y * mt2 * t + 3 * cp2Y * mt * t2 + endY * t3
    };
  };

  // 找到贝塞尔曲线上离鼠标最近的点
  const findClosestPointOnCurve = (mouseX: number, mouseY: number) => {
    let minDist = Infinity;
    let closestPoint = { x: mouseX, y: mouseY };
    
    // 采样曲线上的点，找到最近的
    for (let i = 0; i <= 50; i++) {
      const t = i / 50;
      const point = getPointOnCubicBezier(t);
      const dist = Math.sqrt(Math.pow(point.x - mouseX, 2) + Math.pow(point.y - mouseY, 2));
      
      if (dist < minDist) {
        minDist = dist;
        closestPoint = point;
      }
    }
    
    return closestPoint;
  };

  // Calculate midpoint for the delete button (fallback position)
  const midX = 0.125 * startX + 0.375 * cp1X + 0.375 * cp2X + 0.125 * endX;
  const midY = 0.125 * startY + 0.375 * cp1Y + 0.375 * cp2Y + 0.125 * endY;

  // 使用鼠标位置或默认中点
  const scissorX = mousePosition?.x ?? midX;
  const scissorY = mousePosition?.y ?? midY;

  // Generate unique ID for this edge's gradient and filter
  const gradientId = `pulse-gradient-${Math.round(startX)}-${Math.round(startY)}-${Math.round(endX)}-${Math.round(endY)}`;
  const glowId = `glow-${Math.round(startX)}-${Math.round(startY)}-${Math.round(endX)}-${Math.round(endY)}`;

  // 处理鼠标移动，追踪鼠标在连线上的位置
  const handleMouseMove = (e: React.MouseEvent<SVGGElement>) => {
    if (!isHovered) return;
    
    // 获取鼠标相对于 SVG 的坐标
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    // 找到贝塞尔曲线上最近的点
    const closestPoint = findClosestPointOnCurve(svgP.x, svgP.y);
    setMousePosition(closestPoint);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onHoverChange) {
      onHoverChange(true, edgeId);
    }
    // 延迟 400ms 显示剪刀，避免快速划过时闪现
    hoverTimerRef.current = setTimeout(() => {
      setShowScissor(true);
    }, 400);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition(null);
    if (onHoverChange) {
      onHoverChange(false, edgeId);
    }
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setShowScissor(false);
  };

  return (
    <g 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Define gradient for pulse effect */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(0, 0, 0, 0)" />
          <stop offset="50%" stopColor={pulseColor.gradient} />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          <animate
            attributeName="x1"
            values="-100%;100%"
            dur="2.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="x2"
            values="0%;200%"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </linearGradient>
        
        {/* Glow filter for pulse */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Invisible thicker path for easier hovering */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer pointer-events-auto"
      />
      
      {/* Base line */}
      <path
        d={pathData}
        fill="none"
        stroke={isTemp ? "rgba(255,255,255,0.4)" : (isHovered ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)")}
        strokeWidth={isTemp ? 2 : (isHovered ? 3 : 2)}
        strokeDasharray={isTemp ? "5,5" : "none"}
        style={{ transitionProperty: 'stroke, stroke-width', transitionDuration: '200ms' }}
        className="pointer-events-none"
      />

      {/* Pulse effect - only show on non-temp connections */}
      {!isTemp && (
        <>
          {/* Moving pulse */}
          <circle r="4" fill={pulseColor.main} filter={`url(#${glowId})`}>
            <animateMotion
              dur="2.5s"
              repeatCount="indefinite"
              path={pathData}
            />
            <animate
              attributeName="r"
              values="3;5;3"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Trail effect */}
          <path
            d={pathData}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="3"
            strokeLinecap="round"
            className="pointer-events-none"
            style={{ mixBlendMode: 'screen' }}
          />
        </>
      )}
      
      {!isTemp && isHovered && showScissor && onDelete && (
        <g 
          transform={`translate(${scissorX}, ${scissorY})`} 
          className="cursor-pointer pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <circle 
            r="16" 
            fill="#2a2a35" 
            stroke="rgba(255,255,255,0.3)" 
            strokeWidth="1.5"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))'
            }}
          />
          <foreignObject x="-11" y="-11" width="22" height="22" className="pointer-events-none">
            <div className="flex items-center justify-center w-full h-full text-white/80 hover:text-white transition-colors">
              <Scissors size={13} />
            </div>
          </foreignObject>
        </g>
      )}
    </g>
  );
});

BezierEdge.displayName = 'BezierEdge';