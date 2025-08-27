import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { GzipPLYLoader } from '../utils/gzipPLYLoader'

interface ProgressivePLYLoaderProps {
  urls: {
    ultra_low: string
    low: string
    medium: string
    high: string
  }
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  pointSize?: number
  color?: string
  visible?: boolean
  resolution?: number
  progressiveLoading?: boolean
  onLoadComplete?: () => void
  targetQuality?: QualityLevel
  onQualityLoaded?: (quality: QualityLevel) => void
}

type QualityLevel = 'ultra_low' | 'low' | 'medium' | 'high'

export function ProgressivePLYLoader({
  urls,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  pointSize = 0.01,
  color = '#ffffff',
  visible = true,
  resolution = 1.0,
  progressiveLoading = true,
  onLoadComplete,
  targetQuality,
  onQualityLoaded
}: ProgressivePLYLoaderProps) {
  const [currentQuality, setCurrentQuality] = useState<QualityLevel>('ultra_low')
  const [loadedGeometries, setLoadedGeometries] = useState<Partial<Record<QualityLevel, THREE.BufferGeometry>>>({})
  const [isLoading, setIsLoading] = useState(false)
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Progressive loading sequence - limit to low when progressive loading is enabled
  // When disabled, load highest quality directly
  const qualitySequence: QualityLevel[] = progressiveLoading 
    ? ['ultra_low', 'low'] 
    : ['high']
  
  // Load a specific quality level
  const loadQuality = async (quality: QualityLevel) => {
    if (loadedGeometries[quality]) return // Already loaded
    
    setIsLoading(true)
    const loader = new GzipPLYLoader()
    
    return new Promise<void>((resolve, reject) => {
      loader.load(
        urls[quality],
        (geometry) => {
          setLoadedGeometries(prev => ({ ...prev, [quality]: geometry }))
          setCurrentQuality(quality)
          setIsLoading(false)
          resolve()
        },
        undefined,
        (error) => {
          console.error(`Error loading ${quality} quality:`, error)
          setIsLoading(false)
          reject(error)
        }
      )
    })
  }

  // Load target quality when specified
  useEffect(() => {
    if (!targetQuality) return
    if (loadedGeometries[targetQuality]) return // Already loaded
    
    let isCancelled = false
    
    const loadTargetQuality = async () => {
      try {
        await loadQuality(targetQuality)
        
        if (!isCancelled) {
          // Call onLoadComplete after the first quality loads (model becomes visible)
          if (targetQuality === 'ultra_low' && onLoadComplete) {
            onLoadComplete()
          }
          
          // Notify that this quality level has been loaded
          if (onQualityLoaded) {
            onQualityLoaded(targetQuality)
          }
        }
      } catch (error) {
        console.warn(`Failed to load ${targetQuality} quality:`, error)
      }
    }
    
    loadTargetQuality()
    
    return () => {
      isCancelled = true
    }
  }, [targetQuality, urls.ultra_low, urls.low, urls.medium, urls.high])
  
  // Fallback: Start with ultra_low if no targetQuality is specified (backward compatibility)
  useEffect(() => {
    if (targetQuality) return // External control is active
    
    let isCancelled = false
    let hasCalledComplete = false
    
    const progressiveLoad = async () => {
      for (const quality of qualitySequence) {
        if (isCancelled) break
        
        try {
          await loadQuality(quality)
          
          // Call onLoadComplete after the first quality loads (model becomes visible)
          if (!hasCalledComplete && onLoadComplete) {
            hasCalledComplete = true
            onLoadComplete()
          }
          
          // Add delay between quality upgrades to prevent overwhelming
          if (quality !== 'high') {
            await new Promise(resolve => {
              loadingTimeoutRef.current = setTimeout(resolve, quality === 'ultra_low' ? 500 : 1000)
            })
          }
        } catch {
          console.warn(`Failed to load ${quality} quality, continuing with next level`)
        }
      }
    }
    
    progressiveLoad()
    
    return () => {
      isCancelled = true
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [urls.ultra_low, urls.low, urls.medium, urls.high, progressiveLoading])

  // Process current geometry for rendering
  const { positions, colors, normals, sampledCount } = useMemo(() => {
    const currentGeometry = loadedGeometries[currentQuality]
    
    if (!currentGeometry) {
      return {
        positions: new Float32Array(0),
        colors: new Float32Array(0),
        normals: new Float32Array(0),
        sampledCount: 0
      }
    }
    
    const positionAttribute = currentGeometry.attributes.position
    const colorAttribute = currentGeometry.attributes.color
    const normalAttribute = currentGeometry.attributes.normal
    
    // Extract position data
    const originalPositions = new Float32Array(positionAttribute.array)
    
    // Apply resolution by sampling points
    let sampledPositions: Float32Array
    let currentSampledCount: number
    if (resolution !== 1.0) {
      const totalPoints = originalPositions.length / 3
      const sampleStep = Math.max(1, Math.floor(1 / resolution))
      currentSampledCount = Math.floor(totalPoints / sampleStep)
      sampledPositions = new Float32Array(currentSampledCount * 3)
      
      for (let i = 0; i < currentSampledCount; i++) {
        const sourceIndex = i * sampleStep
        sampledPositions[i * 3] = originalPositions[sourceIndex * 3]
        sampledPositions[i * 3 + 1] = originalPositions[sourceIndex * 3 + 1]
        sampledPositions[i * 3 + 2] = originalPositions[sourceIndex * 3 + 2]
      }
    } else {
      sampledPositions = originalPositions
      currentSampledCount = originalPositions.length / 3
    }
    
    // Extract color data if available
    let sampledColors = new Float32Array(0)
    if (colorAttribute) {
      const originalColors = new Float32Array(colorAttribute.array)
      
      if (resolution !== 1.0) {
        sampledColors = new Float32Array(currentSampledCount * 3)
        const sampleStep = Math.max(1, Math.floor(1 / resolution))
        
        for (let i = 0; i < currentSampledCount; i++) {
          const sourceIndex = i * sampleStep
          sampledColors[i * 3] = originalColors[sourceIndex * 3]
          sampledColors[i * 3 + 1] = originalColors[sourceIndex * 3 + 1]
          sampledColors[i * 3 + 2] = originalColors[sourceIndex * 3 + 2]
        }
      } else {
        sampledColors = originalColors
      }
    }
    
    // Extract normal data if available
    let sampledNormals = new Float32Array(0)
    if (normalAttribute) {
      const originalNormals = new Float32Array(normalAttribute.array)
      
      if (resolution !== 1.0) {
        sampledNormals = new Float32Array(currentSampledCount * 3)
        const sampleStep = Math.max(1, Math.floor(1 / resolution))
        
        for (let i = 0; i < currentSampledCount; i++) {
          const sourceIndex = i * sampleStep
          sampledNormals[i * 3] = originalNormals[sourceIndex * 3]
          sampledNormals[i * 3 + 1] = originalNormals[sourceIndex * 3 + 1]
          sampledNormals[i * 3 + 2] = originalNormals[sourceIndex * 3 + 2]
        }
      } else {
        sampledNormals = originalNormals
      }
    }
    
    return {
      positions: sampledPositions,
      colors: sampledColors,
      normals: sampledNormals,
      sampledCount: currentSampledCount
    }
  }, [loadedGeometries, currentQuality, resolution])

  // Create geometry for rendering
  const points = useMemo(() => {
    if (sampledCount === 0) return null
    
    const geometry = new THREE.BufferGeometry()
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    if (colors.length > 0) {
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    }
    
    if (normals.length > 0) {
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    }
    
    return geometry
  }, [positions, colors, normals, sampledCount])

  // Update material properties in real-time
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.size = pointSize
      materialRef.current.color.set(color)
      materialRef.current.needsUpdate = true
    }
  })

  if (!visible || !points) return null

  const hasVertexColors = colors.length > 0

  return (
    <points
      ref={pointsRef}
      geometry={points}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <pointsMaterial
        ref={materialRef}
        size={pointSize}
        vertexColors={hasVertexColors}
        color={hasVertexColors ? undefined : color}
        sizeAttenuation={true}
        transparent={false}
        alphaTest={0.5}
        depthWrite={true}
        depthTest={true}
        // Use circular points instead of squares
        map={null}
        // Make material unlit to preserve original colors
        onBeforeCompile={(shader) => {
          if (hasVertexColors) {
            // Replace the entire fragment shader to ignore lighting and use circular points
            shader.fragmentShader = `
              varying vec3 vColor;
              varying vec2 vUv;
              void main() {
                vec2 center = vec2(0.5, 0.5);
                float dist = distance(gl_PointCoord, center);
                if (dist > 0.5) discard;
                gl_FragColor = vec4(vColor, 1.0);
              }
            `
          } else {
            // For non-vertex colored points, still use circular shape
            shader.fragmentShader = shader.fragmentShader.replace(
              'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
              `
              vec2 center = vec2(0.5, 0.5);
              float dist = distance(gl_PointCoord, center);
              if (dist > 0.5) discard;
              gl_FragColor = vec4( outgoingLight, diffuseColor.a );
              `
            )
          }
        }}
      />
      {/* Quality indicator */}
      {isLoading && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="yellow" transparent opacity={0.7} />
        </mesh>
      )}
    </points>
  )
}