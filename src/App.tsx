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
import { ProgressBar } from './components/ProgressBar'
import { LogViewer } from './components/LogViewer'
import { logger } from './lib/logger'
import { progressTracker } from './lib/progressTracker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Button } from './components/ui/button'
import { Bug } from 'lucide-react'

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
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false)

  // Handle file selection or drop
  const handleFileUpload = (uploadedFile: File | null) => {
    logger.info('File upload initiated', { fileName: uploadedFile?.name }, 'App');
    setError(null)
    setGifUrl('')
    setParsedScene(null)
    setDashedCount(0)
    setProgress(0)
    if (!uploadedFile) {
      setFile(null)
      logger.info('File upload cancelled', undefined, 'App');
      return
    }
    setFile(uploadedFile)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string)
        logger.debug('Parsing Excalidraw scene', { fileSize: uploadedFile.size }, 'App');
        const parsed = parseScene(json)
        setParsedScene(parsed)
        setDashedCount(parsed.dashedArrows.length)
        logger.info('Scene parsed successfully', {
          dashedArrows: parsed.dashedArrows.length,
          totalElements: json.elements?.length || 0
        }, 'App');
        if (parsed.dashedArrows.length === 0) {
          const warningMsg = '⚠️ No dashed arrows found in scene.';
          setError(warningMsg)
          logger.warn(warningMsg, undefined, 'App');
        }
      } catch (e: any) {
        const errorMsg = 'Failed to parse scene: ' + e.message;
        setError(errorMsg)
        logger.error(errorMsg, { error: e }, 'App');
      }
    }
    reader.readAsText(uploadedFile)
  }

  // Trigger GIF generation
  const handleGenerateGif = async () => {
    if (!parsedScene) return
    if (dashedCount === 0) {
      const errorMsg = 'No dashed arrows to animate.';
      setError(errorMsg)
      logger.error(errorMsg, undefined, 'App');
      return
    }
    
    logger.info('Starting GIF generation', {
      animationSpeed,
      colorFrom,
      colorTo,
      useGradientWave,
      arrowThickness
    }, 'App');
    
    // Initialize progress tracking
    progressTracker.startProcess([
      { id: 'parse-svg', name: 'Parse SVG' },
      { id: 'load-fonts', name: 'Load Fonts' },
      { id: 'render-frames', name: 'Render Frames' },
      { id: 'encode-gif', name: 'Encode GIF' }
    ]);
    
    setIsGenerating(true)
    setError(null)
    setProgress(0)
    
    try {
      progressTracker.updateStep('parse-svg', { status: 'in-progress' });
      const { animatedSvg, width, height, dashLengths } = await sceneToSvg(parsedScene)
      progressTracker.updateStep('parse-svg', { status: 'completed', progress: 100 });

      // Ensure Excalifont is loaded before rendering frames so Canvg can use it
      progressTracker.updateStep('load-fonts', { status: 'in-progress', message: 'Loading Excalifont...' });
      if (document.fonts && document.fonts.load) {
        await document.fonts.load(`12px Excalifont`)
      }
      progressTracker.updateStep('load-fonts', { status: 'completed', progress: 100 });

      const fps = 24
      // Linear inverse mapping: base duration at 1x speed is 1.5s, so max speed (3x) yields 0.5s
      const baseDuration = 1.5 // seconds at 1x speed
      const frameCount = Math.max(1, Math.round((fps * baseDuration) / animationSpeed))

      logger.info('Rendering frames', { frameCount, fps }, 'App');
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
      logger.info('Encoding GIF', { delay, frameCount: canvases.length }, 'App');
      const blob = await encodeGif(
        canvases,
        delay,
        {},
        (p) => setProgress(0.5 + p * 0.5)
      )

      const url = URL.createObjectURL(blob);
      setGifUrl(url)
      logger.info('GIF generation completed successfully', { blobSize: blob.size }, 'App');
    } catch (e: any) {
      const errorMsg = 'Animation failed: ' + e.message;
      setError(errorMsg)
      logger.error(errorMsg, { error: e }, 'App');
      progressTracker.setError(e.message);
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSpeedChange = (speed: number) => {
    setAnimationSpeed(speed)
    logger.debug('Animation speed changed', { speed }, 'App');
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
          <div className="md:col-span-2 space-y-6">
            <PreviewSection
              file={file}
              generatedGifUrl={gifUrl}
              isGenerating={isGenerating}
            />
            {isGenerating && <ProgressBar />}
          </div>
        </div>
        
        {/* Debug Panel Toggle */}
        <div className="fixed bottom-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="shadow-lg"
          >
            <Bug className="h-4 w-4 mr-2" />
            {showDebugPanel ? 'Hide' : 'Show'} Debug Panel
          </Button>
        </div>
        
        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="fixed bottom-16 right-4 w-[700px] max-h-[80vh] shadow-2xl bg-white rounded-lg overflow-hidden border">
            <Tabs defaultValue="logs" className="flex flex-col h-full">
              <div className="flex-shrink-0 border-b bg-gray-50">
                <TabsList className="grid w-full grid-cols-2 bg-transparent">
                  <TabsTrigger value="logs" className="data-[state=active]:bg-white">Logs</TabsTrigger>
                  <TabsTrigger value="progress" className="data-[state=active]:bg-white">Progress</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="logs" className="h-full mt-0 overflow-hidden">
                  <LogViewer />
                </TabsContent>
                <TabsContent value="progress" className="h-full mt-0 overflow-auto p-4">
                  <ProgressBar />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}
        
        <div className="mt-16">
          <ExampleGallery />
        </div>
      </main>
    </div>
  )
}

// Add default export for compatibility with main.tsx
export default App
