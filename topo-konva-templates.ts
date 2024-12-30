// Main Stage Component
// TopoStage.tsx
import React from 'react';
import { Stage, Layer, Image } from 'react-konva';
import type { KonvaEventObject } from 'konva/types/Node';
import useImage from 'use-image';  // Helpful utility for Konva images

interface TopoStageProps {
  width: number;
  height: number;
  backgroundUrl?: string;
  onSelect: (elementId: string | null) => void;
}

export const TopoStage: React.FC<TopoStageProps> = ({
  width,
  height,
  backgroundUrl,
  onSelect,
}) => {
  // Background image loading
  const [image] = useImage(backgroundUrl || '');
  
  // Stage event handlers
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    const clickedOn = e.target;
    if (clickedOn === e.target.getStage()) {
      // Clicked empty stage - deselect
      onSelect(null);
    }
  };

  return (
    <Stage width={width} height={height} onClick={handleClick}>
      {/* Background Layer */}
      <Layer>
        {image && (
          <Image
            image={image}
            width={width}
            height={height}
            opacity={0.5}
          />
        )}
      </Layer>
      
      {/* Routes Layer */}
      <RoutesLayer />
      
      {/* Protection Points Layer */}
      <ProtectionLayer />
      
      {/* Labels Layer */}
      <LabelsLayer />
      
      {/* Temporary Drawing Layer */}
      <DrawingLayer />
    </Stage>
  );
};

// Route Drawing Layer
// RoutesLayer.tsx
interface RoutesLayerProps {
  routes: Route[];
  isDrawing: boolean;
  currentPoints: number[];
  onRouteClick: (routeId: string) => void;
}

export const RoutesLayer: React.FC<RoutesLayerProps> = ({
  routes,
  isDrawing,
  currentPoints,
  onRouteClick,
}) => {
  return (
    <Layer>
      {/* Existing Routes */}
      {routes.map((route) => (
        <Line
          key={route.id}
          points={route.points}
          stroke={route.style.color}
          strokeWidth={route.style.lineWidth}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          onClick={() => onRouteClick(route.id)}
          onTap={() => onRouteClick(route.id)}
        />
      ))}
      
      {/* Currently Drawing Route */}
      {isDrawing && currentPoints.length >= 2 && (
        <Line
          points={currentPoints}
          stroke="#ff0000"
          strokeWidth={3}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
        />
      )}
    </Layer>
  );
};

// Route Drawing Hook
// useRouteDrawing.ts
interface UseRouteDrawingProps {
  onRouteComplete: (points: number[]) => void;
}

export const useRouteDrawing = ({ onRouteComplete }: UseRouteDrawingProps) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<number[]>([]);

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    
    setIsDrawing(true);
    setPoints([pos.x, pos.y]);
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return;
    
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    
    setPoints([...points, pos.x, pos.y]);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (points.length >= 4) {
      onRouteComplete(points);
    }
    setPoints([]);
  };

  return {
    isDrawing,
    points,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
    },
  };
};

// Protection Points Layer
// ProtectionLayer.tsx
interface ProtectionLayerProps {
  points: Protection[];
  onPointClick: (pointId: string) => void;
}

export const ProtectionLayer: React.FC<ProtectionLayerProps> = ({
  points,
  onPointClick,
}) => {
  // Protection point symbols
  const symbolForType = (type: Protection['protectionType']) => {
    switch (type) {
      case 'bolt':
        return <Circle radius={6} fill="#000" />;
      case 'anchor':
        return <RegularPolygon sides={3} radius={8} fill="#f00" />;
      case 'belay':
        return <RegularPolygon sides={4} radius={8} fill="#00f" />;
      default:
        return <Circle radius={6} fill="#666" />;
    }
  };

  return (
    <Layer>
      {points.map((point) => (
        <Group
          key={point.id}
          x={point.position.x}
          y={point.position.y}
          onClick={() => onPointClick(point.id)}
          onTap={() => onPointClick(point.id)}
        >
          {symbolForType(point.protectionType)}
        </Group>
      ))}
    </Layer>
  );
};

// Selection and Transform Wrapper
// SelectableElement.tsx
interface SelectableElementProps {
  isSelected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}

export const SelectableElement: React.FC<SelectableElementProps> = ({
  isSelected,
  onSelect,
  children,
}) => {
  return (
    <Group
      onClick={onSelect}
      onTap={onSelect}
    >
      {children}
      {isSelected && (
        <Transformer
          boundBoxFunc={(oldBox, newBox) => {
            // Constrain transformations as needed
            return newBox;
          }}
        />
      )}
    </Group>
  );
};
