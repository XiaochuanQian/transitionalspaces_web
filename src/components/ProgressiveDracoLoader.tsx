import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { DracoPointCloudLoader } from '../utils/dracoLoader'

interface ProgressiveDracoLoaderProps {
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

export function ProgressiveDracoLoader({
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
}: ProgressiveDracoLoaderProps) {
  const [currentQuality, setCurrentQuality] = useState<QualityLevel>('ultra_low')
  const [loadedGeometries, setLoadedGeometries] = useState<Partial<Record<QualityLevel, THREE.BufferGeometry>>>({})
  const [isLoading, setIsLoading] = useState(false)
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Progressive loading sequence
  const qualitySequence: QualityLevel[] = progressiveLoading ? ['ultra_low'] : ['medium']
  
  // Load geometry for a specific quality level
  const loadQuality = async (quality: QualityLevel) => {
    if (loadedGeometries[quality] || isLoading) return
    

    setIsLoading(true)
    const loader = new DracoPointCloudLoader()
    
    try {
      await new Promise<void>((resolve, reject) => {
        loader.load(
          urls[quality],
          (geometry) => {
            setLoadedGeometries(prev => ({ ...prev, [quality]: geometry }))
            onQualityLoaded?.(quality)
            resolve()
          },
          undefined,
          reject
        )
      })
    } catch (error) {
      console.error(`Failed to load Draco quality ${quality}:`, error)
    } finally {
      setIsLoading(false)
      loader.dispose()
    }
  }
  
  // Initial load
  useEffect(() => {
    const initialQuality = qualitySequence[0]
    loadQuality(initialQuality).then(() => {
      setCurrentQuality(initialQuality)
      onLoadComplete?.()
    })
  }, [urls])
  
  // Handle target quality changes
  useEffect(() => {
    if (!targetQuality || !progressiveLoading) return
    
    if (targetQuality !== currentQuality && !loadedGeometries[targetQuality]) {
      loadingTimeoutRef.current = setTimeout(() => {
        loadQuality(targetQuality).then(() => {
          setCurrentQuality(targetQuality)
        })
      }, 100)
    } else if (loadedGeometries[targetQuality]) {
      setCurrentQuality(targetQuality)
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [targetQuality, loadedGeometries, currentQuality, progressiveLoading])
  
  const { positions, colors, normals, sampledCount } = useMemo(() => {
    const geometry = loadedGeometries[currentQuality]
    if (!geometry) {
      return {
        positions: new Float32Array(0),
        colors: new Float32Array(0),
        normals: new Float32Array(0),
        sampledCount: 0
      }
    }
    
    const positionAttribute = geometry.attributes.position
    const colorAttribute = geometry.attributes.color
    const normalAttribute = geometry.attributes.normal
    
    // Extract and sample position data
    const originalPositions = new Float32Array(positionAttribute.array)
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
    
    // Extract and sample color data
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
    
    // Extract and sample normal data
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
  
  // Update material properties
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.size = pointSize
      materialRef.current.color.set(color)
    }
  })
  
  if (!visible || !points) return null
  
  const currentGeometry = loadedGeometries[currentQuality]
  const hasVertexColors = !!currentGeometry?.attributes.color
  
  return (
    <points 
      ref={pointsRef}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <primitive object={points} />
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
        map={null}
        onBeforeCompile={(shader) => {
          if (hasVertexColors) {
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
    </points>
  )
}