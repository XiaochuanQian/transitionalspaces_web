'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import pako from 'pako'

interface CompressedPLYPointCloudProps {
  url: string
  pointSize?: number
  color?: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  resolution?: number
}

// Custom loader for compressed PLY files
const loadCompressedPLY = async (url: string) => {
  const response = await fetch(url)
  const compressedData = await response.arrayBuffer()
  
  // Decompress the data using pako
  const decompressedData = pako.inflate(new Uint8Array(compressedData))
  
  // Convert to string for PLY parsing
  const plyText = new TextDecoder().decode(decompressedData)
  
  // Parse PLY data
  const lines = plyText.split('\n')
  let headerEnd = 0
  let vertexCount = 0
  let hasColor = false
  let hasNormal = false

  
  // Parse header
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('element vertex')) {
      vertexCount = parseInt(line.split(' ')[2])
    } else if (line.includes('property') && line.includes('red')) {
      hasColor = true
    } else if (line.includes('property') && line.includes('nx')) {
      hasNormal = true
    } else if (line === 'end_header') {
      headerEnd = i + 1
      break
    }
  }
  
  // Parse vertex data
  const positions: number[] = []
  const colors: number[] = []
  const normals: number[] = []
  
  for (let i = headerEnd; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = line.split(' ').map(Number)
    let index = 0
    
    // Position (x, y, z)
    positions.push(values[index++], values[index++], values[index++])
    
    // Color (r, g, b) if present
    if (hasColor) {
      colors.push(values[index++], values[index++], values[index++])
    }
    
    // Normal (nx, ny, nz) if present
    if (hasNormal) {
      normals.push(values[index++], values[index++], values[index++])
    }
  }
  
  return {
    positions: new Float32Array(positions),
    colors: hasColor ? new Float32Array(colors) : null,
    normals: hasNormal ? new Float32Array(normals) : null,
    vertexCount
  }
}

export function CompressedPLYPointCloud({ 
  url, 
  pointSize = 0.01, 
  color = '#ffffff',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  resolution = 1.0
}: CompressedPLYPointCloudProps) {
  const [plyData, setPlyData] = useState<{
    positions: Float32Array;
    colors: Float32Array | null;
    normals: Float32Array | null;
    vertexCount: number;
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  
  // Load compressed PLY data
  useEffect(() => {
    setLoading(true)
    setError(null)
    
    loadCompressedPLY(url)
      .then(data => {
        setPlyData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load compressed PLY:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [url])
  
  const points = useMemo(() => {
    if (!plyData) return null
    
    const geometry = new THREE.BufferGeometry()
    
    // Apply resolution by sampling points
    let sampledPositions: Float32Array
    if (resolution !== 1.0) {
      const totalPoints = plyData.positions.length / 3
      const sampleStep = Math.max(1, Math.floor(1 / resolution))
      const sampledCount = Math.floor(totalPoints / sampleStep)
      sampledPositions = new Float32Array(sampledCount * 3)
      
      for (let i = 0; i < sampledCount; i++) {
        const sourceIndex = i * sampleStep
        sampledPositions[i * 3] = plyData.positions[sourceIndex * 3]
        sampledPositions[i * 3 + 1] = plyData.positions[sourceIndex * 3 + 1]
        sampledPositions[i * 3 + 2] = plyData.positions[sourceIndex * 3 + 2]
      }
    } else {
      sampledPositions = plyData.positions
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(sampledPositions, 3))
    
    // Apply same sampling to colors
    if (plyData.colors) {
      let sampledColors: Float32Array
      if (resolution !== 1.0) {
        const totalPoints = plyData.colors.length / 3
        const sampleStep = Math.max(1, Math.floor(1 / resolution))
        const sampledCount = Math.floor(totalPoints / sampleStep)
        sampledColors = new Float32Array(sampledCount * 3)
        
        for (let i = 0; i < sampledCount; i++) {
          const sourceIndex = i * sampleStep
          sampledColors[i * 3] = plyData.colors[sourceIndex * 3]
          sampledColors[i * 3 + 1] = plyData.colors[sourceIndex * 3 + 1]
          sampledColors[i * 3 + 2] = plyData.colors[sourceIndex * 3 + 2]
        }
      } else {
        sampledColors = plyData.colors
      }
      
      geometry.setAttribute('color', new THREE.BufferAttribute(sampledColors, 3))
    }
    
    // Apply same sampling to normals
    if (plyData.normals) {
      let sampledNormals: Float32Array
      if (resolution !== 1.0) {
        const totalPoints = plyData.normals.length / 3
        const sampleStep = Math.max(1, Math.floor(1 / resolution))
        const sampledCount = Math.floor(totalPoints / sampleStep)
        sampledNormals = new Float32Array(sampledCount * 3)
        
        for (let i = 0; i < sampledCount; i++) {
          const sourceIndex = i * sampleStep
          sampledNormals[i * 3] = plyData.normals[sourceIndex * 3]
          sampledNormals[i * 3 + 1] = plyData.normals[sourceIndex * 3 + 1]
          sampledNormals[i * 3 + 2] = plyData.normals[sourceIndex * 3 + 2]
        }
      } else {
        sampledNormals = plyData.normals
      }
      
      geometry.setAttribute('normal', new THREE.BufferAttribute(sampledNormals, 3))
    }
    
    return geometry
  }, [plyData, resolution])
  
  // Update material properties in real-time
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.size = pointSize
      materialRef.current.color.set(color)
    }
  })
  
  if (loading) {
    return (
      <mesh position={position}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
    )
  }
  
  if (error) {
    return (
      <mesh position={position}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial color="red" />
      </mesh>
    )
  }
  
  if (!points) return null
  
  const hasVertexColors = !!plyData?.colors
  
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
    </points>
  )
}