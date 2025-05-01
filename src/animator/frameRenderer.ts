import { Canvg } from 'canvg';

/**
 * Renders animation frames by mutating dash offsets in SVG.
 * @param animatedSvg Base SVG string with dashed paths having class 'animated-dash'
 * @param dashLengths Array of total dash lengths for each dashed path
 * @param width SVG width
 * @param height SVG height
 * @param frameCount Total number of frames to generate
 * @param onFrame Optional callback for each completed frame index (1-based)
 * @returns Array of canvases for each frame
 */
export async function renderFrames(
  animatedSvg: string,
  dashLengths: number[],
  width: number,
  height: number,
  frameCount: number,
  onFrame?: (frameIndex: number) => void
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
  const canvases: HTMLCanvasElement[] = [];

  for (let i = 0; i < frameCount; i++) {
    const t = i / frameCount;
    paths.forEach((p, idx) => {
      p.style.strokeDashoffset = `-${dashLengths[idx] * t}`;
    });
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