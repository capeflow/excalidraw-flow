import React, { useEffect, useState } from 'react';
import { progressTracker, type ProgressState } from '@/lib/progressTracker';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Loader2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'completed': 'default',
      'in-progress': 'secondary',
      'error': 'destructive',
      'pending': 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="text-xs">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Animation Generation Progress</h3>
          {state.estimatedTimeRemaining !== undefined && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Est. {formatTime(state.estimatedTimeRemaining)} remaining</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium" aria-live="polite">{state.totalProgress}%</span>
          </div>
          <Progress 
            value={state.totalProgress} 
            className="h-3" 
            aria-label={`Overall progress: ${state.totalProgress}%`}
          />
        </div>
      </div>

      {state.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">Error:</span>
            <span className="break-words">{state.error}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Steps</h4>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {state.steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                step.status === 'in-progress' && "border-blue-500 bg-blue-50/50",
                step.status === 'completed' && "border-green-500/50 bg-green-50/30",
                step.status === 'error' && "border-red-500 bg-red-50/50",
                step.status === 'pending' && "border-gray-200 bg-gray-50/30"
              )}
              role="status"
              aria-label={`Step ${step.name}: ${step.status}`}
            >
              {getStepIcon(step.status)}
              
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{step.name}</span>
                  {getStatusBadge(step.status)}
                </div>
                
                {step.message && (
                  <p className="text-xs text-muted-foreground break-words">{step.message}</p>
                )}
                
                {step.status === 'in-progress' && (
                  <Progress 
                    value={step.progress} 
                    className="h-1.5" 
                    aria-label={`${step.name} progress: ${step.progress}%`}
                  />
                )}
                
                {step.duration && (
                  <p className="text-xs text-muted-foreground">
                    Completed in {(step.duration / 1000).toFixed(1)}s
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!state.isRunning && state.steps.every(s => s.status === 'completed') && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800" role="status">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">Success!</span>
            <span className="break-words">
              Animation generated in {formatTime(Math.round((Date.now() - (state.startTime || 0)) / 1000))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}; 