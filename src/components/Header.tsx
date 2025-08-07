import { PencilRulerIcon, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface HeaderProps {
  onToggleDebug?: () => void
  isDebugOpen?: boolean
}

export function Header({ onToggleDebug, isDebugOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-md border-2 border-gray-900 size-8 shadow-[2px_2px_0_rgba(0,0,0,0.15)] bg-white">
            <PencilRulerIcon className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-gray-900">Excalidraw Flow</div>
            <div className="text-xs text-gray-500">Animate dashed arrows from Excalidraw</div>
          </div>
        </div>
        {onToggleDebug && (
          <Button variant="outline" size="sm" onClick={onToggleDebug}>
            <Bug className="h-4 w-4 mr-2" />
            {isDebugOpen ? 'Hide Debug' : 'Show Debug'}
          </Button>
        )}
      </div>
    </header>
  )
}
