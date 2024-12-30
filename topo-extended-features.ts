// this is Claude generated code ostensibly showing how to use konva
// for extended (social?) features

// 1. Labels and Hover Effects
// TopoLabel.tsx
import { Text, Group, Tag, Label as KonvaLabel } from 'react-konva';
import type { KonvaEventObject } from 'konva/types/Node';

interface TopoLabelProps {
  x: number;
  y: number;
  text: string;
  rotation?: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const TopoLabel: React.FC<TopoLabelProps> = ({
  x, y, text, rotation = 0,
  isSelected = false,
  onSelect
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      draggable={isSelected}
    >
      <KonvaLabel>
        <Tag
          fill={isHovered ? '#f3f4f6' : '#ffffff'}
          opacity={0.8}
          cornerRadius={4}
        />
        <Text
          text={text}
          fontSize={16}
          padding={8}
          fill="#000000"
          fontStyle={isHovered ? 'bold' : 'normal'}
        />
      </KonvaLabel>
      {isSelected && <Transformer />}
    </Group>
  );
};

// HoverableRoute.tsx
interface HoverableRouteProps extends RouteProps {
  onHover?: (isHovered: boolean) => void;
  showGrade?: boolean;
}

export const HoverableRoute: React.FC<HoverableRouteProps> = ({
  points,
  style,
  onHover,
  showGrade,
  grade
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleHover = (hovered: boolean) => {
    setIsHovered(hovered);
    onHover?.(hovered);
  };

  return (
    <Group>
      <Line
        points={points}
        stroke={isHovered ? style.hoverColor || '#ff0000' : style.color}
        strokeWidth={isHovered ? style.lineWidth + 1 : style.lineWidth}
        onMouseEnter={() => handleHover(true)}
        onMouseLeave={() => handleHover(false)}
      />
      {(isHovered && showGrade && grade) && (
        <TopoLabel
          x={points[0]}
          y={points[1] - 20}
          text={grade}
        />
      )}
    </Group>
  );
};

// 2. Touch Device Support
// TouchHandler.tsx
interface TouchHandlerProps {
  children: React.ReactNode;
  onDragStart?: (e: KonvaEventObject<TouchEvent>) => void;
  onDragMove?: (e: KonvaEventObject<TouchEvent>) => void;
  onDragEnd?: (e: KonvaEventObject<TouchEvent>) => void;
  onPinchZoom?: (scale: number) => void;
}

export const TouchHandler: React.FC<TouchHandlerProps> = ({
  children,
  onDragStart,
  onDragMove,
  onDragEnd,
  onPinchZoom,
}) => {
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef<number>(0);

  const getDistance = (p1: Touch, p2: Touch) => {
    return Math.sqrt(Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2));
  };

  const handleTouchMove = (e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      // Handle pinch
      const dist = getDistance(touch1, touch2);
      const scale = dist / lastDist.current;
      onPinchZoom?.(scale);
      lastDist.current = dist;
    } else if (touch1) {
      // Handle drag
      onDragMove?.(e);
    }
  };

  return (
    <Group
      onTouchStart={(e) => {
        const touches = e.evt.touches;
        if (touches.length === 2) {
          lastDist.current = getDistance(touches[0], touches[1]);
        }
        onDragStart?.(e);
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={onDragEnd}
    >
      {children}
    </Group>
  );
};

// 3. State Management Integration
// topoStore.ts
import create from 'zustand';

interface TopoState {
  topo: Topo | null;
  selectedElement: string | null;
  hoveredElement: string | null;
  tool: 'select' | 'route' | 'protection' | 'label';
  isDrawing: boolean;
  currentPoints: number[];
  actions: {
    setTopo: (topo: Topo) => void;
    selectElement: (id: string | null) => void;
    setTool: (tool: TopoState['tool']) => void;
    startDrawing: () => void;
    addPoint: (x: number, y: number) => void;
    finishDrawing: () => void;
  };
}

export const useTopoStore = create<TopoState>((set, get) => ({
  topo: null,
  selectedElement: null,
  hoveredElement: null,
  tool: 'select',
  isDrawing: false,
  currentPoints: [],
  actions: {
    setTopo: (topo) => set({ topo }),
    selectElement: (id) => set({ selectedElement: id }),
    setTool: (tool) => set({ tool }),
    startDrawing: () => set({ isDrawing: true, currentPoints: [] }),
    addPoint: (x, y) => set((state) => ({
      currentPoints: [...state.currentPoints, x, y]
    })),
    finishDrawing: () => {
      const { topo, currentPoints } = get();
      if (!topo || currentPoints.length < 4) return;
      
      // Add new route to topo
      const newRoute: Route = {
        id: `route-${Date.now()}`,
        type: 'route',
        points: currentPoints,
        // ... other route properties
      };

      set({
        topo: {
          ...topo,
          elements: [...topo.elements, newRoute]
        },
        isDrawing: false,
        currentPoints: []
      });
    }
  }
}));

// 4. Save/Load Functionality
// topoStorage.ts
export interface TopoStorage {
  saveTopo: (topo: Topo) => Promise<void>;
  loadTopo: (id: string) => Promise<Topo>;
  listTopos: () => Promise<TopoSummary[]>;
}

interface TopoSummary {
  id: string;
  name: string;
  lastModified: Date;
}

export class LocalTopoStorage implements TopoStorage {
  async saveTopo(topo: Topo): Promise<void> {
    const topos = this.getStoredTopos();
    topos[topo.id] = {
      ...topo,
      lastModified: new Date()
    };
    localStorage.setItem('topos', JSON.stringify(topos));
  }

  async loadTopo(id: string): Promise<Topo> {
    const topos = this.getStoredTopos();
    const topo = topos[id];
    if (!topo) throw new Error(`Topo ${id} not found`);
    return topo;
  }

  async listTopos(): Promise<TopoSummary[]> {
    const topos = this.getStoredTopos();
    return Object.values(topos).map(topo => ({
      id: topo.id,
      name: topo.name,
      lastModified: new Date(topo.lastModified)
    }));
  }

  private getStoredTopos(): Record<string, Topo> {
    const stored = localStorage.getItem('topos');
    return stored ? JSON.parse(stored) : {};
  }
}

// API-based storage implementation
export class APITopoStorage implements TopoStorage {
  constructor(private baseUrl: string, private apiKey: string) {}

  async saveTopo(topo: Topo): Promise<void> {
    const response = await fetch(`${this.baseUrl}/topos/${topo.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(topo)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save topo: ${response.statusText}`);
    }
  }

  async loadTopo(id: string): Promise<Topo> {
    const response = await fetch(`${this.baseUrl}/topos/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load topo: ${response.statusText}`);
    }
    
    return response.json();
  }

  async listTopos(): Promise<TopoSummary[]> {
    const response = await fetch(`${this.baseUrl}/topos`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list topos: ${response.statusText}`);
    }
    
    return response.json();
  }
}
