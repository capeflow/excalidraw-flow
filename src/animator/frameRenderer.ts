import { Canvg } from 'canvg';
import { logger } from '@/lib/logger';
import { progressTracker } from '@/lib/progressTracker';

/**
 * Injects a single global wave gradient that repeats every waveLen pixels across the SVG.
 * waveLen is the length of one wave cycle in user space.
 */
function injectWaveGradient(
  doc: Document,
  waveLen: number,
  colorFrom: string,
  colorTo: string
): SVGLinearGradientElement {
  logger.debug('Creating wave gradient', { waveLen, colorFrom, colorTo }, 'FrameRenderer');
  
  const svgNS = 'http://www.w3.org/2000/svg';
  // Ensure <defs> exists
  let defs = doc.querySelector('defs') as SVGDefsElement;
  if (!defs) {
    defs = doc.createElementNS(svgNS, 'defs');
    doc.documentElement.insertBefore(defs, doc.documentElement.firstChild);
  }
  // Create the gradient element
  const grad = doc.createElementNS(svgNS, 'linearGradient');
  grad.setAttribute('id', 'waveGrad');
  grad.setAttribute('gradientUnits', 'userSpaceOnUse');
  grad.setAttribute('x1', '0');
  grad.setAttribute('y1', '0');
  grad.setAttribute('x2', waveLen.toString());
  grad.setAttribute('y2', '0');
  grad.setAttribute('spreadMethod', 'repeat');
  // Define a narrow color band in the middle of the gradient
  [['0%', colorFrom], ['40%', colorFrom], ['50%', colorTo], ['60%', colorFrom], ['100%', colorFrom]].forEach(
    ([offset, col]) => {
      const stop = doc.createElementNS(svgNS, 'stop');
      stop.setAttribute('offset', offset);
      stop.setAttribute('stop-color', col);
      grad.appendChild(stop);
    }
  );
  defs.appendChild(grad);
  // Apply the gradient stroke to all animated dashed paths
  doc.querySelectorAll<SVGPathElement>('path.animated-dash').forEach((p) =>
    p.setAttribute('stroke', 'url(#waveGrad)')
  );
  return grad;
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
  colorFrom: string = '#000000',
  colorTo: string = '#000000',
  useGradientWave: boolean = false,
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
  
  // Set up global wave gradient if enabled
  const waveCycles = 4;            // number of wave cycles across the SVG width
  const waveSpeedFactor = 1.2;     // wave animation speed factor relative to dash movement
  let waveGrad: SVGLinearGradientElement | null = null;
  let waveLen = 0;
  if (useGradientWave) {
    // Calculate length of one wave cycle
    waveLen = width / waveCycles;
    waveGrad = injectWaveGradient(doc, waveLen, colorFrom, colorTo);
  }
  const canvases: HTMLCanvasElement[] = [];

  // Update progress for frame rendering
  progressTracker.updateStep('render-frames', { 
    status: 'in-progress',
    message: 'Rendering animation frames...'
  });

  for (let i = 0; i < frameCount; i++) {
    const frameStartTime = performance.now();
    const t = i / frameCount;
    
    // Animate dash offsets for all paths
    paths.forEach((p, idx) => {
      p.style.strokeDashoffset = `-${dashLengths[idx] * t}`;
    });
    
    // Animate the wave gradient by sliding it by one wave length
    if (waveGrad) {
      const shift = (waveLen * t * waveSpeedFactor) % waveLen;
      waveGrad.setAttribute('gradientTransform', `translate(${-shift},0)`);
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