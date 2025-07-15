import React from 'react';
import { Card } from './ui/card';
import { applySpeedCurve, SPEED_CONFIG } from '@/lib/animationSpeed';

interface SpeedCurveVisualizerProps {
  currentSpeed: number;
}

export const SpeedCurveVisualizer: React.FC<SpeedCurveVisualizerProps> = ({ currentSpeed }) => {
  const width = 200;
  const height = 100;
  const padding = 10;
  
  // Generate curve points
  const points: [number, number][] = [];
  const steps = 50;
  
  for (let i = 0; i <= steps; i++) {
    const normalized = i / steps;
    const curved = applySpeedCurve(normalized, SPEED_CONFIG.curve);
    const speed = SPEED_CONFIG.min + (curved * (SPEED_CONFIG.max - SPEED_CONFIG.min));
    
    const x = padding + (normalized * (width - 2 * padding));
    const y = height - padding - (speed / SPEED_CONFIG.max) * (height - 2 * padding);
    
    points.push([x, y]);
  }
  
  // Create SVG path
  const pathData = points
    .map((point, index) => {
      const [x, y] = point;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');
  
  // Calculate current position
  const normalizedSpeed = (currentSpeed - SPEED_CONFIG.min) / (SPEED_CONFIG.max - SPEED_CONFIG.min);
  
  // Find the slider position for current speed (reverse the curve)
  let sliderNormalized: number;
  switch (SPEED_CONFIG.curve) {
    case 'exponential':
      sliderNormalized = Math.pow(normalizedSpeed, 1 / 3.0);
      break;
    case 'logarithmic':
      sliderNormalized = (Math.pow(10, normalizedSpeed) - 1) / 9;
      break;
    case 'ease-in-out':
      sliderNormalized = Math.acos(1 - 2 * normalizedSpeed) / Math.PI;
      break;
    default:
      sliderNormalized = normalizedSpeed;
  }
  
  const currentX = padding + (sliderNormalized * (width - 2 * padding));
  const currentY = height - padding - (normalizedSpeed * (height - 2 * padding));
  
  return (
    <Card className="p-4">
      <h4 className="text-sm font-medium mb-2">Speed Curve ({SPEED_CONFIG.curve})</h4>
      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        
        {/* Curve */}
        <path
          d={pathData}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        
        {/* Current position */}
        <circle
          cx={currentX}
          cy={currentY}
          r="4"
          fill="#3b82f6"
        />
        
        {/* Labels */}
        <text x={padding} y={height - 2} fontSize="10" fill="#6b7280">
          0%
        </text>
        <text x={width - padding - 20} y={height - 2} fontSize="10" fill="#6b7280">
          100%
        </text>
        <text x={2} y={height - padding + 3} fontSize="10" fill="#6b7280">
          {SPEED_CONFIG.min}×
        </text>
        <text x={2} y={padding + 3} fontSize="10" fill="#6b7280">
          {SPEED_CONFIG.max}×
        </text>
      </svg>
      <p className="text-xs text-muted-foreground mt-2">
        The {SPEED_CONFIG.curve} curve provides fine control at lower speeds
        and rapid acceleration at higher speeds.
      </p>
    </Card>
  );
}; 