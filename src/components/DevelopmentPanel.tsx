'use client'

import { useState } from 'react'
import { PLYModel } from './ModelManager'



interface DevelopmentPanelProps {
  models: PLYModel[];
  onModelsChange: (models: PLYModel[]) => void;
  availableFiles: Array<{
    id: string
    name: string
    urls: {
      ultra_low: string
      low: string
      medium: string
      high: string
    }
  }>
  backgroundColor: string
  onBackgroundColorChange: (color: string) => void
  pointCloudResolution: number
  onPointCloudResolutionChange: (resolution: number) => void
  progressiveLoading: boolean
  onProgressiveLoadingChange: (enabled: boolean) => void
  isRecordingPath: boolean
  onRecordingPathChange: (isRecording: boolean) => void
  activityRadius: number
  onActivityRadiusChange: (radius: number) => void
  pathPoints: Array<[number, number, number]>
  onPathPointAdd: (_point: [number, number, number]) => void
  onClearPath: () => void
  showPath: boolean
  onShowPathChange: (show: boolean) => void
  pathEnabled: boolean
  onPathEnabledChange: (enabled: boolean) => void
  boundaryHeight: number
  onBoundaryHeightChange: (height: number) => void
  viewpoints: Array<{
    id: string
    name: string
    position: [number, number, number]
    target: [number, number, number]
    fov?: number
    description?: string
    thumbnail?: string
  }>
  currentViewpoint: string | null
  onViewpointChange: (viewpointId: string | null) => void
  onViewpointDelete?: (viewpointId: string) => void
  onViewpointRename?: (viewpointId: string, newName: string) => void
  onViewpointsImport?: (viewpoints: Array<{
    id: string
    name: string
    position: [number, number, number]
    target: [number, number, number]
    fov?: number
    description?: string
    thumbnail?: string
  }>) => void
  showModelManager?: boolean
  onShowModelManagerChange?: (show: boolean) => void
  showViewpointPanel?: boolean
  onShowViewpointPanelChange?: (show: boolean) => void
}

