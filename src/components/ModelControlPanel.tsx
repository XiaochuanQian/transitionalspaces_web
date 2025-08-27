'use client'

import { useState } from 'react'
import { PLYModel } from './ModelManager'

interface ModelControlPanelProps {
  models: PLYModel[]
  onModelUpdate: (modelId: string, updates: Partial<PLYModel>) => void
  onAddModel: () => void
  onRemoveModel: (modelId: string) => void
  availableFiles: { id: string; name: string; urls: { ultra_low: string; low: string; medium: string; high: string } }[]
}

export function ModelControlPanel({ 
  models, 
  onModelUpdate, 
  onAddModel, 
  onRemoveModel,
  availableFiles
}: ModelControlPanelProps) {
  const [expandedModel, setExpandedModel] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState<boolean>(true)

  const updateModel = (modelId: string, key: keyof PLYModel, value: string | number | boolean | [number, number, number]) => {
    onModelUpdate(modelId, { [key]: value })
  }

  const updatePosition = (modelId: string, axis: number, value: number) => {
    const model = models.find(m => m.id === modelId)
    if (model) {
      const newPosition = [...model.position] as [number, number, number]
      newPosition[axis] = value
      onModelUpdate(modelId, { position: newPosition })
    }
  }

  const updateRotation = (modelId: string, axis: number, value: number) => {
    const model = models.find(m => m.id === modelId)
    if (model) {
      const newRotation = [...model.rotation] as [number, number, number]
      newRotation[axis] = value
      onModelUpdate(modelId, { rotation: newRotation })
    }
  }

  const updateScale = (modelId: string, axis: number, value: number) => {
    const model = models.find(m => m.id === modelId)
    if (model) {
      const newScale = [...model.scale] as [number, number, number]
      newScale[axis] = value
      onModelUpdate(modelId, { scale: newScale })
    }
  }

  const handleFileChange = (modelId: string, fileUrl: string) => {
    // Find the file that contains this URL in any of its quality levels
    const selectedFile = availableFiles.find(f => 
      Object.values(f.urls).includes(fileUrl)
    )
    if (selectedFile) {
      onModelUpdate(modelId, {
        url: fileUrl,
        urls: selectedFile.urls,
        name: selectedFile.name
      })
    }
  }

  if (!isVisible) {
    return (
      <button
        type="button"
        aria-label="Show model controls"
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm text-white rounded px-3 py-2 text-sm border border-white/20 hover:bg-black"
        style={{ touchAction: 'auto' }}
      >
        Show Controls
      </button>
    )
  }

  return (
    <div 
      className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white min-w-[350px] max-h-[80vh] overflow-y-auto control-panel"
      style={{
        touchAction: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-white/20 pb-2">
          <h2 className="text-lg font-bold">Model Manager</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onAddModel}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            >
              + Add Model
            </button>
            <button
              type="button"
              aria-label="Hide model controls"
              onClick={() => setIsVisible(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
            >
              Hide
            </button>
          </div>
        </div>

        {models.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No models loaded</p>
            <p className="text-sm">Click &quot;Add Model&quot; to load a PLY file</p>
          </div>
        ) : (
          <div className="space-y-4">
            {models.map((model) => (
              <div key={model.id} className="border border-white/20 rounded-lg p-3">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={model.visible}
                      onChange={(e) => updateModel(model.id, 'visible', e.target.checked)}
                      className="rounded"
                    />
                    <span className="font-medium">{model.name}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setExpandedModel(expandedModel === model.id ? null : model.id)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      {expandedModel === model.id ? '▼' : '▶'}
                    </button>
                    <button
                      onClick={() => onRemoveModel(model.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {expandedModel === model.id && (
                  <div className="space-y-4">
                    {/* File Selection */}
                    <div>
                      <h4 className="text-sm font-semibold text-cyan-300 mb-2">PLY File</h4>
                      <select
                        value={model.url}
                        onChange={(e) => handleFileChange(model.id, e.target.value)}
                        className="w-full bg-gray-800 text-white rounded px-2 py-1 text-sm"
                      >
                        {availableFiles.map((file) => (
                          <optgroup key={file.id} label={file.name}>
                            <option value={file.urls.ultra_low}>
                              {file.name} - Ultra Low (Fastest)
                            </option>
                            <option value={file.urls.low}>
                              {file.name} - Low
                            </option>
                            <option value={file.urls.medium}>
                              {file.name} - Medium
                            </option>
                            <option value={file.urls.high}>
                              {file.name} - High (Best Quality)
                            </option>
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {/* Position Controls */}
                    <div>
                      <h4 className="text-sm font-semibold text-blue-300 mb-2">Position</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {['X', 'Y', 'Z'].map((axis, index) => (
                          <div key={axis}>
                            <div className="flex items-center space-x-1 mb-1">
                              <label className="text-xs">{axis}:</label>
                              <input
                                type="number"
                                step="0.1"
                                value={model.position[index].toFixed(2)}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0
                                  updatePosition(model.id, index, value)
                                }}
                                className="w-16 bg-gray-800 text-white px-1 py-0.5 rounded text-xs border border-gray-600"
                              />
                            </div>
                            <input
                              type="range"
                              min="-20"
                              max="20"
                              step="0.1"
                              value={model.position[index]}
                              onChange={(e) => updatePosition(model.id, index, parseFloat(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rotation Controls */}
                    <div>
                      <h4 className="text-sm font-semibold text-green-300 mb-2">Rotation (degrees)</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {['X', 'Y', 'Z'].map((axis, index) => (
                          <div key={axis}>
                            <div className="flex items-center space-x-1 mb-1">
                              <label className="text-xs">{axis}:</label>
                              <input
                                type="number"
                                step="1"
                                value={Math.round(model.rotation[index] * 180 / Math.PI)}
                                onChange={(e) => {
                                  const value = (parseFloat(e.target.value) || 0) * Math.PI / 180
                                  updateRotation(model.id, index, value)
                                }}
                                className="w-16 bg-gray-800 text-white px-1 py-0.5 rounded text-xs border border-gray-600"
                              />
                            </div>
                            <input
                              type="range"
                              min="-180"
                              max="180"
                              step="1"
                              value={model.rotation[index] * 180 / Math.PI}
                              onChange={(e) => updateRotation(model.id, index, parseFloat(e.target.value) * Math.PI / 180)}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Scale Controls */}
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-300 mb-2">Scale</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {['X', 'Y', 'Z'].map((axis, index) => (
                          <div key={axis}>
                            <div className="flex items-center space-x-1 mb-1">
                              <label className="text-xs">{axis}:</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="5"
                                value={model.scale[index].toFixed(2)}
                                onChange={(e) => {
                                  const value = Math.max(0.1, Math.min(5, parseFloat(e.target.value) || 1))
                                  updateScale(model.id, index, value)
                                }}
                                className="w-16 bg-gray-800 text-white px-1 py-0.5 rounded text-xs border border-gray-600"
                              />
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="5"
                              step="0.1"
                              value={model.scale[index]}
                              onChange={(e) => updateScale(model.id, index, parseFloat(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Point Cloud Settings */}
                    <div>
                      <h4 className="text-sm font-semibold text-purple-300 mb-2">Point Cloud</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
                            <label className="text-xs">Point Size:</label>
                            <input
                              type="number"
                              step="0.001"
                              min="0.001"
                              max="0.1"
                              value={model.pointSize.toFixed(3)}
                              onChange={(e) => {
                                const value = Math.max(0.001, Math.min(0.1, parseFloat(e.target.value) || 0.02))
                                updateModel(model.id, 'pointSize', value)
                              }}
                              className="w-20 bg-gray-800 text-white px-1 py-0.5 rounded text-xs border border-gray-600"
                            />
                          </div>
                          <input
                            type="range"
                            min="0.001"
                            max="0.1"
                            step="0.001"
                            value={model.pointSize}
                            onChange={(e) => updateModel(model.id, 'pointSize', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs">Color</label>
                          <input
                            type="color"
                            value={model.color}
                            onChange={(e) => updateModel(model.id, 'color', e.target.value)}
                            className="w-full h-8 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reset Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          onModelUpdate(model.id, {
                            position: [0, 0, 0],
                            rotation: [0, 0, 0],
                            scale: [1, 1, 1]
                          })
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs"
                      >
                        Reset Transform
                      </button>
                      <button
                        onClick={() => {
                          onModelUpdate(model.id, {
                            pointSize: 0.02,
                            color: '#ffffff'
                          })
                        }}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-1 px-2 rounded text-xs"
                      >
                        Reset Style
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}