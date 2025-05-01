import React from 'react'
import { ImageIcon, DownloadIcon, LoaderIcon } from 'lucide-react'

interface PreviewSectionProps {
  file: File | null
  generatedGifUrl: string
  isGenerating: boolean
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  file,
  generatedGifUrl,
  isGenerating,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Preview</h2>
      
      {!file && !generatedGifUrl && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-64">
          <p className="text-gray-500 text-center p-6">
            Upload an Excalidraw file to generate a GIF
          </p>
        </div>
      )}
      
      {file && !generatedGifUrl && !isGenerating && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center h-64">
          <div className="bg-blue-50 py-4 px-6 rounded-lg border border-blue-100 mb-4">
            <p className="text-indigo-700 font-medium text-center">
              {file.name}
            </p>
            <p className="text-indigo-500 text-sm text-center mt-1">
              Ready to process
            </p>
          </div>
          <p className="text-gray-500 text-center">
            Click "Generate GIF" to create your animation
          </p>
        </div>
      )}
      
      {isGenerating && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center h-64">
          <LoaderIcon className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
          <p className="text-gray-700 text-center font-medium">
            Generating your GIF...
          </p>
          <p className="text-gray-500 text-sm text-center mt-2">
            This may take a moment depending on the complexity
          </p>
        </div>
      )}
      
      {generatedGifUrl && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex justify-center">
            <img
              src={generatedGifUrl}
              alt="Generated animation"
              className="max-h-64 rounded"
            />
          </div>
          <div className="flex justify-center">
            <a
              href={generatedGifUrl}
              download="excalidraw-animation.gif"
              className="flex items-center py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <DownloadIcon className="h-5 w-5 mr-2" />
              Download GIF
            </a>
          </div>
        </div>
      )}
    </div>
  )
} 