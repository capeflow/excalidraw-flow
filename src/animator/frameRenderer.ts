import { Canvg } from 'canvg';
import { logger } from '@/lib/logger';
import { progressTracker } from '@/lib/progressTracker';

/**
 * Create a simple overlay glint using an overlaid path with its own dash pattern.
 * This avoids gradients and aligns motion with dash offset for a stable effect.
 */
function createWaveOverlay(
  path: SVGPathElement,
  onLen: number,
  offLen: number,
  colorTo: string,
  strokeWidth?: number
): SVGPathElement {
  const overlay = path.cloneNode(true) as SVGPathElement;
  overlay.removeAttribute('filter');
  overlay.setAttribute('class', (path.getAttribute('class') || '') + ' wave-overlay');
  overlay.setAttribute('stroke', colorTo);
  overlay.setAttribute('fill', 'none');
  overlay.setAttribute('stroke-linecap', 'round');
  overlay.setAttribute('stroke-linejoin', 'round');
  if (strokeWidth != null) {
    overlay.setAttribute('stroke-width', String(strokeWidth));
  }
  const onVal = Math.max(1, onLen);
  // Use extremely large gap to guarantee a single visible segment per path
  const offVal = Math.max(1, offLen);
  overlay.setAttribute('stroke-dasharray', `${onVal} ${offVal}`);
  overlay.setAttribute('stroke-dashoffset', '0');
  // Higher opacity glint; caller can tweak if needed
  overlay.setAttribute('stroke-opacity', '1');

  // Insert overlay after the original path so it renders above
  path.parentNode?.insertBefore(overlay, path.nextSibling);
  return overlay;
}

/**
 * Renders animation frames by mutating dash offsets in SVG.
 * @param animatedSvg Base SVG string with dashed paths having class 'animated-dash'
 * @param dashLengths Array of total dash lengths for each dashed path
 * @param width SVG width
 * @param height SVG height
 * @param frameCount Total number of frames to generate
 * @param onFrame Optional callback for each completed frame index (1-based)
 * @param colorFrom Starting gradient color
 * @param colorTo Ending gradient color
 * @param useGradientWave Flag to enable color-wave gradients
 * @param strokeWidth Optional stroke width for dashed paths
 * @returns Array of canvases for each frame
 */
