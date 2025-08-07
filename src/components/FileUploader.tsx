import React, { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { UploadIcon, FileIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploaderProps {
  onFileUpload: (file: File | null) => void
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    setSelectedFile(file)
    onFileUpload(file)
  }

  const onButtonClick = () => {
    inputRef.current?.click()
  }

  const removeFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setSelectedFile(null)
    onFileUpload(null)
  }

  return (
    <div className="bg-white p-5 rounded-xl border-2 border-gray-900 shadow-[4px_4px_0_rgba(0,0,0,0.25)]">
      <h2 className="text-base font-semibold text-gray-900 mb-3">Upload Excalidraw File</h2>

      <div
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors shadow-[3px_3px_0_rgba(0,0,0,0.15)] ${
          dragActive ? 'border-gray-900 bg-yellow-50' : 'border-gray-900 hover:bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        {!selectedFile ? (
          <>
            <UploadIcon className="h-10 w-10 text-gray-700 mb-3" />
            <p className="text-gray-800 text-center font-medium mb-1">Drag and drop your Excalidraw file here</p>
            <p className="text-gray-600 text-sm text-center">or click to browse</p>
          </>
        ) : (
          <div className="flex items-center w-full gap-3">
            <FileIcon className="h-8 w-8 text-indigo-600" />
            <div className="flex-1 truncate">
              <p className="text-gray-900 font-medium truncate">{selectedFile.name}</p>
              <p className="text-gray-600 text-sm">{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
            <Button variant="outline" size="sm" onClick={removeFile} aria-label="Remove file">
              <XIcon className="h-4 w-4" />
              Remove
            </Button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".excalidraw,.json"
        onChange={handleChange}
      />
      <p className="text-xs text-gray-600 mt-2">Supported formats: .excalidraw, .json</p>
    </div>
  )
} 