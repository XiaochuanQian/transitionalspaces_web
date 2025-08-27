'use client'

import { useState, useEffect } from 'react'
import { Scene3D } from '../../components/Scene3D'
import { PLYModel } from '../../components/ModelManager'

interface UploadedFile {
  file: File
  url: string
  name: string
}

export default function UploadPage() {
  const [plyFiles, setPlyFiles] = useState<UploadedFile[]>([])
  const [configFile, setConfigFile] = useState<File | null>(null)
  const [models, setModels] = useState<PLYModel[]>([])
  const [backgroundColor, setBackgroundColor] = useState('#000000')
  const [pointCloudResolution, setPointCloudResolution] = useState(1.0)
  const [progressiveLoading, setProgressiveLoading] = useState(true)
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)

  // Handle PLY file uploads
  const handlePlyFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newFiles: UploadedFile[] = []
    Array.from(files).forEach(file => {
      if (file.name.toLowerCase().endsWith('.ply')) {
        const url = URL.createObjectURL(file)
        newFiles.push({ file, url, name: file.name })
      }
    })
    
    setPlyFiles(prev => [...prev, ...newFiles])
  }

  // Handle JSON config file upload
  const handleConfigFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.name.toLowerCase().endsWith('.json')) {
      setConfigFile(file)
      loadConfigFromFile(file)
    } else {
      alert('Please select a JSON file')
    }
  }

  // Load configuration from JSON file
  const loadConfigFromFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        if (data.models && Array.isArray(data.models)) {
          // Map the models to use uploaded PLY files
          const mappedModels = data.models.map((model: PLYModel, index: number) => {
            const plyFile = plyFiles[index % plyFiles.length] // Cycle through available files
            return {
              ...model,
              id: Date.now().toString() + index,
              url: plyFile?.url || model.url,
              urls: plyFile ? {
                ultra_low: plyFile.url,
                low: plyFile.url,
                medium: plyFile.url,
                high: plyFile.url
              } : model.urls,
              name: plyFile?.name || model.name
            }
          })
          setModels(mappedModels)
        }
        
        if (data.backgroundColor) {
          setBackgroundColor(data.backgroundColor)
        }
        
        if (data.pointCloudResolution) {
          setPointCloudResolution(data.pointCloudResolution)
        }
        
        if (typeof data.progressiveLoading === 'boolean') {
          setProgressiveLoading(data.progressiveLoading)
        }
        
        setIsConfigLoaded(true)
        alert(`Configuration loaded successfully! ${data.models?.length || 0} models configured.`)
      } catch (error) {
        alert('Failed to load configuration file: ' + error)
      }
    }
    reader.readAsText(file)
  }

  // Create models from uploaded PLY files when no config is loaded
  useEffect(() => {
    if (!isConfigLoaded && plyFiles.length > 0) {
      const generatedModels: PLYModel[] = plyFiles.map((file, index) => {
        const gridSize = 4
        const modelsPerRow = 3
        const row = Math.floor(index / modelsPerRow)
        const col = index % modelsPerRow
        
        return {
          id: Date.now().toString() + index,
          url: file.url,
          urls: {
            ultra_low: file.url,
            low: file.url,
            medium: file.url,
            high: file.url
          },
          name: file.name,
          position: [
            (col - 1) * gridSize,
            0,
            row * gridSize
          ],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          pointSize: 0.01,
          color: '#ffffff',
          visible: true
        }
      })
      setModels(generatedModels)
    }
  }, [plyFiles, isConfigLoaded])

  // Remove PLY file
  const removePlyFile = (index: number) => {
    setPlyFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index)
      // Revoke the object URL to free memory
      URL.revokeObjectURL(prev[index].url)
      return newFiles
    })
  }

  // Clear all files
  const clearAllFiles = () => {
    plyFiles.forEach(file => URL.revokeObjectURL(file.url))
    setPlyFiles([])
    setConfigFile(null)
    setModels([])
    setIsConfigLoaded(false)
  }

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      plyFiles.forEach(file => URL.revokeObjectURL(file.url))
    }
  }, [])

  return (
    <div className="w-full h-screen relative">
      {/* Upload Panel */}
      <div className="absolute top-4 left-4 z-50 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white min-w-[350px] max-w-[400px]">
        <h2 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">Upload Local Files</h2>
        
        {/* PLY Files Section */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-sm font-semibold text-cyan-300 block mb-2">PLY Files</label>
            <label className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm text-center cursor-pointer">
              📁 Select PLY Files
              <input
                type="file"
                accept=".ply"
                multiple
                onChange={handlePlyFileUpload}
                className="hidden"
              />
            </label>
          </div>
          
          {plyFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Uploaded PLY Files ({plyFiles.length}):</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {plyFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800 p-2 rounded text-xs">
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      onClick={() => removePlyFile(index)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* JSON Config Section */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-sm font-semibold text-green-300 block mb-2">Configuration File (Optional)</label>
            <label className="block w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm text-center cursor-pointer">
              📄 Select JSON Config
              <input
                type="file"
                accept=".json"
                onChange={handleConfigFileUpload}
                className="hidden"
              />
            </label>
          </div>
          
          {configFile && (
            <div className="bg-gray-800 p-2 rounded">
              <p className="text-xs text-gray-400">Config File:</p>
              <p className="text-xs text-green-300 truncate">{configFile.name}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={clearAllFiles}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm"
            disabled={plyFiles.length === 0 && !configFile}
          >
            🗑️ Clear All Files
          </button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-400 pt-3 border-t border-white/20 mt-4">
          <p className="mb-2"><strong>Instructions:</strong></p>
          <p>• Upload PLY files to display them in 3D</p>
          <p>• Optionally upload a JSON config file to apply saved settings</p>
          <p>• JSON config will override default positioning and settings</p>
        </div>
      </div>

      {/* 3D Scene */}
      <div 
        className="w-full h-full" 
        style={{ 
          touchAction: 'none',
          userSelect: 'none',
          overflow: 'hidden',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          KhtmlUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        {models.length > 0 ? (
          <Scene3D 
            uploadedModels={models}
            uploadedBackgroundColor={backgroundColor}
            uploadedPointCloudResolution={pointCloudResolution}
            uploadedProgressiveLoading={progressiveLoading}
          />
        ) : (
          <div className="w-full h-full bg-black flex items-center justify-center">
            <div className="text-white text-center">
              <h3 className="text-xl mb-2">No PLY files uploaded</h3>
              <p className="text-gray-400">Upload PLY files to view them in 3D</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}