'use client'

import { useState, useEffect } from 'react'

interface Viewpoint {
  id: string
  name: string
  position: [number, number, number]
  target: [number, number, number]
  fov?: number
  description?: string
  thumbnail?: string
}

interface ViewpointPanelProps {
  viewpoints: Viewpoint[]
  currentViewpoint: string | null
  onViewpointChange: (viewpointId: string | null) => void
}

export default function ViewpointPanel({
  viewpoints,
  currentViewpoint,
  onViewpointChange
}: ViewpointPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Handle keyboard events for toggling panel visibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'l') {
        event.preventDefault()
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50">
      {isVisible && (
        <>
          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-stone-50 border-2 border-white rounded hover:bg-white hover:bg-opacity-20 p-3 transition-all duration-200 flex items-center space-x-2"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          >
            <span className="text-lg"></span>
            <span className="font-medium">Viewpoints</span>
            <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

      {/* Viewpoint Panel */}
      {isExpanded && (
        <div className="mt-2 bg-black bg-opacity-20 overflow-hidden border-2 border-white rounded">
          <div className="p-4 lg:p-6 max-w-sm" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            {/* Free View Button */}
            <button
              onClick={() => onViewpointChange(null)}
              className={`w-full p-3 text-left transition-all duration-200 mb-2 border-2 rounded ${
                currentViewpoint === null
                  ? 'text-white border-white bg-white bg-opacity-20'
                  : 'text-white border-white hover:bg-white hover:bg-opacity-20'
              }`}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              <div className="flex items-center">
                <div>
                  <div className="font-semibold">Free View</div>
                </div>
                {currentViewpoint === null && (
                  <span className="ml-auto text-stone-400">●</span>
                )}
              </div>
            </button>

            {/* Viewpoint List */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {viewpoints.map((viewpoint) => (
                <button
                  key={viewpoint.id}
                  onClick={() => onViewpointChange(viewpoint.id)}
                  className={`w-full p-3 text-left transition-all duration-200 border-2 rounded ${
                    currentViewpoint === viewpoint.id
                      ? 'text-white border-white bg-white bg-opacity-20'
                      : 'text-white border-white hover:bg-white hover:bg-opacity-20'
                  }`}
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                >
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="font-semibold">{viewpoint.name}</div>
                    </div>
                    {currentViewpoint === viewpoint.id && (
                      <span className="text-stone-400">●</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Current Status */}
            {currentViewpoint && (
              <div className="mt-3 pt-3 border-t border-white border-opacity-30">
                <div className="text-xs text-white p-2 border-2 border-white rounded" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  <div className="flex items-center space-x-2">
                    <span></span>
                    <span>
                      Active: {viewpoints.find(v => v.id === currentViewpoint)?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
                </div>
              )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}