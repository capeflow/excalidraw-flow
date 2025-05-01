import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { parseScene, ParsedScene } from './parser'
import { sceneToSvg } from './sceneToSvg'
import { renderFrames } from './animator/frameRenderer'
import { encodeGif } from './animator/gifEncoder'
import './App.css'

function App() {
  const [parsedScene, setParsedScene] = useState<ParsedScene | null>(null)
  const [dashedCount, setDashedCount] = useState<number>(0)
  const [progress, setProgress] = useState<number>(0)
  const [gifUrl, setGifUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  // State for animation duration in seconds
  const [animationDuration, setAnimationDuration] = useState<number>(2)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null)
    setGifUrl('')
    setParsedScene(null)
    setDashedCount(0)
    setProgress(0)
    const file = acceptedFiles[0]
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string)
        const parsed = parseScene(json)
        setParsedScene(parsed)
        setDashedCount(parsed.dashedArrows.length)
        if (parsed.dashedArrows.length === 0) {
          setError('⚠️ No dashed arrows found in scene.')
        }
      } catch (e: any) {
        setError('Failed to parse scene: ' + e.message)
      }
    }
    reader.readAsText(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json', '.excalidraw'] },
    multiple: false,
  })

  const generateAnimation = async () => {
    if (!parsedScene) return
    if (dashedCount === 0) {
      setError('No dashed arrows to animate.')
      return
    }
    setLoading(true)
    setError(null)
    setProgress(0)
    try {
      const { animatedSvg, width, height, dashLengths } = await sceneToSvg(parsedScene)

      // Ensure Excalifont is loaded before rendering frames so Canvg can use it
      if (document.fonts && document.fonts.load) {
        await document.fonts.load(`12px Excalifont`)
      }

      const fps = 12
      const duration = animationDuration // seconds
      const frameCount = fps * duration

      // Stage 1: render frames (0% to 50%)
      const canvases = await renderFrames(
        animatedSvg,
        dashLengths,
        width,
        height,
        frameCount,
        (i) => setProgress((i / frameCount) * 0.5)
      )

      // Stage 2: encode GIF (50% to 100%)
      const delay = Math.round(1000 / fps)
      const blob = await encodeGif(
        canvases,
        delay,
        {},
        (p) => setProgress(0.5 + p * 0.5)
      )

      setGifUrl(URL.createObjectURL(blob))
    } catch (e: any) {
      setError('Animation failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white shadow p-6 rounded space-y-4">
        <h1 className="text-2xl font-bold">Excalidraw Arrow Animator</h1>
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-400 p-6 text-center cursor-pointer"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop file here...</p>
          ) : (
            <p>Drag & drop an .excalidraw file, or click to select</p>
          )}
        </div>
        {parsedScene && (
          <div>
            <p className="text-sm">
              ✅ Found <strong>{dashedCount}</strong> dashed arrow{dashedCount !== 1 && 's'}
            </p>
            <div className="flex items-center space-x-2">
              <label htmlFor="duration" className="text-sm">Animation duration (seconds):</label>
              <input
                id="duration"
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={animationDuration}
                onChange={(e) => setAnimationDuration(parseFloat(e.target.value))}
                disabled={loading}
                className="flex-1"
              />
              <span className="text-sm">{animationDuration.toFixed(1)}</span>
            </div>
          </div>
        )}
        <button
          onClick={generateAnimation}
          disabled={loading || dashedCount === 0 || !parsedScene}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Animate Arrows'}
        </button>
        {loading && (
          <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
            <p className="text-sm text-gray-600 mt-1">
              {Math.round(progress * 100)}%
            </p>
          </div>
        )}
        {error && <p className="text-red-600">{error}</p>}
      </div>

      {gifUrl && (
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Animated GIF</h2>
          <img src={gifUrl} alt="Animation preview" className="mx-auto" />
          <a
            href={gifUrl}
            download="excalidraw-animation.gif"
            className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Download GIF
          </a>
        </div>
      )}
    </div>
  )
}

export default App