export async function renderFrames(
  animatedSvg: string,
  dashLengths: number[],
  width: number,
  height: number,
  frameCount: number,
  onFrame?: (frameIndex: number) => void,
  _colorFrom: string = '#000000',
  colorTo: string = '#000000',
  useGradientWave: boolean = false,
  _waveFrequency: number = 1.0,
  waveBandWidth: number = 0.3,
  glintSpeed: number = 0.006,
  strokeWidth?: number
): Promise<HTMLCanvasElement[]> {
  const startTime = performance.now();
  logger.info('Starting frame rendering', {
    width,
    height,
    frameCount,
    useGradientWave,
    strokeWidth,
    dashPathCount: dashLengths.length
  }, 'FrameRenderer');

  const parser = new DOMParser();
  const doc = parser.parseFromString(animatedSvg, 'image/svg+xml');
  
  // Override stroke width for dashed paths (arrow shafts and heads scale with strokeWidth)
  if (strokeWidth != null) {
    logger.debug(`Setting stroke width to ${strokeWidth}`, undefined, 'FrameRenderer');
    doc.querySelectorAll<SVGPathElement>('path.animated-dash').forEach((p) =>
      p.setAttribute('stroke-width', strokeWidth.toString())
    );
  }
  
  // Ensure SVG has white background and no borders
  const svgRoot = doc.documentElement;
  svgRoot.setAttribute('style', 'background-color: #ffffff; display: block;');
  
  // Set background rectangle to white
  const backgroundRect = doc.querySelector('rect');
  if (backgroundRect) {
    backgroundRect.setAttribute('fill', '#ffffff');
  }
  
  const paths = doc.querySelectorAll<SVGPathElement>('path.animated-dash');
  logger.debug(`Found ${paths.length} animated paths`, undefined, 'FrameRenderer');
  
  // Set up overlay glints if enabled
  type OverlayWave = { overlay: SVGPathElement; totalLen: number; speedMul: number };
  const overlayWaves: OverlayWave[] = [];
  if (useGradientWave) {
    const band = Math.max(0.05, Math.min(0.6, waveBandWidth || 0.3));
    paths.forEach((p, idx) => {
      // Ensure base path color is the base colorFrom so the overlay "rushes over" a contrasting color
      p.setAttribute('stroke', _colorFrom);

      // Access dashLengths to keep interface consistent (no longer used for glint sizing)
      void dashLengths[idx];
      let totalLen = 0;
      try {
        totalLen = Math.max(4, (p as any).getTotalLength?.() ?? 0);
      } catch {
        const bbox = p.getBBox();
        totalLen = Math.max(4, Math.hypot(bbox.width, bbox.height));
      }
      // Glint size as a small fraction of total length; big gap to guarantee a single segment
      const glintFrac = Math.max(0.03, Math.min(0.20, 0.02 + band * 0.25));
      const glintLen = Math.max(2, totalLen * glintFrac);
      const offLen = 1000000; // huge gap ensures only one visible segment across the path

      // Single glint overlay
      const overlay = createWaveOverlay(p, glintLen, offLen, colorTo, strokeWidth);

      const speedMul = Math.max(0.0001, Math.min(4, glintSpeed || 0.006));
      overlayWaves.push({ overlay, totalLen, speedMul });
    });
  }

  // If using glint effect, keep base dashes static so only the glint moves
  // Reset per-frame instead of once to avoid carry-over when toggling modes
  const canvases: HTMLCanvasElement[] = [];

  // Update progress for frame rendering
  progressTracker.updateStep('render-frames', { 
    status: 'in-progress',
    message: 'Rendering animation frames...'
  });

  for (let i = 0; i < frameCount; i++) {
    const frameStartTime = performance.now();
    const t = frameCount > 1 ? (i / (frameCount - 1)) : 1; // normalize 0..1 inclusive
    
    // Animate dash offsets for all paths
    paths.forEach((p, idx) => {
      p.style.strokeDashoffset = `-${dashLengths[idx] * t}`;
    });
    
    // Animate overlay glints: move along total path length
    if (useGradientWave) {
      overlayWaves.forEach(({ overlay, totalLen, speedMul }) => {
        // Map glintSpeed (speedMul) to pacing while ensuring full coverage by last frame
        const s = Math.max(0.0001, Math.min(1, speedMul));
        const minPow = 3.0; // slower early movement
        const maxPow = 0.5; // faster early movement
        const pacePow = minPow + (maxPow - minPow) * ((s - 0.0001) / (1 - 0.0001));
        const easedT = Math.pow(t, pacePow);
        const shift = totalLen * easedT;
        overlay.style.strokeDashoffset = `-${shift}`;
      });
    } else {
      // Default behavior: animate base dash offset (legacy flow animation)
      paths.forEach((p, idx) => {
        p.style.strokeDashoffset = `-${dashLengths[idx] * t}`;
      });
    }
    
    const serialized = new XMLSerializer().serializeToString(doc);

    // Render to canvas via canvg
    const canvas = document.createElement('canvas');
    // Add a small padding to ensure no cropping at edges
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const error = 'Failed to get canvas context';
      logger.error(error, { frameIndex: i }, 'FrameRenderer');
      progressTracker.setError(error, 'render-frames');
      throw new Error(error);
    }
    
    // Fill background with white to remove transparent edge artifacts
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const v = await Canvg.fromString(ctx, serialized, {
      ignoreMouse: true,
      ignoreDimensions: false,
      ignoreClear: true,
    });
    
    await v.render();
    canvases.push(canvas);
    
    const frameTime = performance.now() - frameStartTime;
    logger.debug(`Frame ${i + 1}/${frameCount} rendered`, { frameTime: frameTime.toFixed(2) }, 'FrameRenderer');
    
    // Update progress
    const progress = ((i + 1) / frameCount) * 100;
    progressTracker.updateStep('render-frames', { 
      progress,
      message: `Rendered frame ${i + 1} of ${frameCount}`
    });
    
    onFrame?.(i + 1);
  }

  const totalTime = performance.now() - startTime;
  logger.info('Frame rendering completed', {
    frameCount,
    totalTime: totalTime.toFixed(2),
    avgFrameTime: (totalTime / frameCount).toFixed(2)
  }, 'FrameRenderer');

  progressTracker.updateStep('render-frames', { 
    status: 'completed',
    progress: 100,
    message: `Rendered ${frameCount} frames`
  });

  return canvases;
} 