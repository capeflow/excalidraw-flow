import { PencilRulerIcon } from 'lucide-react'
export const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-6 flex items-center">
        <PencilRulerIcon className="h-8 w-8 text-indigo-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-800">
          Excalidraw GIF Animator
        </h1>
        <p className="ml-4 text-gray-600">
          Turn your Excalidraw designs into animated GIFs
        </p>
      </div>
    </header>
  )
}
