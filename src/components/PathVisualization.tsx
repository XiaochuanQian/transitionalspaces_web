import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PathVisualizationProps {
  pathPoints: [number, number, number][]
  activityRadius: number
  isRecordingPath: boolean
  boundaryHeight?: number
}

export function PathVisualization({ pathPoints, isRecordingPath, boundaryHeight = 2 }: PathVisualizationProps) {
  const pathLineRef = useRef<THREE.Line>(null)
  
  // Create path line geometry
  const pathGeometry = useMemo(() => {
    if (pathPoints.length < 2) return null
    
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(pathPoints.length * 3)
    
    pathPoints.forEach((point, index) => {
      positions[index * 3] = point[0]
      positions[index * 3 + 1] = point[1]
      positions[index * 3 + 2] = point[2]
    })
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [pathPoints])
  
  // Create boundary wall geometry
  const boundaryGeometry = useMemo(() => {
    if (pathPoints.length < 3) return null
    
    // Create extruded geometry for 3D boundary walls
    const shape = new THREE.Shape()
    const firstPoint = pathPoints[0]
    shape.moveTo(firstPoint[0], firstPoint[2]) // Use X-Z coordinates
    
    for (let i = 1; i < pathPoints.length; i++) {
      const point = pathPoints[i]
      shape.lineTo(point[0], point[2])
    }
    shape.closePath()
    
    // Create extruded geometry with height
    const extrudeSettings = {
      depth: boundaryHeight,
      bevelEnabled: false
    }
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    
    // Rotate to stand upright
    geometry.rotateX(-Math.PI / 2)
    
    return geometry
  }, [pathPoints, boundaryHeight])

  // Create boundary material
  const boundaryMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: isRecordingPath ? 0xff6b35 : 0x4a90e2,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    })
  }, [isRecordingPath])
  
  // Animate recording effect
  useFrame((state) => {
    if (isRecordingPath && pathLineRef.current) {
      const time = state.clock.getElapsedTime()
      const material = pathLineRef.current.material as THREE.LineBasicMaterial
      material.opacity = 0.7 + 0.3 * Math.sin(time * 3)
    }
  })
  
  if (pathPoints.length === 0) return null
  
  return (
    <group>
      {/* Path Line */}
      {pathGeometry && (
        <primitive 
          ref={pathLineRef}
          object={new THREE.Line(
            pathGeometry,
            new THREE.LineBasicMaterial({
              color: isRecordingPath ? "#ff6b35" : "#4a90e2",
              linewidth: 3,
              transparent: true,
              opacity: isRecordingPath ? 0.8 : 0.6
            })
          )}
        />
      )}
      
      {/* Activity boundary walls */}
      {boundaryGeometry && (
        <mesh geometry={boundaryGeometry} material={boundaryMaterial} position={[0, 0, 0]} />
      )}
      
      {/* Path Points */}
      {pathPoints.map((point, index) => (
        <mesh key={`point-${index}`} position={[point[0], point[1], point[2]]}>
          <sphereGeometry args={[0.2, 8, 6]} />
          <meshBasicMaterial 
            color={isRecordingPath ? "#ff6b35" : "#4a90e2"}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
      
      {/* Current Position Indicator (last point) */}
      {pathPoints.length > 0 && isRecordingPath && (
        <mesh position={[pathPoints[pathPoints.length - 1][0], pathPoints[pathPoints.length - 1][1], pathPoints[pathPoints.length - 1][2]]}>
          <sphereGeometry args={[0.3, 8, 6]} />
          <meshBasicMaterial 
            color="#ff3333"
            transparent
            opacity={0.9}
          />
        </mesh>
      )}
    </group>
  )
}