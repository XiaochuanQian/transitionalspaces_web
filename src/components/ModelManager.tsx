'use client'

import { ProgressivePLYLoader } from './ProgressivePLYLoader'
import { ProgressiveDracoLoader } from './ProgressiveDracoLoader'
import { useState, useEffect } from 'react'

// Helper function to generate quality URLs from a base URL
function generateQualityUrls(baseUrl: string) {
  // If it's already a quality-specific URL, extract the base and generate all qualities
  const qualityPattern = /_(ultra_low|low|medium|high)\.ply\.gz$/
  const match = baseUrl.match(qualityPattern)
  
  let basePath: string
  if (match) {
    // Remove the quality suffix to get the base path
    basePath = baseUrl.replace(qualityPattern, '')
  } else {
    // Convert regular PLY path to compressed base path
    if (baseUrl.includes('/models/compressed/')) {
      // Already in compressed folder, just remove extension
      basePath = baseUrl.replace(/\.ply(\.gz)?$/, '')
    } else {
      // Convert from regular models folder to compressed folder
      basePath = baseUrl
        .replace('/models/', '/models/compressed/')
        .replace(/\.ply$/, '')
    }
  }
  
  return {
    ultra_low: `${basePath}_ultra_low.ply.gz`,
    low: `${basePath}_low.ply.gz`,
    medium: `${basePath}_medium.ply.gz`,
    high: `${basePath}_high.ply.gz`
  }
}

// Helper function to generate Draco quality URLs from a base URL
function generateDracoUrls(baseUrl: string) {
  // Extract the base name from PLY URL and convert to Draco path
  let baseName: string
  
  if (baseUrl.includes('/models/')) {
    // Extract filename without extension
    const filename = baseUrl.split('/').pop()?.replace(/\.ply(\.gz)?$/, '') || ''
    baseName = `/models/draco/${filename}`
  } else {
    baseName = baseUrl.replace(/\.ply(\.gz)?$/, '')
  }
  
  return {
    ultra_low: `${baseName}_ultra_low.drc`,
    low: `${baseName}_low.drc`,
    medium: `${baseName}_medium.drc`,
    high: `${baseName}_high.drc`
  }
}

export interface PLYModel {
  id: string
  url: string
  urls?: {
    ultra_low: string
    low: string
    medium: string
    high: string
  }
  dracoUrls?: {
    ultra_low: string
    low: string
    medium: string
    high: string
  }
  name: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  pointSize: number
  color: string
  visible: boolean
  useDraco?: boolean
}

interface ModelManagerProps {
  models: PLYModel[]
  onModelUpdate: (modelId: string, updates: Partial<PLYModel>) => void
  resolution?: number
  progressiveLoading?: boolean
}

type QualityLevel = 'ultra_low' | 'low' | 'medium' | 'high'

export function ModelManager({ models, resolution = 1.0, progressiveLoading = true }: ModelManagerProps) {
  const [loadedModelIds, setLoadedModelIds] = useState<Set<string>>(new Set())
  const [currentlyLoadingId, setCurrentlyLoadingId] = useState<string | null>(null)
  const [currentQuality, setCurrentQuality] = useState<QualityLevel>(progressiveLoading ? 'ultra_low' : 'low')
  const [qualityLoadedCount, setQualityLoadedCount] = useState<Record<QualityLevel, number>>({
    ultra_low: 0,
    low: 0,
    medium: 0,
    high: 0
  })
  
  // Get visible models that should be loaded
  const visibleModels = models.filter(model => model.visible)
  const qualitySequence: QualityLevel[] = progressiveLoading ? ['ultra_low'] : ['medium']
  
  // For progressive loading: Start loading the next model in sequence for current quality
  // For non-progressive: Load all models simultaneously at medium quality
  useEffect(() => {
    if (progressiveLoading) {
      if (currentlyLoadingId) return // Already loading a model
      
      // Find the next model to load at current quality
      const nextModel = visibleModels.find(model => !loadedModelIds.has(model.id))
      if (nextModel) {
        setCurrentlyLoadingId(nextModel.id)
      }
    }
  }, [visibleModels, loadedModelIds, currentlyLoadingId, progressiveLoading])
  
  // Handle when a model finishes loading its initial quality
  const handleModelLoaded = (modelId: string) => {
    setLoadedModelIds(prev => new Set([...prev, modelId]))
    if (progressiveLoading) {
      setCurrentlyLoadingId(null)
    }
  }
  
  // Handle when a specific quality level is loaded for a model
  const handleQualityLoaded = (quality: QualityLevel) => {
    setQualityLoadedCount(prev => ({
      ...prev,
      [quality]: prev[quality] + 1
    }))
  }
  
  // Check if all visible models have loaded the current quality, then advance to next quality (progressive only)
  useEffect(() => {
    if (!progressiveLoading) return
    
    const visibleCount = visibleModels.length
    if (visibleCount === 0) return
    
    const currentQualityIndex = qualitySequence.indexOf(currentQuality)
    const nextQualityIndex = currentQualityIndex + 1
    
    // If all models have loaded current quality and there's a next quality
    if (qualityLoadedCount[currentQuality] >= visibleCount && nextQualityIndex < qualitySequence.length) {
      const nextQuality = qualitySequence[nextQualityIndex]
      setCurrentQuality(nextQuality)
    }
  }, [qualityLoadedCount, currentQuality, visibleModels.length, qualitySequence, progressiveLoading])
  
  // Debug: Check if models have Draco configuration
  // console.log('ModelManager received models:', models.slice(0, 2).map(m => ({ id: m.id, useDraco: m.useDraco, dracoUrls: m.dracoUrls })))
  
  return (
    <>
      {models.map((model) => {
        // For progressive loading: only render if loaded or currently loading
        // For non-progressive: render all visible models simultaneously
        const shouldRender = model.visible && (progressiveLoading ? 
          (loadedModelIds.has(model.id) || currentlyLoadingId === model.id) : 
          true
        )
        
        return shouldRender && (
          model.useDraco ? (
            <ProgressiveDracoLoader
              key={model.id}
              urls={model.dracoUrls || generateDracoUrls(model.url)}
              position={model.position}
              rotation={model.rotation}
              scale={model.scale}
              pointSize={model.pointSize}
              color={model.color}
              resolution={resolution}
              progressiveLoading={progressiveLoading}
              onLoadComplete={() => handleModelLoaded(model.id)}
              targetQuality={currentQuality}
              onQualityLoaded={handleQualityLoaded}
            />
          ) : (
            <ProgressivePLYLoader
              key={model.id}
              urls={model.urls || generateQualityUrls(model.url)}
              position={model.position}
              rotation={model.rotation}
              scale={model.scale}
              pointSize={model.pointSize}
              color={model.color}
              resolution={resolution}
              progressiveLoading={progressiveLoading}
              onLoadComplete={() => handleModelLoaded(model.id)}
              targetQuality={currentQuality}
              onQualityLoaded={handleQualityLoaded}
            />
          )
        )
      })}
    </>
  )
}