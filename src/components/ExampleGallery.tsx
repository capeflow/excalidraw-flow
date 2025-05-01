import React, { useRef } from 'react'

export const ExampleGallery: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const examples = [
    {
      id: 1,
      title: 'Flowchart Animation',
      gifUrl: '/examples/example.gif',
    },
    {
      id: 2,
      title: 'UI Wireframe',
      gifUrl: '/examples/example.gif',
    },
    {
      id: 3,
      title: 'Process Diagram',
      gifUrl: '/examples/example.gif',
    },
    {
      id: 4,
      title: 'Mind Map',
      gifUrl: '/examples/example.gif',
    },
    {
      id: 5,
      title: 'Architecture Diagram',
      gifUrl: '/examples/example.gif',
    },
  ]
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef
      const scrollAmount = 320
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      }
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Example Animations
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {examples.map((example) => (
          <div
            key={example.id}
            className="bg-white rounded-lg overflow-hidden"
          >
            <div className="h-48 bg-white overflow-hidden">
              <img
                src={example.gifUrl}
                alt={example.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 