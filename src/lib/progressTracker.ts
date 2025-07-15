import { logger } from './logger';

export interface ProgressStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  progress: number; // 0-100
  message?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

export interface ProgressState {
  totalProgress: number;
  currentStep: string;
  steps: ProgressStep[];
  isRunning: boolean;
  error?: string;
  startTime?: number;
  estimatedTimeRemaining?: number;
}

type ProgressListener = (state: ProgressState) => void;

class ProgressTracker {
  private static instance: ProgressTracker;
  private listeners: Set<ProgressListener> = new Set();
  private state: ProgressState = {
    totalProgress: 0,
    currentStep: '',
    steps: [],
    isRunning: false
  };

  private constructor() {}

  static getInstance(): ProgressTracker {
    if (!ProgressTracker.instance) {
      ProgressTracker.instance = new ProgressTracker();
    }
    return ProgressTracker.instance;
  }

  private notify() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  private calculateTotalProgress() {
    if (this.state.steps.length === 0) return 0;
    
    const totalWeight = this.state.steps.length;
    const completedWeight = this.state.steps.reduce((sum, step) => {
      return sum + (step.progress / 100);
    }, 0);
    
    return Math.round((completedWeight / totalWeight) * 100);
  }

  private estimateTimeRemaining(): number | undefined {
    if (!this.state.startTime || this.state.totalProgress === 0) return undefined;
    
    const elapsedTime = Date.now() - this.state.startTime;
    const estimatedTotalTime = (elapsedTime / this.state.totalProgress) * 100;
    const remainingTime = estimatedTotalTime - elapsedTime;
    
    return Math.max(0, Math.round(remainingTime / 1000)); // in seconds
  }

  subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    // Send current state immediately
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  startProcess(steps: { id: string; name: string }[]) {
    logger.info('Starting process', { steps: steps.map(s => s.name) }, 'ProgressTracker');
    
    this.state = {
      totalProgress: 0,
      currentStep: steps[0]?.id || '',
      steps: steps.map(step => ({
        ...step,
        status: 'pending',
        progress: 0
      })),
      isRunning: true,
      startTime: Date.now()
    };
    
    this.notify();
  }

  updateStep(stepId: string, updates: Partial<ProgressStep>) {
    const stepIndex = this.state.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) {
      logger.error(`Step not found: ${stepId}`, undefined, 'ProgressTracker');
      return;
    }

    const step = this.state.steps[stepIndex];
    const wasInProgress = step.status === 'in-progress';
    
    // Update step
    this.state.steps[stepIndex] = {
      ...step,
      ...updates,
      startTime: !wasInProgress && updates.status === 'in-progress' ? Date.now() : step.startTime,
      endTime: updates.status === 'completed' || updates.status === 'error' ? Date.now() : step.endTime
    };

    // Calculate duration if completed
    if (this.state.steps[stepIndex].startTime && this.state.steps[stepIndex].endTime) {
      this.state.steps[stepIndex].duration = 
        this.state.steps[stepIndex].endTime! - this.state.steps[stepIndex].startTime!;
    }

    // Update current step
    if (updates.status === 'in-progress') {
      this.state.currentStep = stepId;
    }

    // Log the update
    logger.info(
      `Step ${step.name}: ${updates.status || step.status}`,
      { 
        progress: updates.progress ?? step.progress,
        message: updates.message,
        duration: this.state.steps[stepIndex].duration
      },
      'ProgressTracker'
    );

    // Update total progress and time estimate
    this.state.totalProgress = this.calculateTotalProgress();
    this.state.estimatedTimeRemaining = this.estimateTimeRemaining();

    // Check if all steps are completed
    const allCompleted = this.state.steps.every(s => s.status === 'completed');
    if (allCompleted) {
      this.state.isRunning = false;
      logger.info('Process completed', {
        totalDuration: Date.now() - (this.state.startTime || 0),
        steps: this.state.steps.length
      }, 'ProgressTracker');
    }

    this.notify();
  }

  setError(error: string, stepId?: string) {
    logger.error('Process error', { error, stepId }, 'ProgressTracker');
    
    this.state.error = error;
    this.state.isRunning = false;
    
    if (stepId) {
      this.updateStep(stepId, { status: 'error', message: error });
    }
    
    this.notify();
  }

  reset() {
    logger.info('Resetting progress tracker', undefined, 'ProgressTracker');
    
    this.state = {
      totalProgress: 0,
      currentStep: '',
      steps: [],
      isRunning: false
    };
    
    this.notify();
  }

  getState(): ProgressState {
    return { ...this.state };
  }
}

export const progressTracker = ProgressTracker.getInstance(); 