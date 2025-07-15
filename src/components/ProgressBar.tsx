import React, { useEffect, useState } from 'react';
import { progressTracker, type ProgressState, type ProgressStep } from '@/lib/progressTracker';
import { CheckCircle2, Circle, Loader2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Excalidraw-style colors
const STEP_COLORS = [
  { bg: '#ff6b6b', fg: '#ffffff', border: '#e63946' }, // Red
  { bg: '#4ecdc4', fg: '#ffffff', border: '#38a3a5' }, // Teal
  { bg: '#45b7d1', fg: '#ffffff', border: '#2196f3' }, // Blue
  { bg: '#f7dc6f', fg: '#333333', border: '#f1c40f' }, // Yellow
  { bg: '#bb8fce', fg: '#ffffff', border: '#9b59b6' }, // Purple
  { bg: '#82c91e', fg: '#ffffff', border: '#5cb85c' }, // Green
];

// Default steps to show in baseline mode
const DEFAULT_STEPS: ProgressStep[] = [
  { id: 'parse', name: 'Parse Excalidraw File', status: 'pending', progress: 0 },
  { id: 'convert', name: 'Convert to SVG', status: 'pending', progress: 0 },
  { id: 'render', name: 'Render Animation Frames', status: 'pending', progress: 0 },
  { id: 'encode', name: 'Encode GIF', status: 'pending', progress: 0 },
];

interface ProgressBarProps {
  compact?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ compact = false }) => {
  const [state, setState] = useState<ProgressState>(progressTracker.getState());

  useEffect(() => {
    const unsubscribe = progressTracker.subscribe(setState);
    return unsubscribe;
  }, []);

  const isBaseline = !state.isRunning && state.steps.length === 0;
  const stepsToShow = isBaseline ? DEFAULT_STEPS : state.steps;
  const totalProgress = isBaseline ? 0 : state.totalProgress;

  const formatTime = (seconds: number | undefined) => {
    if (seconds === undefined) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "bg-white rounded-xl shadow-lg border-2 border-gray-900 space-y-4",
      compact ? "p-4" : "p-6 space-y-6",
      isBaseline && "opacity-60"
    )} 
         style={{ 
           fontFamily: 'Excalifont, system-ui, sans-serif',
           boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.15)'
         }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={cn(
          "font-bold text-gray-900 tracking-tight",
          compact ? "text-lg" : "text-2xl"
        )}>
          {isBaseline ? "Animation Generation Ready" : "Animation Generation Progress"}
        </h3>
        {!isBaseline && state.estimatedTimeRemaining !== undefined && (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Est. {formatTime(state.estimatedTimeRemaining)} remaining</span>
          </div>
        )}
      </div>

      {/* Overall Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={cn(
            "font-semibold text-gray-700",
            compact ? "text-base" : "text-lg"
          )}>Overall Progress</span>
          <span className={cn(
            "font-bold text-gray-900",
            compact ? "text-xl" : "text-2xl"
          )}>{totalProgress}%</span>
        </div>
        
        {/* Main progress bar */}
        <div className={cn(
          "relative bg-gray-100 rounded-lg border-2 border-gray-900 overflow-hidden",
          compact ? "h-8" : "h-10"
        )}
             style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}>
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ 
              width: `${totalProgress}%`,
              boxShadow: 'inset 0 -2px 4px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="absolute inset-0 bg-white opacity-20"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "font-bold text-gray-900 drop-shadow-sm",
              compact ? "text-sm" : "text-base"
            )}>
              {totalProgress}%
            </span>
          </div>
        </div>
      </div>

      {/* Individual Step Bars */}
      <div className="space-y-3">
        <h4 className={cn(
          "font-semibold text-gray-700",
          compact ? "text-base" : "text-lg"
        )}>Steps</h4>
        <div className="space-y-2">
          {stepsToShow.map((step, index) => {
            const color = STEP_COLORS[index % STEP_COLORS.length];
            const isActive = !isBaseline && step.status === 'in-progress';
            const isCompleted = !isBaseline && step.status === 'completed';
            const isError = !isBaseline && step.status === 'error';
            
            return (
              <div key={step.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Status Icon */}
                    <div className={cn(
                      "rounded-lg border-2 border-gray-900 flex items-center justify-center transition-all",
                      compact ? "w-6 h-6" : "w-8 h-8",
                      isCompleted && "bg-green-500",
                      isActive && "bg-yellow-400",
                      isError && "bg-red-500",
                      (isBaseline || (!isCompleted && !isActive && !isError)) && "bg-gray-200"
                    )}
                    style={{ boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.15)' }}>
                      {isCompleted && <CheckCircle2 className={cn("text-white", compact ? "h-4 w-4" : "h-5 w-5")} />}
                      {isActive && <Loader2 className={cn("text-gray-900 animate-spin", compact ? "h-4 w-4" : "h-5 w-5")} />}
                      {isError && <XCircle className={cn("text-white", compact ? "h-4 w-4" : "h-5 w-5")} />}
                      {(isBaseline || (!isCompleted && !isActive && !isError)) && <Circle className={cn("text-gray-400", compact ? "h-4 w-4" : "h-5 w-5")} />}
                    </div>
                    
                    <span className={cn(
                      "font-semibold text-gray-900",
                      compact ? "text-sm" : "text-base"
                    )}>{step.name}</span>
                  </div>
                  
                  {/* Duration */}
                  {!isBaseline && step.duration && (
                    <span className="text-sm text-gray-600 font-medium">
                      {(step.duration / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className={cn(compact ? "ml-9" : "ml-11")}>
                  <div 
                    className={cn(
                      "relative rounded-lg border-2 border-gray-900 overflow-hidden",
                      compact ? "h-6" : "h-8"
                    )}
                    style={{ 
                      backgroundColor: color.bg + '20',
                      boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    <div 
                      className="absolute inset-y-0 left-0 transition-all duration-300 ease-out"
                      style={{ 
                        width: `${step.progress}%`,
                        backgroundColor: color.bg,
                        boxShadow: 'inset 0 -2px 4px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      {/* Animated stripes for active steps */}
                      {isActive && (
                        <div className="absolute inset-0 opacity-30"
                             style={{
                               backgroundImage: `repeating-linear-gradient(
                                 45deg,
                                 transparent,
                                 transparent 10px,
                                 rgba(255, 255, 255, 0.5) 10px,
                                 rgba(255, 255, 255, 0.5) 20px
                               )`,
                               animation: 'slide 1s linear infinite',
                             }}
                        />
                      )}
                    </div>
                    
                    {/* Progress text */}
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className={cn(
                        "font-bold",
                        compact ? "text-xs" : "text-sm"
                      )} style={{ color: step.progress > 50 ? color.fg : '#333' }}>
                        {step.progress}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Status message */}
                  {!isBaseline && step.message && (
                    <p className="text-sm text-gray-600 mt-1">{step.message}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error State */}
      {!isBaseline && state.error && (
        <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4" 
             style={{ boxShadow: '2px 2px 0px rgba(220, 38, 38, 0.3)' }}>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="font-semibold text-red-800">Error:</span>
            <span className="text-red-700">{state.error}</span>
          </div>
        </div>
      )}

      {/* Success State */}
      {!isBaseline && !state.isRunning && state.steps.every(s => s.status === 'completed') && (
        <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4"
             style={{ boxShadow: '2px 2px 0px rgba(34, 197, 94, 0.3)' }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-800">Success!</span>
            <span className="text-green-700">
              Animation generated in {formatTime(Math.round((Date.now() - (state.startTime || 0)) / 1000))}
            </span>
          </div>
        </div>
      )}

      {/* Baseline hint */}
      {isBaseline && (
        <div className="text-center">
          <p className="text-sm text-gray-500 italic">
            Upload an Excalidraw file to begin animation generation
          </p>
        </div>
      )}
    </div>
  );
}; 