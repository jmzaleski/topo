import React, { useState, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

// Define our topo data structure
const initialTopoState = {
  routes: [], // Array of {points: string, grade: string, name: string}
  protectionPoints: [], // Array of {x, y, type: 'bolt'|'anchor'|'belay'}
  labels: [], // Array of {x, y, text, angle}
  backgroundImage: null
};

const TopoEditor = () => {
  const [topoData, setTopoData] = useState(initialTopoState);
  const [currentTool, setCurrentTool] = useState('route');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  const svgRef = useRef(null);

  // Convert array of points to SVG path data
  const pointsToPath = (points) => {
    if (points.length < 2) return '';
    return `M ${points[0]} ${points[1]} ` + 
           points.slice(2).reduce((path, coord, i) => {
             return path + (i % 2 === 0 ? ` L ${coord}` : ` ${coord}`);
           }, '');
  };

  // Handle mouse events for drawing
  const handleMouseDown = (e) => {
    if (currentTool !== 'route') return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentPoints([x, y]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPoints([...currentPoints, x, y]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    if (currentPoints.length > 2) {
      setTopoData(prev => ({
        ...prev,
        routes: [...prev.routes, {
          points: pointsToPath(currentPoints),
          grade: '5.10a',
          name: 'New Route'
        }]
      }));
    }
    setCurrentPoints([]);
  };

  // Add protection point
  const handleClick = (e) => {
    if (currentTool !== 'protection') return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setTopoData(prev => ({
      ...prev,
      protectionPoints: [...prev.protectionPoints, {
        x,
        y,
        type: 'bolt'
      }]
    }));
  };

  // Handle background image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setTopoData(prev => ({
        ...prev,
        backgroundImage: event.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="flex gap-4 p-4 bg-gray-100">
        <button 
          className={`px-4 py-2 rounded ${currentTool === 'route' ? 'bg-blue-600' : 'bg-blue-400'} text-white`}
          onClick={() => setCurrentTool('route')}
        >
          Draw Route
        </button>
        <button 
          className={`px-4 py-2 rounded ${currentTool === 'protection' ? 'bg-blue-600' : 'bg-blue-400'} text-white`}
          onClick={() => setCurrentTool('protection')}
        >
          Add Protection
        </button>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <label 
          htmlFor="image-upload" 
          className="px-4 py-2 bg-gray-500 text-white rounded cursor-pointer"
        >
          Upload Background
        </label>
      </div>
      
      <svg
        ref={svgRef}
        width="800"
        height="600"
        className="border border-gray-300 bg-white"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      >
        {/* Background Image */}
        {topoData.backgroundImage && (
          <image
            href={topoData.backgroundImage}
            width="800"
            height="600"
            opacity="0.5"
          />
        )}
        
        {/* Routes */}
        {topoData.routes.map((route, i) => (
          <path
            key={i}
            d={route.points}
            stroke="#FF0000"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        
        {/* Current Drawing Path */}
        {isDrawing && currentPoints.length >= 2 && (
          <path
            d={pointsToPath(currentPoints)}
            stroke="#FF0000"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* Protection Points */}
        {topoData.protectionPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="6"
            fill="#000000"
          />
        ))}
      </svg>
    </div>
  );
};

export default TopoEditor;