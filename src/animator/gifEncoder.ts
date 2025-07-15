import GIF from 'gif.js.optimized'
import workerScriptUrl from 'gif.js.optimized/dist/gif.worker.js?url'
import { logger } from '@/lib/logger';
import { progressTracker } from '@/lib/progressTracker';

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
      const error = 'No frames to encode';
      logger.error(error, undefined, 'GifEncoder');
      progressTracker.setError(error, 'encode-gif');
      reject(new Error(error))
      return
    }
    
    const { quality = 10, workers = 2, transparent = false } = options
    
    logger.info('Starting GIF encoding', {
      frameCount: canvases.length,
      frameDelay,
      quality,
      workers,
      transparent,
      dimensions: { width: canvases[0].width, height: canvases[0].height }
    }, 'GifEncoder');
    
    progressTracker.updateStep('encode-gif', { 
      status: 'in-progress',
      message: 'Preparing frames for encoding...'
    });
    
    // Process canvases to ensure no gray border artifacts
    const processedCanvases = canvases.map((canvas, index) => {
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
      
      if ((index + 1) % 10 === 0) {
        logger.debug(`Processed ${index + 1}/${canvases.length} frames`, undefined, 'GifEncoder');
      }
      
      return cleanCanvas;
    });
    
    progressTracker.updateStep('encode-gif', { 
      progress: 10,
      message: 'Initializing GIF encoder...'
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
    
    logger.debug('Adding frames to GIF encoder', { frameCount: processedCanvases.length }, 'GifEncoder');
    
    processedCanvases.forEach((canvas, index) => {
      gif.addFrame(canvas, { copy: true, delay: frameDelay })
      
      if ((index + 1) % 10 === 0) {
        const progress = 10 + ((index + 1) / processedCanvases.length) * 20; // 10-30% progress
        progressTracker.updateStep('encode-gif', { 
          progress,
          message: `Added ${index + 1}/${processedCanvases.length} frames`
        });
      }
    })
    
    progressTracker.updateStep('encode-gif', { 
      progress: 30,
      message: 'Encoding GIF...'
    });
    
    const encodingStartTime = performance.now();
    
    gif.on('progress', (p: number) => {
      const progress = 30 + (p * 70); // 30-100% progress
      logger.debug(`GIF encoding progress: ${(p * 100).toFixed(1)}%`, undefined, 'GifEncoder');
      progressTracker.updateStep('encode-gif', { 
        progress,
        message: `Encoding: ${(p * 100).toFixed(0)}% complete`
      });
      onProgress?.(p)
    })
    
    gif.on('finished', (blob: Blob) => {
      const encodingTime = performance.now() - encodingStartTime;
      logger.info('GIF encoding completed', {
        blobSize: blob.size,
        encodingTime: encodingTime.toFixed(2),
        sizeInMB: (blob.size / 1024 / 1024).toFixed(2)
      }, 'GifEncoder');
      
      progressTracker.updateStep('encode-gif', { 
        status: 'completed',
        progress: 100,
        message: `GIF created (${(blob.size / 1024 / 1024).toFixed(1)} MB)`
      });
      
      resolve(blob)
    })
    
    gif.on('abort', () => {
      const error = 'GIF encoding aborted';
      logger.error(error, undefined, 'GifEncoder');
      progressTracker.setError(error, 'encode-gif');
      reject(new Error(error))
    })
    
    gif.on('error', (err: any) => {
      logger.error('GIF encoding error', { error: err.message || err }, 'GifEncoder');
      progressTracker.setError(err.message || 'GIF encoding failed', 'encode-gif');
      reject(err)
    })
    
    logger.debug('Starting GIF render', undefined, 'GifEncoder');
    gif.render()
  })
} 