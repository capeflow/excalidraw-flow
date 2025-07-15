import { exportToSvg } from '@excalidraw/excalidraw';
import { logger } from '@/lib/logger';

/**
 * Export the scene to SVG, tag dashed paths, and compute dash lengths.
 */
export async function sceneToSvg(
  data: any
): Promise<{ animatedSvg: string; width: number; height: number; dashLengths: number[] }> {
  const startTime = performance.now();
  logger.info('Starting SVG conversion', undefined, 'SceneToSvg');
  
  const { elements, appState, files } = data;
  
  logger.debug('Exporting scene to SVG', { 
    elementCount: elements?.length || 0,
    hasFiles: !!files && Object.keys(files).length > 0
  }, 'SceneToSvg');
  
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
  const textElements = svgClone.querySelectorAll<SVGTextElement>('text');
  logger.debug(`Processing ${textElements.length} text elements`, undefined, 'SceneToSvg');
  Array.from(textElements).forEach((t) => {
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
  
  logger.info(`Found ${dashedPaths.length} dashed paths`, undefined, 'SceneToSvg');

  // Compute dash lengths
  const dashLengths = dashedPaths.map((p: any) => {
    const dash = p.getAttribute('stroke-dasharray') || '';
    return dash
      .split(/\s+/)
      .map((n: string) => parseFloat(n))
      .reduce((a: number, b: number) => a + b, 0);
  });
  
  logger.debug('Computed dash lengths', { dashLengths }, 'SceneToSvg');

  // Tag dashed paths with a class for later selection
  dashedPaths.forEach((p) => p.classList.add('animated-dash'));

  const width = parseFloat(svgClone.getAttribute('width') || '0');
  const height = parseFloat(svgClone.getAttribute('height') || '0');
  const animatedSvg = new XMLSerializer().serializeToString(svgClone);
  
  const conversionTime = performance.now() - startTime;
  logger.info('SVG conversion completed', {
    width,
    height,
    dashedPathCount: dashedPaths.length,
    svgSize: animatedSvg.length,
    conversionTime: conversionTime.toFixed(2)
  }, 'SceneToSvg');

  return { animatedSvg, width, height, dashLengths };
} 