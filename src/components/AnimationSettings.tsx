import React, { useState, useEffect } from 'react'
import { PlayIcon, LoaderIcon, Gauge, Clock } from 'lucide-react'
import { Slider } from './ui/slider'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { cn } from '@/lib/utils'
import {
  SPEED_PRESETS,
  sliderToSpeed,
  speedToSlider,
  formatSpeed,
  formatDuration,
  calculateDuration,
  findClosestPreset
} from '@/lib/animationSpeed'

export interface AnimationSettingsProps {
  speed: number
  onSpeedChange: (speed: number) => void
  colorFrom: string
  colorTo: string
  onColorFromChange: (color: string) => void
  onColorToChange: (color: string) => void
  useGradientWave: boolean
  onUseGradientWaveChange: (enabled: boolean) => void
  thickness: number
  onThicknessChange: (thickness: number) => void
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
  thickness,
  onThicknessChange,
  onGenerate,
  isGenerating,
  disabled,
}) => {
  const [sliderValue, setSliderValue] = useState(speedToSlider(speed));
  const [activePreset, setActivePreset] = useState<string | null>(null);
  
  useEffect(() => {
    // Update slider when speed changes externally
    setSliderValue(speedToSlider(speed));
    
    // Check if current speed matches a preset
    const preset = findClosestPreset(speed);
    if (preset && Math.abs(preset.value - speed) < 0.01) {
      setActivePreset(preset.id);
    } else {
      setActivePreset(null);
    }
  }, [speed]);
  
  const handleSliderChange = (value: number[]) => {
    const newSliderValue = value[0];
    setSliderValue(newSliderValue);
    const newSpeed = sliderToSpeed(newSliderValue);
    onSpeedChange(newSpeed);
  };
  
  const handlePresetClick = (preset: typeof SPEED_PRESETS[0]) => {
    onSpeedChange(preset.value);
    setActivePreset(preset.id);
  };
  
  const duration = calculateDuration(speed);
  
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Animation Settings
      </h2>
      
      <Tabs defaultValue="speed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="speed">Speed</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="speed" className="space-y-4">
          {/* Speed Presets */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Presets</Label>
            <div className="grid grid-cols-3 gap-2">
              {SPEED_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  variant={activePreset === preset.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                  className="flex flex-col items-center py-3 h-auto"
                >
                  <span className="text-lg mb-1">{preset.icon}</span>
                  <span className="text-xs font-medium">{preset.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(preset.duration)}
                  </span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Custom Speed Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Custom Speed</Label>
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">{formatSpeed(speed)}</span>
              </div>
            </div>
            
            <Slider
              value={[sliderValue]}
              onValueChange={handleSliderChange}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slower</span>
              <span>Normal</span>
              <span>Faster</span>
            </div>
          </div>
          
          {/* Duration Display */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Animation Duration</span>
            </div>
            <Badge variant="secondary" className="font-mono">
              {formatDuration(duration)}
            </Badge>
          </div>
        </TabsContent>
        
        <TabsContent value="style" className="space-y-4">
          {/* Color Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="color-from">Stroke Color From</Label>
              <div className="flex items-center gap-2">
                <input
                  id="color-from"
                  type="color"
                  value={colorFrom}
                  onChange={e => onColorFromChange(e.target.value)}
                  className="h-10 w-20 rounded border cursor-pointer"
                />
                <span className="text-sm font-mono text-muted-foreground">
                  {colorFrom}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color-to">Stroke Color To</Label>
              <div className="flex items-center gap-2">
                <input
                  id="color-to"
                  type="color"
                  value={colorTo}
                  onChange={e => onColorToChange(e.target.value)}
                  className="h-10 w-20 rounded border cursor-pointer"
                />
                <span className="text-sm font-mono text-muted-foreground">
                  {colorTo}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="use-gradient-wave" className="cursor-pointer">
                Enable Wave Gradient
              </Label>
              <Switch
                id="use-gradient-wave"
                checked={useGradientWave}
                onCheckedChange={onUseGradientWaveChange}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4">
          {/* Stroke Thickness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="stroke-thickness">Stroke Thickness</Label>
              <Badge variant="outline" className="font-mono">
                {thickness}px
              </Badge>
            </div>
            <Slider
              id="stroke-thickness"
              value={[thickness]}
              onValueChange={(value) => onThicknessChange(value[0])}
              min={1}
              max={10}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Thin</span>
              <span>Medium</span>
              <span>Thick</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Generate Button */}
      <div className="mt-6 space-y-2">
        <Button
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <LoaderIcon className="animate-spin h-5 w-5 mr-2" />
              Generating...
            </>
          ) : (
            <>
              <PlayIcon className="h-5 w-5 mr-2" />
              Generate GIF
            </>
          )}
        </Button>
        
        {disabled && (
          <p className="text-sm text-amber-600 text-center">
            Please upload an Excalidraw file first
          </p>
        )}
      </div>
    </Card>
  );
} 