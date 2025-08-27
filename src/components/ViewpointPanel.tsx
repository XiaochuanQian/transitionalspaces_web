'use client'

import { useState } from 'react'

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

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 dark:hover:bg-stone-600 text-stone-50 border border-stone-700 dark:border-stone-600 p-3 shadow-2xl transition-all duration-200 flex items-center space-x-2"
        style={{ fontFamily: '"Crimson Text", serif' }}
      >
        <span className="text-lg"></span>
        <span className="font-medium">Viewpoints</span>
        <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Viewpoint Panel */}
      {isExpanded && (
        <div className="mt-2 bg-white dark:bg-stone-800 shadow-2xl border border-stone-300 dark:border-stone-700 overflow-hidden">
          <div className="p-4 lg:p-6 max-w-sm" style={{ fontFamily: '"Crimson Text", serif' }}>
            {/* Free View Button */}
            <button
              onClick={() => onViewpointChange(null)}
              className={`w-full p-3 text-left transition-all duration-200 mb-2 border ${
                currentViewpoint === null
                  ? 'bg-stone-800 dark:bg-stone-700 text-stone-50 border-stone-700 dark:border-stone-600 shadow-lg'
                  : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border-stone-200 dark:border-stone-700'
              }`}
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
                  className={`w-full p-3 text-left transition-all duration-200 border ${
                    currentViewpoint === viewpoint.id
                      ? 'bg-stone-800 dark:bg-stone-700 text-stone-50 border-stone-700 dark:border-stone-600 shadow-lg'
                      : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border-stone-200 dark:border-stone-700'
                  }`}
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
              <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
                <div className="text-xs text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-2">
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
    </div>
  )
}