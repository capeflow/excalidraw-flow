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
  options: { quality?: number; workers?: number } = {},
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!canvases.length) {
      reject(new Error('No frames to encode'))
      return
    }
    const { quality = 10, workers = 2 } = options
    const gif = new GIF({
      workers,
      quality,
      repeat: 0,
      workerScript: workerScriptUrl,
      width: canvases[0].width,
      height: canvases[0].height,
    })
    canvases.forEach((canvas) => {
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