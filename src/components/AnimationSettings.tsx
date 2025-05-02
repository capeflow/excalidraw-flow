import React from 'react'
import { PlayIcon, LoaderIcon } from 'lucide-react'

export interface AnimationSettingsProps {
  speed: number
  onSpeedChange: (speed: number) => void
  colorFrom: string
  colorTo: string
  onColorFromChange: (color: string) => void
  onColorToChange: (color: string) => void
  useGradientWave: boolean
  onUseGradientWaveChange: (enabled: boolean) => void
  onGenerate: () => void
  isGenerating: boolean
  disabled: boolean
}

export const AnimationSettings: React.FC<AnimationSettingsProps> = ({
  speed,
  onSpeedChange,
  colorFrom,
  colorTo,
  onColorFromChange,
  onColorToChange,
  useGradientWave,
  onUseGradientWaveChange,
  onGenerate,
  isGenerating,
  disabled,
}) => {
  return <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Animation Settings
      </h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="animation-speed" className="block text-sm font-medium text-gray-700 mb-1">
            Animation Speed: {speed}x
          </label>
          <input id="animation-speed" type="range" min="0.5" max="3" step="0.1" value={speed} onChange={e => onSpeedChange(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Slower</span>
            <span>Faster</span>
          </div>
        </div>
        <div>
          <label htmlFor="color-from" className="block text-sm font-medium text-gray-700 mb-1">
            Stroke Color From:
          </label>
          <input
            id="color-from"
            type="color"
            value={colorFrom}
            onChange={e => onColorFromChange(e.target.value)}
            className="w-full h-8"
          />
        </div>
        <div>
          <label htmlFor="color-to" className="block text-sm font-medium text-gray-700 mb-1">
            Stroke Color To:
          </label>
          <input
            id="color-to"
            type="color"
            value={colorTo}
            onChange={e => onColorToChange(e.target.value)}
            className="w-full h-8"
          />
        </div>
        <div>
          <label htmlFor="use-gradient-wave" className="inline-flex items-center">
            <input
              id="use-gradient-wave"
              type="checkbox"
              checked={useGradientWave}
              onChange={e => onUseGradientWaveChange(e.target.checked)}
              className="form-checkbox h-4 w-4 text-indigo-600"
            />
            <span className="ml-2 text-sm text-gray-700">Enable Wave Gradient</span>
          </label>
        </div>
        <button onClick={onGenerate} disabled={disabled || isGenerating} className={`w-full py-2 px-4 rounded-md flex items-center justify-center transition-colors ${disabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          {isGenerating ? <>
              <LoaderIcon className="animate-spin h-5 w-5 mr-2" />
              Generating...
            </> : <>
              <PlayIcon className="h-5 w-5 mr-2" />
              Generate GIF
            </>}
        </button>
        {disabled && <p className="text-sm text-amber-600">
            Please upload an Excalidraw file first
          </p>}
      </div>
    </div>;
} 