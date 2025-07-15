import { logger } from './logger';

export interface SpeedPreset {
  id: string;
  name: string;
  value: number;
  duration: number; // in seconds
  description: string;
  icon?: string;
}

export interface SpeedConfig {
  min: number;
  max: number;
  default: number;
  curve: 'linear' | 'exponential' | 'logarithmic' | 'ease-in-out';
  baseDuration: number; // base duration in seconds at 1x speed
}

// Speed presets based on common use cases - retuned for faster animations
export const SPEED_PRESETS: SpeedPreset[] = [
  {
    id: 'cinematic',
    name: 'Cinematic',
    value: 0.5,
    duration: 1.0,
    description: 'Slow, dramatic reveal',
    icon: '🎬'
  },
  {
    id: 'smooth',
    name: 'Smooth',
    value: 1.0,
    duration: 0.5,
    description: 'Gentle, easy to follow',
    icon: '🌊'
  },
  {
    id: 'normal',
    name: 'Normal',
    value: 2.0,
    duration: 0.25,
    description: 'Standard speed',
    icon: '▶️'
  },
  {
    id: 'quick',
    name: 'Quick',
    value: 4.0,
    duration: 0.125,
    description: 'Fast but visible',
    icon: '⚡'
  },
  {
    id: 'rapid',
    name: 'Rapid',
    value: 8.0,
    duration: 0.0625,
    description: 'Very fast animation',
    icon: '🚀'
  },
  {
    id: 'instant',
    name: 'Instant',
    value: 20.0,
    duration: 0.025,
    description: 'Near-instant reveal',
    icon: '💥'
  }
];

export const SPEED_CONFIG: SpeedConfig = {
  min: 0.25,
  max: 50.0,
  default: 2.0,
  curve: 'exponential',
  baseDuration: 0.5 // Much faster base duration - 500ms at 1x
};

/**
 * Apply a curve function to the speed value for more organic control
 */
export function applySpeedCurve(
  normalizedValue: number, // 0-1
  curve: SpeedConfig['curve'] = 'exponential'
): number {
  switch (curve) {
    case 'linear':
      return normalizedValue;
    
    case 'exponential':
      // Exponential curve for more granular control at lower speeds
      // and faster ramp-up at higher speeds
      return Math.pow(normalizedValue, 3.0); // Increased exponent for more dramatic curve
    
    case 'logarithmic':
      // Logarithmic curve for more control at higher speeds
      return Math.log10(normalizedValue * 9 + 1);
    
    case 'ease-in-out':
      // Smooth ease-in-out curve using cosine
      return (1 - Math.cos(normalizedValue * Math.PI)) / 2;
    
    default:
      return normalizedValue;
  }
}

/**
 * Convert a slider position (0-100) to actual speed multiplier
 */
export function sliderToSpeed(sliderValue: number): number {
  const normalized = sliderValue / 100;
  const curved = applySpeedCurve(normalized, SPEED_CONFIG.curve);
  
  // Map curved value to speed range
  const speed = SPEED_CONFIG.min + (curved * (SPEED_CONFIG.max - SPEED_CONFIG.min));
  
  logger.debug('Speed calculation', {
    sliderValue,
    normalized,
    curved,
    speed
  }, 'AnimationSpeed');
  
  return speed;
}

/**
 * Convert speed multiplier back to slider position
 */
export function speedToSlider(speed: number): number {
  // Normalize speed to 0-1 range
  const normalized = (speed - SPEED_CONFIG.min) / (SPEED_CONFIG.max - SPEED_CONFIG.min);
  
  // Reverse the curve
  let sliderNormalized: number;
  switch (SPEED_CONFIG.curve) {
    case 'exponential':
      sliderNormalized = Math.pow(normalized, 1 / 3.0);
      break;
    case 'logarithmic':
      sliderNormalized = (Math.pow(10, normalized) - 1) / 9;
      break;
    case 'ease-in-out':
      sliderNormalized = Math.acos(1 - 2 * normalized) / Math.PI;
      break;
    default:
      sliderNormalized = normalized;
  }
  
  return Math.round(sliderNormalized * 100);
}

/**
 * Calculate actual animation duration based on speed
 */
export function calculateDuration(speed: number): number {
  // Inverse relationship: higher speed = shorter duration
  const duration = SPEED_CONFIG.baseDuration / speed;
  
  logger.debug('Duration calculation', {
    speed,
    baseDuration: SPEED_CONFIG.baseDuration,
    actualDuration: duration
  }, 'AnimationSpeed');
  
  return duration;
}

/**
 * Get frame count for animation based on speed and desired FPS
 */
export function calculateFrameCount(speed: number, fps: number = 24): number {
  const duration = calculateDuration(speed);
  // Minimum 3 frames for any animation to be visible
  const frameCount = Math.max(3, Math.round(fps * duration));
  
  logger.debug('Frame count calculation', {
    speed,
    fps,
    duration,
    frameCount
  }, 'AnimationSpeed');
  
  return frameCount;
}

/**
 * Find the closest preset for a given speed value
 */
export function findClosestPreset(speed: number): SpeedPreset | null {
  let closest: SpeedPreset | null = null;
  let minDiff = Infinity;
  
  for (const preset of SPEED_PRESETS) {
    const diff = Math.abs(preset.value - speed);
    if (diff < minDiff) {
      minDiff = diff;
      closest = preset;
    }
  }
  
  return closest;
}

/**
 * Format speed value for display
 */
export function formatSpeed(speed: number): string {
  if (speed < 1) {
    return `${(1 / speed).toFixed(1)}× slower`;
  } else if (speed === 1) {
    return '1× (normal)';
  } else {
    return `${speed.toFixed(1)}× faster`;
  }
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const ms = seconds * 1000;
  
  if (ms < 100) {
    return `${ms.toFixed(0)}ms`;
  } else if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  } else if (seconds < 10) {
    return `${seconds.toFixed(2)}s`;
  } else {
    return `${seconds.toFixed(1)}s`;
  }
} 