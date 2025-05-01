import GIF from 'gif.js.optimized'
import workerScriptUrl from 'gif.js.optimized/dist/gif.worker.js?url'

/**
 * Encodes an array of canvases into a GIF blob.
 * @param canvases Array of canvases for each frame
 * @param frameDelay Delay per frame in ms
 * @param options Optional GIF options
 * @param onProgress Callback for progress (0.0 - 1.0)
 * @returns Promise resolving to a Blob of the generated GIF
 */
export function encodeGif(
  canvases: HTMLCanvasElement[],
  frameDelay: number,
  options: { quality?: number; workers?: number; transparent?: boolean } = {},
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!canvases.length) {
      reject(new Error('No frames to encode'))
      return
    }
    const { quality = 10, workers = 2, transparent = false } = options
    
    // Process canvases to ensure no gray border artifacts
    const processedCanvases = canvases.map(canvas => {
      // Create a clean copy of each canvas
      const cleanCanvas = document.createElement('canvas');
      cleanCanvas.width = canvas.width;
      cleanCanvas.height = canvas.height;
      const ctx = cleanCanvas.getContext('2d');
      if (ctx) {
        // Fill with white background first
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw the original canvas content
        ctx.drawImage(canvas, 0, 0);
      }
      return cleanCanvas;
    });
    
    const gif = new GIF({
      workers,
      quality,
      repeat: 0,
      workerScript: workerScriptUrl,
      width: processedCanvases[0].width,
      height: processedCanvases[0].height,
      background: '#ffffff',
      transparent: transparent ? 0xFF00FF : null, // Use magenta as transparent color if needed
    })
    
    processedCanvases.forEach((canvas) => {
      gif.addFrame(canvas, { copy: true, delay: frameDelay })
    })
    
    if (onProgress) {
      gif.on('progress', (p: number) => {
        onProgress(p)
      })
    }
    gif.on('finished', (blob: Blob) => {
      resolve(blob)
    })
    gif.on('abort', () => {
      reject(new Error('GIF encoding aborted'))
    })
    gif.on('error', (err: any) => {
      reject(err)
    })
    gif.render()
  })
} 