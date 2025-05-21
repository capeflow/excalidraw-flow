import React, { useState } from 'react'
import { parseScene, ParsedScene } from './parser'
import { sceneToSvg } from './sceneToSvg'
import { renderFrames } from './animator/frameRenderer'
import { encodeGif } from './animator/gifEncoder'
import './App.css'
import { Header } from './components/Header'
import { FileUploader } from './components/FileUploader'
import { AnimationSettings } from './components/AnimationSettings'
import { PreviewSection } from './components/PreviewSection'
import { ExampleGallery } from './components/ExampleGallery'

export function App() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedScene, setParsedScene] = useState<ParsedScene | null>(null)
  const [dashedCount, setDashedCount] = useState<number>(0)
  const [progress, setProgress] = useState<number>(0)
  const [gifUrl, setGifUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  // State for animation duration in seconds
  const [animationSpeed, setAnimationSpeed] = useState<number>(1)
  const [colorFrom, setColorFrom] = useState<string>('#000000')
  const [colorTo, setColorTo] = useState<string>('#ff0000')
  const [useGradientWave, setUseGradientWave] = useState<boolean>(false)
  // State for arrow thickness in pixels
  const [arrowThickness, setArrowThickness] = useState<number>(4)

  // Handle file selection or drop
  const handleFileUpload = (uploadedFile: File | null) => {
    setError(null)
    setGifUrl('')
    setParsedScene(null)
    setDashedCount(0)
    setProgress(0)
    if (!uploadedFile) {
      setFile(null)
      return
    }
    setFile(uploadedFile)
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
    reader.readAsText(uploadedFile)
  }

  // Trigger GIF generation
  const handleGenerateGif = async () => {
    if (!parsedScene) return
    if (dashedCount === 0) {
      setError('No dashed arrows to animate.')
      return
    }
    setIsGenerating(true)
    setError(null)
    setProgress(0)
    try {
      const { animatedSvg, width, height, dashLengths } = await sceneToSvg(parsedScene)

      // Ensure Excalifont is loaded before rendering frames so Canvg can use it
      if (document.fonts && document.fonts.load) {
        await document.fonts.load(`12px Excalifont`)
      }

      const fps = 24
      // Linear inverse mapping: base duration at 1x speed is 1.5s, so max speed (3x) yields 0.5s
      const baseDuration = 1.5 // seconds at 1x speed
      const frameCount = Math.max(1, Math.round((fps * baseDuration) / animationSpeed))

      const canvases = await renderFrames(
        animatedSvg,
        dashLengths,
        width,
        height,
        frameCount,
        (i) => setProgress((i / frameCount) * 0.5),
        colorFrom,
        colorTo,
        useGradientWave,
        arrowThickness
      )

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
      setIsGenerating(false)
    }
  }

  const handleSpeedChange = (speed: number) => {
    setAnimationSpeed(speed)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <FileUploader onFileUpload={handleFileUpload} />
            <AnimationSettings
              speed={animationSpeed}
              onSpeedChange={handleSpeedChange}
              colorFrom={colorFrom}
              colorTo={colorTo}
              onColorFromChange={setColorFrom}
              onColorToChange={setColorTo}
              useGradientWave={useGradientWave}
              onUseGradientWaveChange={setUseGradientWave}
              thickness={arrowThickness}
              onThicknessChange={setArrowThickness}
              onGenerate={handleGenerateGif}
              isGenerating={isGenerating}
              disabled={!parsedScene || dashedCount === 0}
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
          <div className="md:col-span-2">
            <PreviewSection
              file={file}
              generatedGifUrl={gifUrl}
              isGenerating={isGenerating}
            />
          </div>
        </div>
        <div className="mt-16">
          <ExampleGallery />
        </div>
      </main>
    </div>
  )
}

// Add default export for compatibility with main.tsx
export default App
