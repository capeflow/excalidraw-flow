import { useState } from 'react'
import { parseScene, ParsedScene } from './parser'
import { sceneToSvg } from './sceneToSvg'
import { renderFrames } from './animator/frameRenderer'
import { encodeGif } from './animator/gifEncoder'
import './App.css'
import { Header } from './components/Header'
import { FileUploader } from './components/FileUploader'
import { AnimationSettings } from './components/AnimationSettings'
import { PreviewSection } from './components/PreviewSection'

import { ProgressBar } from './components/ProgressBar'
import { LogViewer } from './components/LogViewer'
import { logger } from './lib/logger'
import { progressTracker } from './lib/progressTracker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { calculateFrameCount, SPEED_CONFIG } from './lib/animationSpeed'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarSeparator,
} from '@/components/ui/sidebar'

export function App() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedScene, setParsedScene] = useState<ParsedScene | null>(null)
  const [dashedCount, setDashedCount] = useState<number>(0)
  const [gifUrl, setGifUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  // State for animation speed (default is 2x for snappy animations)
  const [animationSpeed, setAnimationSpeed] = useState<number>(SPEED_CONFIG.default)
  const [colorFrom, setColorFrom] = useState<string>('#000000')
  const [colorTo, setColorTo] = useState<string>('#ff0000')
  const [useGradientWave, setUseGradientWave] = useState<boolean>(false)
  const [waveFrequency, setWaveFrequency] = useState<number>(1.0)
  const [waveBandWidth, setWaveBandWidth] = useState<number>(0.3)
  const [glintSpeed, setGlintSpeed] = useState<number>(0.006)
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
      waveFrequency,
      waveBandWidth,
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
      const frameCount = calculateFrameCount(animationSpeed, fps)

      logger.info('Rendering frames', { frameCount, fps, speed: animationSpeed }, 'App');
      const canvases = await renderFrames(
        animatedSvg,
        dashLengths,
        width,
        height,
        frameCount,
        undefined,
        colorFrom,
        colorTo,
        useGradientWave,
        waveFrequency,
        waveBandWidth,
        glintSpeed,
        arrowThickness
      )

      const delay = Math.round(1000 / fps)
      logger.info('Encoding GIF', { delay, frameCount: canvases.length }, 'App');
      const blob = await encodeGif(
        canvases,
        delay,
        {
          quality: 2,        // denser sampling for stable colors
          workers: 4,        // faster encoding
          transparent: false,
          dither: false,     // avoid frame-to-frame dither noise
          globalPalette: true // single palette across frames to prevent flicker
        }
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
    <SidebarProvider className="bg-gray-50">
      <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="px-2 pt-3 pb-1">
            <div className="flex items-center gap-2 px-2">
              <img src="/vite.svg" alt="logo" className="h-5 w-5 opacity-80" />
              <span className="text-sm font-semibold text-gray-800">Excalidraw Flow</span>
            </div>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent className="gap-3 p-2">
            <FileUploader onFileUpload={handleFileUpload} />
            <ProgressBar compact={true} />
            <AnimationSettings
              speed={animationSpeed}
              onSpeedChange={handleSpeedChange}
              colorFrom={colorFrom}
              colorTo={colorTo}
              onColorFromChange={setColorFrom}
              onColorToChange={setColorTo}
              useGradientWave={useGradientWave}
              onUseGradientWaveChange={setUseGradientWave}
              waveFrequency={waveFrequency}
              onWaveFrequencyChange={setWaveFrequency}
              waveBandWidth={waveBandWidth}
              onWaveBandWidthChange={setWaveBandWidth}
              glintSpeed={glintSpeed}
              onGlintSpeedChange={setGlintSpeed}
              thickness={arrowThickness}
              onThicknessChange={setArrowThickness}
              onGenerate={handleGenerateGif}
              isGenerating={isGenerating}
              disabled={!parsedScene || dashedCount === 0}
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </SidebarContent>
          <SidebarFooter className="px-2 pb-2">
            <p className="text-[10px] text-gray-500 px-2">Built for Excalidraw scenes</p>
          </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-gray-50">
          <Header onToggleDebug={() => setShowDebugPanel(!showDebugPanel)} isDebugOpen={showDebugPanel} />
          <div className="flex-1 overflow-hidden p-4">
            <div className="h-full rounded-xl border bg-white shadow-sm p-4 bg-dots">
              <PreviewSection file={file} generatedGifUrl={gifUrl} isGenerating={isGenerating} />
            </div>
          </div>

          {/* Debug Panel */}
          {showDebugPanel && (
            <div className="fixed bottom-4 right-4 w-[720px] h-[70vh] shadow-2xl bg-white rounded-lg overflow-hidden border-2 border-gray-900">
              <Tabs defaultValue="logs" className="flex flex-col h-full">
                <div className="flex-shrink-0 border-b bg-gray-50">
                  <TabsList className="grid w-full grid-cols-2 bg-transparent">
                    <TabsTrigger value="logs" className="data-[state=active]:bg-white">Logs</TabsTrigger>
                    <TabsTrigger value="progress" className="data-[state=active]:bg-white">Progress</TabsTrigger>
                  </TabsList>
                </div>
                <div className="flex-1 overflow-hidden">
                  <TabsContent value="logs" className="h-full mt-0 overflow-hidden p-0">
                    <LogViewer />
                  </TabsContent>
                  <TabsContent value="progress" className="h-full mt-0 overflow-auto p-4">
                    <ProgressBar />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
      </SidebarInset>
    </SidebarProvider>
  )
}

// Add default export for compatibility with main.tsx
export default App
