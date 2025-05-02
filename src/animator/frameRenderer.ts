import { Canvg } from 'canvg';

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
  useGradientWave: boolean = false
): Promise<HTMLCanvasElement[]> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(animatedSvg, 'image/svg+xml');
  
  // Ensure SVG has white background and no borders
  const svgRoot = doc.documentElement;
  svgRoot.setAttribute('style', 'background-color: #ffffff; display: block;');
  
  // Set background rectangle to white
  const backgroundRect = doc.querySelector('rect');
  if (backgroundRect) {
    backgroundRect.setAttribute('fill', '#ffffff');
  }
  
  const paths = doc.querySelectorAll<SVGPathElement>('path.animated-dash');
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

  for (let i = 0; i < frameCount; i++) {
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
    if (!ctx) throw new Error('Failed to get canvas context');
    
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
    onFrame?.(i + 1);
  }

  return canvases;
} 