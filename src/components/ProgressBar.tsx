import React, { useEffect, useState } from 'react';
import { progressTracker, type ProgressState } from '@/lib/progressTracker';
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

export const ProgressBar: React.FC = () => {
  const [state, setState] = useState<ProgressState>(progressTracker.getState());

  useEffect(() => {
    const unsubscribe = progressTracker.subscribe(setState);
    return unsubscribe;
  }, []);

  if (!state.isRunning && state.steps.length === 0) {
    return null;
  }

  const formatTime = (seconds: number | undefined) => {
    if (seconds === undefined) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-900 p-6 space-y-6" 
         style={{ 
           fontFamily: 'Excalifont, system-ui, sans-serif',
           boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.15)'
         }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
          Animation Generation Progress
        </h3>
        {state.estimatedTimeRemaining !== undefined && (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Est. {formatTime(state.estimatedTimeRemaining)} remaining</span>
          </div>
        )}
      </div>

      {/* Overall Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-700">Overall Progress</span>
          <span className="text-2xl font-bold text-gray-900">{state.totalProgress}%</span>
        </div>
        
        {/* Main progress bar */}
        <div className="relative h-10 bg-gray-100 rounded-lg border-2 border-gray-900 overflow-hidden"
             style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}>
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ 
              width: `${state.totalProgress}%`,
              boxShadow: 'inset 0 -2px 4px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="absolute inset-0 bg-white opacity-20"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-bold text-gray-900 drop-shadow-sm">
              {state.totalProgress}%
            </span>
          </div>
        </div>
      </div>

      {/* Individual Step Bars */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-700">Steps</h4>
        <div className="space-y-3">
          {state.steps.map((step, index) => {
            const color = STEP_COLORS[index % STEP_COLORS.length];
            const isActive = step.status === 'in-progress';
            const isCompleted = step.status === 'completed';
            const isError = step.status === 'error';
            
            return (
              <div key={step.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Status Icon */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg border-2 border-gray-900 flex items-center justify-center transition-all",
                      isCompleted && "bg-green-500",
                      isActive && "bg-yellow-400",
                      isError && "bg-red-500",
                      !isCompleted && !isActive && !isError && "bg-gray-200"
                    )}
                    style={{ boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.15)' }}>
                      {isCompleted && <CheckCircle2 className="h-5 w-5 text-white" />}
                      {isActive && <Loader2 className="h-5 w-5 text-gray-900 animate-spin" />}
                      {isError && <XCircle className="h-5 w-5 text-white" />}
                      {!isCompleted && !isActive && !isError && <Circle className="h-5 w-5 text-gray-400" />}
                    </div>
                    
                    <span className="font-semibold text-gray-900">{step.name}</span>
                  </div>
                  
                  {/* Duration */}
                  {step.duration && (
                    <span className="text-sm text-gray-600 font-medium">
                      {(step.duration / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="ml-11">
                  <div 
                    className="relative h-8 rounded-lg border-2 border-gray-900 overflow-hidden"
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
                      <span className="text-sm font-bold" style={{ color: step.progress > 50 ? color.fg : '#333' }}>
                        {step.progress}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Status message */}
                  {step.message && (
                    <p className="text-sm text-gray-600 mt-1">{step.message}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error State */}
      {state.error && (
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
      {!state.isRunning && state.steps.every(s => s.status === 'completed') && (
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


    </div>
  );
}; 