export default function DevelopmentPanel({
  models,
  onModelsChange,
  availableFiles,
  backgroundColor,
  onBackgroundColorChange,
  pointCloudResolution,
  onPointCloudResolutionChange,
  progressiveLoading,
  onProgressiveLoadingChange,
  isRecordingPath,
  onRecordingPathChange,
  activityRadius,
  onActivityRadiusChange,
  pathPoints,
  onPathPointAdd,
  onClearPath,
  showPath,
  onShowPathChange,
  pathEnabled,
  onPathEnabledChange,
  boundaryHeight,
  onBoundaryHeightChange,
  viewpoints,
  currentViewpoint,
  onViewpointChange,
  onViewpointDelete,
  onViewpointRename,
  onViewpointsImport,
  showModelManager = true,
  onShowModelManagerChange,
  showViewpointPanel = true,
  onShowViewpointPanelChange
}: DevelopmentPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const saveToFile = () => {
    const data = {
      models,
      backgroundColor,
      pointCloudResolution,
      progressiveLoading,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ply-models-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const loadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.models && Array.isArray(data.models)) {
          onModelsChange(data.models)
          if (data.backgroundColor) {
            onBackgroundColorChange(data.backgroundColor)
          }
          if (data.pointCloudResolution) {
            onPointCloudResolutionChange(Number(data.pointCloudResolution))
          }
          if (typeof data.progressiveLoading === 'boolean') {
            onProgressiveLoadingChange(data.progressiveLoading)
          }
          alert(`Loaded ${data.models.length} models, background color, resolution, and progressive loading setting from file`)
        } else {
          alert('Invalid file format')
        }
      } catch (error) {
        alert('Failed to load file: ' + error)
      }
    }
    reader.readAsText(file)
  }

  const exportCustomViewpoints = () => {
    const customViewpoints = viewpoints.filter(vp => vp.id.startsWith('custom-'))
    
    if (customViewpoints.length === 0) {
      alert('No custom viewpoints to export')
      return
    }
    
    const data = {
      customViewpoints,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `custom-viewpoints-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importCustomViewpoints = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          if (data.customViewpoints && Array.isArray(data.customViewpoints)) {
             if (onViewpointsImport) {
               onViewpointsImport(data.customViewpoints)
               alert(`Successfully imported ${data.customViewpoints.length} custom viewpoints!`)
             } else {
               alert(`Found ${data.customViewpoints.length} custom viewpoints, but import callback is not implemented.`)
               console.log('Imported viewpoints:', data.customViewpoints)
             }
          } else {
            alert('Invalid viewpoints file format')
          }
        } catch (error) {
          alert('Failed to load viewpoints file: ' + error)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all saved data? This cannot be undone.')) {
      localStorage.removeItem('ply-models')
      localStorage.removeItem('ply-background-color')
      localStorage.removeItem('ply-resolution')
      localStorage.removeItem('ply-progressive-loading')
      window.location.reload()
    }
  }

  const resetToDefault = () => {
    if (confirm('Reset to default layout?')) {
      const defaultModel: PLYModel = {
        id: '1',
        url: availableFiles[0].urls.ultra_low,
        urls: availableFiles[0].urls,
        name: availableFiles[0].name,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        pointSize: 0.01,
        color: '#ffffff',
        visible: true
      }
      onModelsChange([defaultModel])
      onBackgroundColorChange('#000000')
      onPointCloudResolutionChange(1.0)
      onProgressiveLoadingChange(true)
    }
  }

  const exportCurrentState = () => {
    const state = {
      models,
      backgroundColor,
      pointCloudResolution,
      progressiveLoading,
      availableFiles,
      // Add user activity range related state
      activityRange: {
        isRecordingPath,
        activityRadius,
        pathPoints,
        showPath,
        pathEnabled
      },
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
    console.log('Current State:', state)
    alert('Current state logged to console')
  }

  // Export path data to JSON file
  const exportPathToJSON = () => {
    const pathData = {
      version: '1.1',
      activityRange: {
        activityRadius,
        pathPoints,
        showPath,
        pathEnabled,
        boundaryHeight
      }
    }
    
    // Create and download JSON file
    const dataStr = JSON.stringify(pathData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `path-data-${new Date().toISOString().slice(0, 10)}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }
  
  // Import path data from JSON file
  const importPathFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        
        // Check if it's a valid path data file
        if (data.activityRange && Array.isArray(data.activityRange.pathPoints)) {
          // Update path points
          onClearPath() // Clear existing path
          
          // Set activity radius if available
          if (typeof data.activityRange.activityRadius === 'number') {
            onActivityRadiusChange(data.activityRange.activityRadius)
          }
          
          // Set path visibility if available
          if (typeof data.activityRange.showPath === 'boolean') {
            onShowPathChange(data.activityRange.showPath)
          }
          
          // Set path enabled state if available
          if (typeof data.activityRange.pathEnabled === 'boolean') {
            onPathEnabledChange(data.activityRange.pathEnabled)
          }
          
          // Set boundary height if available
          if (typeof data.activityRange.boundaryHeight === 'number') {
            onBoundaryHeightChange(data.activityRange.boundaryHeight)
          }
          
          alert(`Successfully imported ${data.activityRange.pathPoints.length} path points`)
        } else {
          alert('Invalid path data file format')
        }
      } catch (error) {
        console.error('Error importing path data:', error)
        alert('Error importing path data. Please check the file format.')
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    event.target.value = ''
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg"
        title="Development Panel"
      >
        🔧
      </button>

      {/* Development Panel */}
      {isOpen && (
        <div 
          className="fixed bottom-20 right-4 z-50 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white min-w-[300px] control-panel"
          style={{
            touchAction: 'auto',
            WebkitOverflowScrolling: 'touch',
            maxHeight: '60vh',
            overflowY: 'auto'
          }}
        >
          <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">Development Panel</h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-300 mb-2">Current Models: {models.length}</p>
              <p className="text-xs text-gray-400">Data is auto-saved to localStorage</p>
            </div>

            {/* Background Color Control */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-cyan-300">Background Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => onBackgroundColorChange(e.target.value)}
                  className="w-12 h-8 rounded border border-white/20"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => onBackgroundColorChange(e.target.value)}
                  className="flex-1 bg-gray-800 text-white px-2 py-1 rounded text-sm"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Panel Visibility Settings */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-purple-300">Panel Visibility</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Model Manager</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showModelManager}
                      onChange={(e) => onShowModelManagerChange?.(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Viewpoint Panel</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showViewpointPanel}
                      onChange={(e) => onShowViewpointPanelChange?.(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Point Cloud Resolution Control */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-green-300">Point Cloud Resolution</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={pointCloudResolution}
                    onChange={(e) => onPointCloudResolutionChange(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs w-12 text-right">{pointCloudResolution.toFixed(1)}x</span>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => onPointCloudResolutionChange(0.25)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs"
                  >
                    Low
                  </button>
                  <button
                    onClick={() => onPointCloudResolutionChange(0.5)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs"
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => onPointCloudResolutionChange(1.0)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs"
                  >
                    High
                  </button>
                  <button
                    onClick={() => onPointCloudResolutionChange(2.0)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs"
                  >
                    Ultra
                  </button>
                </div>
              </div>
            </div>

            {/* Progressive Loading Control */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-purple-300">Progressive Loading</label>
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={progressiveLoading}
                    onChange={(e) => onProgressiveLoadingChange(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm text-white">
                     {progressiveLoading ? 'Enabled (up to Medium)' : 'Disabled (High quality only)'}
                   </span>
                </label>
              </div>
              <p className="text-xs text-gray-400">
                 {progressiveLoading 
                   ? 'Models load progressively: Ultra Low → Low'
                   : 'Models load highest quality directly (High only)'
                 }
               </p>
            </div>

            {/* User Activity Range Control */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-orange-300">User Activity Range</label>
              
              {/* 路径启用/禁用控制 */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pathEnabled}
                    onChange={(e) => onPathEnabledChange(e.target.checked)}
                    className="w-4 h-4 text-orange-600 bg-gray-800 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm text-white">
                    {pathEnabled ? '路径限制已启用' : '路径限制已禁用'}
                  </span>
                </label>
              </div>
              
              {/* 路径可见性控制 */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPath}
                    onChange={(e) => onShowPathChange(e.target.checked)}
                    className="w-4 h-4 text-orange-600 bg-gray-800 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm text-white">
                    {showPath ? '路径可视化已显示' : '路径可视化已隐藏'}
                  </span>
                </label>
              </div>
              
              {/* Boundary Height Control */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-300 w-16">Height:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={boundaryHeight}
                    onChange={(e) => onBoundaryHeightChange(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs w-12 text-right">{boundaryHeight.toFixed(1)}m</span>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => onBoundaryHeightChange(1)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs"
                  >
                    Low
                  </button>
                  <button
                    onClick={() => onBoundaryHeightChange(3)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs"
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => onBoundaryHeightChange(6)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs"
                  >
                    High
                  </button>
                </div>
              </div>
              
              {/* Height Zones Management */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Height Zones:</span>
                  <button
                    onClick={() => {
                      // TODO: 实现添加新高度区域的功能
                      console.log('Add height zone clicked')
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white py-1 px-2 rounded text-xs"
                  >
                    Add Zone
                  </button>
                </div>
                
                {/* Height Zones List */}
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {pathPoints.length > 0 && (
                    <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span>Zone 1 (Default)</span>
                        <span className="text-blue-400">{boundaryHeight.toFixed(1)}m</span>
                      </div>
                      <div className="text-gray-500">
                        Points: {pathPoints.length}
                      </div>
                    </div>
                  )}
                  
                  {/* Placeholder for future zones */}
                  <div className="text-xs text-gray-500 text-center py-2">
                    {pathPoints.length === 0 ? 'Record a path to create zones' : 'Click "Add Zone" to create custom height areas'}
                  </div>
                </div>
                
                {/* Zone Management Tools */}
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      // TODO: 实现编辑模式切换
                      console.log('Edit zones clicked')
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs"
                    disabled={pathPoints.length === 0}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      // TODO: 实现重置所有区域
                      console.log('Reset zones clicked')
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded text-xs"
                    disabled={pathPoints.length === 0}
                  >
                    Reset
                  </button>
                </div>
              </div>
              
              {/* Viewpoint Navigation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Viewpoints:</span>
                  <button
                    onClick={() => onViewpointChange(null)}
                    className={`py-1 px-2 rounded text-xs ${
                      currentViewpoint === null
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    Free View
                  </button>
                </div>
                
                {/* Viewpoint List */}
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {viewpoints.map((viewpoint) => (
                    <div key={viewpoint.id} className="text-xs">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onViewpointChange(viewpoint.id)}
                          className={`flex-1 text-left p-2 rounded transition-colors ${
                            currentViewpoint === viewpoint.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{viewpoint.name}</span>
                            {currentViewpoint === viewpoint.id && (
                              <span className="text-blue-200">●</span>
                            )}
                          </div>
                          {viewpoint.description && (
                            <div className="text-gray-400 mt-1 text-xs">
                              {viewpoint.description}
                            </div>
                          )}
                        </button>
                        
                        {/* Custom viewpoint management buttons */}
                        {viewpoint.id.startsWith('custom-') && onViewpointDelete && onViewpointRename && (
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => {
                                const newName = prompt('Enter new name:', viewpoint.name)
                                if (newName && newName.trim()) {
                                  onViewpointRename(viewpoint.id, newName.trim())
                                }
                              }}
                              className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                              title="Rename viewpoint"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete viewpoint "${viewpoint.name}"?`)) {
                                  onViewpointDelete(viewpoint.id)
                                }
                              }}
                              className="p-1 bg-red-700 hover:bg-red-600 rounded text-xs"
                              title="Delete viewpoint"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Instructions for creating custom viewpoints */}
                <div className="text-xs text-gray-400 bg-gray-800/50 p-2 rounded">
                  <div className="flex items-center space-x-1 mb-1">
                    <span>💡</span>
                    <span className="font-medium">Create Custom Viewpoint:</span>
                  </div>
                  <div>Press <kbd className="bg-gray-700 px-1 rounded">Ctrl+C</kbd> to capture current camera position</div>
                </div>
                
                {/* Export/Import Custom Viewpoints */}
                <div className="flex space-x-2">
                  <button
                    onClick={exportCustomViewpoints}
                    className="flex-1 px-3 py-2 bg-green-700 hover:bg-green-600 text-white rounded text-xs transition-colors"
                    title="Export custom viewpoints to JSON file"
                  >
                    📤 Export Viewpoints
                  </button>
                  <button
                    onClick={importCustomViewpoints}
                    className="flex-1 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                    title="Import custom viewpoints from JSON file"
                  >
                    📥 Import Viewpoints
                  </button>
                </div>
                
                {/* Viewpoint Status */}
                {currentViewpoint && (
                  <div className="text-xs text-blue-400 bg-blue-900/20 p-2 rounded">
                    <div className="flex items-center space-x-1">
                      <span>📍</span>
                      <span>Viewpoint mode active</span>
                    </div>
                    <div className="text-gray-400 mt-1">
                      Click &quot;Free View&quot; to return to manual control
                    </div>
                  </div>
                )}
              </div>
              
              {/* Recording Control */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecordingPath}
                    onChange={(e) => onRecordingPathChange(e.target.checked)}
                    className="w-4 h-4 text-orange-600 bg-gray-800 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-sm text-white">
                    {isRecordingPath ? 'Recording Path...' : 'Start Recording Path'}
                  </span>
                </label>
              </div>
              

              
              {/* Path Information and Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Path Points: {pathPoints.length}</span>
                  <div className="flex space-x-2">
                    {pathPoints.length > 0 && (
                      <>
                        <button
                          onClick={exportPathToJSON}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs"
                        >
                          Export
                        </button>
                        <button
                          onClick={onClearPath}
                          className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-xs"
                          disabled={pathPoints.length === 0}
                        >
                          Clear
                        </button>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".json"
                      onChange={importPathFromJSON}
                      className="hidden"
                      id="path-import"
                    />
                    <label
                      htmlFor="path-import"
                      className="bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded text-xs cursor-pointer"
                    >
                      Import
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {isRecordingPath 
                    ? 'Move camera to record boundary path. Walk to define the activity area.'
                    : pathPoints.length > 0 
                      ? `Activity boundary defined by recorded path. Movement ${pathEnabled ? 'restricted' : 'unrestricted'} within boundary.`
                      : 'Click Start Recording to walk and define activity boundaries.'
                  }
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={saveToFile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm"
              >
                💾 Export to File
              </button>
              
              <label className="block w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm text-center cursor-pointer">
                📁 Import from File
                <input
                  type="file"
                  accept=".json"
                  onChange={loadFromFile}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={resetToDefault}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-sm"
              >
                🔄 Reset to Default
              </button>
              
              <button
                onClick={exportCurrentState}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-sm"
              >
                📊 Log State to Console
              </button>
              
              <button
                onClick={clearAllData}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm"
              >
                🗑️ Clear All Data
              </button>
            </div>

            <div className="text-xs text-gray-400 pt-2 border-t border-white/20">
              <p>• Auto-save: Every model change</p>
              <p>• Storage: Browser localStorage</p>
              <p>• Format: JSON with metadata</p>
              <p>• Background: Saved with layout</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}