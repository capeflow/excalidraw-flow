import { exportToSvg } from '@excalidraw/excalidraw';

/**
 * Export the scene to SVG, tag dashed paths, and compute dash lengths.
 */
export async function sceneToSvg(
  data: any
): Promise<{ animatedSvg: string; width: number; height: number; dashLengths: number[] }> {
  const { elements, appState, files } = data;
  // Export scene to SVG DOM element
  const svgElem = (await exportToSvg({ 
    elements,
    files,
    appState: {
      ...appState,
      exportBackground: true,
      exportWithDarkMode: false,
      exportPadding: 0
    }, 
    name: 'scene' 
  })) as any;

  // Clone the node so we don't alter Excalidraw's internal state
  const svgClone = (svgElem.cloneNode(true) as unknown) as SVGSVGElement;

  // Force Excalifont on all SVG text elements so Canvg uses the correct font
  Array.from(svgClone.querySelectorAll<SVGTextElement>('text')).forEach((t) => {
    t.setAttribute('font-family', 'Excalifont, sans-serif');
  });

  // Ensure background is white with no borders
  svgClone.style.backgroundColor = '#ffffff';
  svgClone.setAttribute('style', 'background-color: #ffffff; display: block;');
  
  // Remove any potential artifacts causing gray lines
  const backgroundRect = svgClone.querySelector('rect');
  if (backgroundRect) {
    backgroundRect.setAttribute('fill', '#ffffff');
  }

  // Find dashed paths (those with stroke-dasharray)
  const dashedPaths = Array.from(
    svgClone.querySelectorAll('path')
  ).filter((p) => p.hasAttribute('stroke-dasharray'));

  // Compute dash lengths
  const dashLengths = dashedPaths.map((p: any) => {
    const dash = p.getAttribute('stroke-dasharray') || '';
    return dash
      .split(/\s+/)
      .map(Number)
      .reduce((sum: number, v: number) => sum + v, 0);
  });

  // Tag paths for animation via CSS class
  dashedPaths.forEach((p: any) => p.classList.add('animated-dash'));

  // Serialize clone via outerHTML to avoid xml parser issues
  const animatedSvg = svgClone.outerHTML;

  // Extract dimensions
  const width = parseFloat(svgClone.getAttribute('width') || '0');
  const height = parseFloat(svgClone.getAttribute('height') || '0');

  return { animatedSvg, width, height, dashLengths };
} 