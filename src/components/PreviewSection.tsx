import React from 'react'
import { DownloadIcon, LoaderIcon } from 'lucide-react'

interface PreviewSectionProps {
  file: File | null
  generatedGifUrl: string
  isGenerating: boolean
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({ file, generatedGifUrl, isGenerating }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-sm font-semibold text-gray-800">Preview</h2>
        {generatedGifUrl && (
          <a
            href={generatedGifUrl}
            download="excalidraw-animation.gif"
            className="inline-flex items-center py-1.5 px-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Download GIF
          </a>
        )}
      </div>

      {!file && !generatedGifUrl && (
        <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg grid place-content-center text-center p-8">
          <div className="mx-auto mb-4 opacity-90">
            <svg width="160" height="110" viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <filter id="rough" x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
              <path id="arrowPath" d="M15 75 C 50 25, 100 25, 145 75" stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" filter="url(#rough)" strokeDasharray="6 6">
                <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.6s" repeatCount="indefinite" />
              </path>
              <polygon points="140,70 150,75 143,82" fill="#111827" filter="url(#rough)">
                <animateTransform attributeName="transform" type="translate" values="0 0; 1 1; 0 0" dur="1.2s" repeatCount="indefinite" />
              </polygon>
              <circle cx="40" cy="38" r="3" fill="#F59E0B">
                <animate attributeName="r" values="3;4;3" dur="1.4s" repeatCount="indefinite" />
              </circle>
              <circle cx="95" cy="30" r="2" fill="#60A5FA">
                <animate attributeName="r" values="2;3;2" dur="1.4s" begin="0.2s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <p className="text-gray-800 font-semibold">Drop your .excalidraw file here</p>
          <p className="text-gray-600 text-sm">or use the uploader in the sidebar</p>
        </div>
      )}

      {file && !generatedGifUrl && !isGenerating && (
        <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg grid place-content-center p-6 text-center">
          <div className="bg-blue-50 py-4 px-6 rounded-lg border border-blue-100 mb-3">
            <p className="text-indigo-700 font-medium">{file.name}</p>
            <p className="text-indigo-500 text-sm mt-1">Ready to process</p>
          </div>
          <p className="text-gray-500">Click "Generate GIF" to create your animation</p>
        </div>
      )}

      {isGenerating && (
        <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg grid place-content-center p-6 text-center">
          <LoaderIcon className="h-10 w-10 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-700 font-medium">Generating your GIF...</p>
          <p className="text-gray-500 text-sm mt-1">This may take a moment depending on the complexity</p>
        </div>
      )}

      {generatedGifUrl && (
        <div className="flex-1 rounded-lg border bg-gray-50 overflow-auto grid place-items-center p-4">
          <img
            src={generatedGifUrl}
            alt="Generated animation"
            className="max-h-full max-w-full rounded object-contain"
          />
        </div>
      )}
    </div>
  )
}