'use client'

import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import { ModelManager, PLYModel } from './ModelManager'
import { ModelControlPanel } from './ModelControlPanel'
import DevelopmentPanel from './DevelopmentPanel'
import { PathVisualization } from './PathVisualization'
import ViewpointPanel from './ViewpointPanel'
import { useState, useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'

// 扩展路径点数据结构以支持位置相关的高度限制
interface PathPoint {
  position: [number, number, number]
  heightLimit: number
  timestamp?: number
}

// 兼容性类型，用于向后兼容旧的数组格式
type PathPointData = PathPoint | [number, number, number]

// 视点系统接口定义
interface Viewpoint {
  id: string
  name: string
  position: [number, number, number]
  target: [number, number, number]
  fov?: number
  description?: string
  thumbnail?: string
}

// 预设视点数据
const DEFAULT_VIEWPOINTS: Viewpoint[] = [
  {
    id: 'overview',
    name: 'Overview',
    position: [0, 10, 15],
    target: [0, 0, 0],
    fov: 75,
    description: 'Bird\'s eye view of the entire scene'
  }
]

// 辅助函数：从PathPointData获取位置信息
function getPosition(point: PathPointData): [number, number, number] {
  return Array.isArray(point) ? point : point.position
}

// 辅助函数：从PathPointData获取高度限制
function getHeightLimit(point: PathPointData, defaultHeight: number): number {
  return Array.isArray(point) ? defaultHeight : point.heightLimit
}

// 辅助函数：将PathPointData数组转换为位置数组（用于向后兼容）
function getPositionsArray(points: PathPointData[]): [number, number, number][] {
  return points.map(getPosition)
}

// Available PLY files with quality levels - optimized for fast loading
const AVAILABLE_PLY_FILES = [
  {
    id: 'scan-1',
    name: '正元里',
    urls: {
      ultra_low: '/models/compressed/正元里-2025-Aug-05_2_ultra_low.ply.gz',
      low: '/models/compressed/正元里-2025-Aug-05_2_low.ply.gz',
      medium: '/models/compressed/正元里-2025-Aug-05_2_medium.ply.gz',
      high: '/models/compressed/正元里-2025-Aug-05_2_high.ply.gz'
    }
  },
  {
    id: 'scan-2',
    name: 'scan',
    urls: {
      ultra_low: '/models/compressed/Untitled_Scan-2025-Aug-05_ultra_low.ply.gz',
      low: '/models/compressed/Untitled_Scan-2025-Aug-05_low.ply.gz',
      medium: '/models/compressed/Untitled_Scan-2025-Aug-05_medium.ply.gz',
      high: '/models/compressed/Untitled_Scan-2025-Aug-05_high.ply.gz'
    }
  },
  {
    id: 'scan-3',
    name: 'scan2',
    urls: {
      ultra_low: '/models/compressed/Untitled_Scan-2025-Aug-05_2_ultra_low.ply.gz',
      low: '/models/compressed/Untitled_Scan-2025-Aug-05_2_low.ply.gz',
      medium: '/models/compressed/Untitled_Scan-2025-Aug-05_2_medium.ply.gz',
      high: '/models/compressed/Untitled_Scan-2025-Aug-05_2_high.ply.gz'
    }
  },
  {
    id: 'scan-4',
    name: 'scan3',
    urls: {
      ultra_low: '/models/compressed/Untitled_Scan-2025-Aug-05_12_ultra_low.ply.gz',
      low: '/models/compressed/Untitled_Scan-2025-Aug-05_12_low.ply.gz',
      medium: '/models/compressed/Untitled_Scan-2025-Aug-05_12_medium.ply.gz',
      high: '/models/compressed/Untitled_Scan-2025-Aug-05_12_high.ply.gz'
    }
  },
  {
    id: 'scan-5',
    name: 'scan4',
    urls: {
      ultra_low: '/models/compressed/Untitled_Scan-2025-Aug-05_22-main_ultra_low.ply.gz',
      low: '/models/compressed/Untitled_Scan-2025-Aug-05_22-main_low.ply.gz',
      medium: '/models/compressed/Untitled_Scan-2025-Aug-05_22-main_medium.ply.gz',
      high: '/models/compressed/Untitled_Scan-2025-Aug-05_22-main_high.ply.gz'
    }
  },
  {
    id: 'scan-6',
    name: 'scan5',
    urls: {
      ultra_low: '/models/compressed/Untitled_Scan-2025-Aug-05_32_ultra_low.ply.gz',
      low: '/models/compressed/Untitled_Scan-2025-Aug-05_32_low.ply.gz',
      medium: '/models/compressed/Untitled_Scan-2025-Aug-05_32_medium.ply.gz',
      high: '/models/compressed/Untitled_Scan-2025-Aug-05_32_high.ply.gz'
    }
  },
  {
    id: 'scan-7',
    name: 'scan6',
    urls: {
      ultra_low: '/models/compressed/Untitled_Scan-2025-Aug-05_42_ultra_low.ply.gz',
      low: '/models/compressed/Untitled_Scan-2025-Aug-05_42_low.ply.gz',
      medium: '/models/compressed/Untitled_Scan-2025-Aug-05_42_medium.ply.gz',
      high: '/models/compressed/Untitled_Scan-2025-Aug-05_42_high.ply.gz'
    }
  },
  {
    id: 'scan-8',
    name: 'scan7',
    urls: {
      ultra_low: '/models/compressed/Untitled_Scan-2025-Aug-14_ultra_low.ply.gz',
      low: '/models/compressed/Untitled_Scan-2025-Aug-14_low.ply.gz',
      medium: '/models/compressed/Untitled_Scan-2025-Aug-14_medium.ply.gz',
      high: '/models/compressed/Untitled_Scan-2025-Aug-14_high.ply.gz'
    }
  },
  {
    id: 'scan-9',
    name: 'scan8',
    urls: {
      ultra_low: '/models/compressed/Untitled_Scan-2025-Aug-14_2_ultra_low.ply.gz',
      low: '/models/compressed/Untitled_Scan-2025-Aug-14_2_low.ply.gz',
      medium: '/models/compressed/Untitled_Scan-2025-Aug-14_2_medium.ply.gz',
      high: '/models/compressed/Untitled_Scan-2025-Aug-14_2_high.ply.gz'
    }
  },
  {
    id: 'scan-10',
    name: 'scan9',
    urls: {
      ultra_low: '/models/compressed/Untitled_Scan-2025-Aug-14_3_ultra_low.ply.gz',
      low: '/models/compressed/Untitled_Scan-2025-Aug-14_3_low.ply.gz',
      medium: '/models/compressed/Untitled_Scan-2025-Aug-14_3_medium.ply.gz',
      high: '/models/compressed/Untitled_Scan-2025-Aug-14_3_high.ply.gz'
    }
  },
  {
    id: 'scan-11',
    name: 'scan10',
    urls: {
      ultra_low: '/models/compressed/Untitled_Scan-2025-Aug-14_4_ultra_low.ply.gz',
      low: '/models/compressed/Untitled_Scan-2025-Aug-14_4_low.ply.gz',
      medium: '/models/compressed/Untitled_Scan-2025-Aug-14_4_medium.ply.gz',
      high: '/models/compressed/Untitled_Scan-2025-Aug-14_4_high.ply.gz'
    }
  },
  {
    id: 'scan-12',
    name: 'scan11',
    urls: {
      ultra_low: '/models/compressed/Untitled_Scan-2025-Aug-14_5_ultra_low.ply.gz',
      low: '/models/compressed/Untitled_Scan-2025-Aug-14_5_low.ply.gz',
      medium: '/models/compressed/Untitled_Scan-2025-Aug-14_5_medium.ply.gz',
      high: '/models/compressed/Untitled_Scan-2025-Aug-14_5_high.ply.gz'
    }
  },
  {
    id: 'scan-13',
    name: 'scan12',
    urls: {
      ultra_low: '/models/compressed/Untitled_Scan-2025-Aug-05_22-remain_ultra_low.ply.gz',
      low: '/models/compressed/Untitled_Scan-2025-Aug-05_22-remain_low.ply.gz',
      medium: '/models/compressed/Untitled_Scan-2025-Aug-05_22-remain_medium.ply.gz',
      high: '/models/compressed/Untitled_Scan-2025-Aug-05_22-remain_high.ply.gz'
    }
  },
  {
    id: 'scan-14',
    name: 'scan13',
    urls: {
      ultra_low: '/models/compressed/Untitled_Scan-2025-Aug-14_6_ultra_low.ply.gz',
      low: '/models/compressed/Untitled_Scan-2025-Aug-14_6_low.ply.gz',
      medium: '/models/compressed/Untitled_Scan-2025-Aug-14_6_medium.ply.gz',
      high: '/models/compressed/Untitled_Scan-2025-Aug-14_6_high.ply.gz'
    }
  },
  {
    id: 'scan-15',
    name: 'scan14',
    urls: {
      ultra_low: '/models/compressed/Untitled_Scan-2025-Aug-14_7_ultra_low.ply.gz',
      low: '/models/compressed/Untitled_Scan-2025-Aug-14_7_low.ply.gz',
      medium: '/models/compressed/Untitled_Scan-2025-Aug-14_7_medium.ply.gz',
      high: '/models/compressed/Untitled_Scan-2025-Aug-14_7_high.ply.gz'
    }
  },

]

interface LightingControls {
  ambientIntensity: number
  directionalIntensity: number
  pointIntensity: number
  directionalPosition: [number, number, number]
  pointPosition: [number, number, number]
}

// Component to handle lighting updates
function LightingController({ lighting }: { lighting: LightingControls }) {
  const ambientLightRef = useRef<THREE.AmbientLight>(null)
  const directionalLightRef = useRef<THREE.DirectionalLight>(null)
  const pointLightRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = lighting.ambientIntensity
    }
    if (directionalLightRef.current) {
      directionalLightRef.current.intensity = lighting.directionalIntensity
      directionalLightRef.current.position.set(...lighting.directionalPosition)
    }
    if (pointLightRef.current) {
      pointLightRef.current.intensity = lighting.pointIntensity
      pointLightRef.current.position.set(...lighting.pointPosition)
    }
  })

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={lighting.ambientIntensity} />
      <directionalLight 
        ref={directionalLightRef}
        position={lighting.directionalPosition} 
        intensity={lighting.directionalIntensity} 
      />
      <pointLight 
        ref={pointLightRef}
        position={lighting.pointPosition} 
        intensity={lighting.pointIntensity} 
      />
    </>
  )
}

// Component to handle keyboard movement with activity range control
function KeyboardController({ 
  isRecordingPath, 
  activityRadius, 
  pathPoints, 
  onPathPointAdd,
  pathEnabled,
  boundaryHeight 
}: {
  isRecordingPath: boolean
  activityRadius: number
  pathPoints: Array<PathPointData>
  onPathPointAdd: (point: [number, number, number]) => void
  pathEnabled: boolean
  boundaryHeight: number
}) {
  const { camera } = useThree()
  const keysPressed = useRef<Set<string>>(new Set())
  const moveSpeed = 2.0 // Units per second - now frame-rate independent
  const lastRecordedPosition = useRef<THREE.Vector3 | null>(null)
  const recordingInterval = 0.5 // Record a point every 0.5 seconds when moving

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressed.current.add(event.key.toLowerCase())
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.current.delete(event.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    const keys = keysPressed.current
    
    // Calculate frame-rate independent movement
    const frameMoveSpeed = moveSpeed * delta
    
    // Get camera's forward and right vectors (parallel to ground)
    const forward = new THREE.Vector3(0, 0, -1)
    const right = new THREE.Vector3(1, 0, 0)
    
    // Apply camera's rotation to get world-relative directions
    forward.applyQuaternion(camera.quaternion)
    right.applyQuaternion(camera.quaternion)
    
    // Zero out Y component to keep movement parallel to ground
    forward.y = 0
    right.y = 0
    forward.normalize()
    right.normalize()
    
    let moved = false
    
    // Forward/Backward movement (W/S or Up/Down arrows)
    if (keys.has('w') || keys.has('arrowup')) {
      const newPosition = camera.position.clone().add(forward.clone().multiplyScalar(frameMoveSpeed))
      if (isWithinActivityBounds(newPosition)) {
        camera.position.copy(newPosition)
        moved = true
      }
    }
    if (keys.has('s') || keys.has('arrowdown')) {
      const newPosition = camera.position.clone().add(forward.clone().multiplyScalar(-frameMoveSpeed))
      if (isWithinActivityBounds(newPosition)) {
        camera.position.copy(newPosition)
        moved = true
      }
    }
    
    // Left/Right movement (A/D or Left/Right arrows)
    if (keys.has('a') || keys.has('arrowleft')) {
      const newPosition = camera.position.clone().add(right.clone().multiplyScalar(-frameMoveSpeed))
      if (isWithinActivityBounds(newPosition)) {
        camera.position.copy(newPosition)
        moved = true
      }
    }
    if (keys.has('d') || keys.has('arrowright')) {
      const newPosition = camera.position.clone().add(right.clone().multiplyScalar(frameMoveSpeed))
      if (isWithinActivityBounds(newPosition)) {
        camera.position.copy(newPosition)
        moved = true
      }
    }
    
    // Up/Down movement (Q/E or PageUp/PageDown) - now with boundary check
    if (keys.has('q') || keys.has('pageup')) {
      const newPosition = camera.position.clone()
      newPosition.y += frameMoveSpeed
      if (isWithinActivityBounds(newPosition)) {
        camera.position.copy(newPosition)
        moved = true
      }
    }
    if (keys.has('e') || keys.has('pagedown')) {
      const newPosition = camera.position.clone()
      newPosition.y -= frameMoveSpeed
      if (isWithinActivityBounds(newPosition)) {
        camera.position.copy(newPosition)
        moved = true
      }
    }
    
    // Record path points when recording is enabled and camera has moved
    if (isRecordingPath && moved && shouldRecordPoint()) {
      const currentPos = camera.position
      onPathPointAdd([currentPos.x, currentPos.y, currentPos.z])
      const positionWithTimestamp = currentPos.clone() as THREE.Vector3 & { timestamp: number }
      positionWithTimestamp.timestamp = Date.now()
      lastRecordedPosition.current = positionWithTimestamp
    }
  })
  
  // Helper function to check if position is within activity bounds using path polygon and height limit
  const isWithinActivityBounds = (position: THREE.Vector3): boolean => {
    // If path is disabled or no path points recorded yet, allow movement anywhere
    if (!pathEnabled || pathPoints.length < 3) {
      return true // Need at least 3 points to form a boundary
    }
    
    // Calculate interpolated height limit based on position
    const groundLevel = Math.min(...pathPoints.map(point => getPosition(point)[1]))
    let interpolatedHeightLimit = boundaryHeight // Default fallback
    
    if (pathPoints.length > 0) {
      // Find the closest path points for interpolation
      const distances = pathPoints.map(point => {
        const [px, , pz] = getPosition(point)
        const distance = Math.sqrt((position.x - px) ** 2 + (position.z - pz) ** 2)
        return { point, distance }
      })
      
      // Sort by distance to get closest points
      distances.sort((a, b) => a.distance - b.distance)
      
      // Use inverse distance weighting for smooth interpolation
      const maxInfluenceDistance = activityRadius * 2 // Points beyond this distance have minimal influence
      let totalWeight = 0
      let weightedHeightSum = 0
      
      for (const { point, distance } of distances.slice(0, 3)) { // Use up to 3 closest points
        if (distance < maxInfluenceDistance) {
          const weight = distance === 0 ? 1 : 1 / (distance + 0.1) // Avoid division by zero
          const pointHeightLimit = getHeightLimit(point, boundaryHeight)
          weightedHeightSum += pointHeightLimit * weight
          totalWeight += weight
        }
      }
      
      if (totalWeight > 0) {
        interpolatedHeightLimit = weightedHeightSum / totalWeight
      }
    }
    
    const maxHeight = groundLevel + interpolatedHeightLimit
    
    if (position.y < groundLevel || position.y > maxHeight) {
      return false // Outside height bounds
    }
    
    // Use ray casting algorithm to check if point is inside polygon
    // Project to 2D plane (using X-Z coordinates, ignoring Y for ground plane)
    const x = position.x
    const z = position.z
    
    let inside = false
    for (let i = 0, j = pathPoints.length - 1; i < pathPoints.length; j = i++) {
      const [xi, , zi] = getPosition(pathPoints[i])
      const [xj, , zj] = getPosition(pathPoints[j])
      
      if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) {
        inside = !inside
      }
    }
    
    return inside
  }
  
  // Helper function to determine if we should record a new point
  const shouldRecordPoint = (): boolean => {
    if (!lastRecordedPosition.current) {
      return true // Record first point
    }
    
    const timeSinceLastRecord = Date.now() - ((lastRecordedPosition.current as THREE.Vector3 & { timestamp: number }).timestamp || 0)
    const distanceMoved = camera.position.distanceTo(lastRecordedPosition.current)
    
    // Record if enough time has passed or if moved significant distance
    return timeSinceLastRecord > recordingInterval * 1000 || distanceMoved > 1.0
  }

  return null
}

// Component to handle viewpoint transitions
function ViewpointController({ 
  viewpoints, 
  currentViewpoint, 
  onViewpointChange,
  transitionDuration = 2000 
}: {
  viewpoints: Viewpoint[]
  currentViewpoint: string | null
  onViewpointChange: (_viewpointId: string | null) => void
  transitionDuration?: number
}) {
  const { camera } = useThree()
  const transitionRef = useRef<{
    startTime: number
    startPosition: THREE.Vector3
    startTarget: THREE.Vector3
    targetPosition: THREE.Vector3
    targetTarget: THREE.Vector3
    startFov: number
    targetFov: number
    isTransitioning: boolean
  } | null>(null)

  // Smooth camera transition animation
  useFrame(() => {
    if (!transitionRef.current?.isTransitioning) return

    const elapsed = Date.now() - transitionRef.current.startTime
    const progress = Math.min(elapsed / transitionDuration, 1)
    
    // Easing function for smooth transition
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    const easedProgress = easeInOutCubic(progress)

    // Interpolate camera position
    camera.position.lerpVectors(
      transitionRef.current.startPosition,
      transitionRef.current.targetPosition,
      easedProgress
    )

    // Interpolate camera target (lookAt)
    const currentTarget = new THREE.Vector3().lerpVectors(
      transitionRef.current.startTarget,
      transitionRef.current.targetTarget,
      easedProgress
    )
    camera.lookAt(currentTarget)

    // Interpolate FOV (only for PerspectiveCamera)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(
        transitionRef.current.startFov,
        transitionRef.current.targetFov,
        easedProgress
      )
      camera.updateProjectionMatrix()
    }

    // End transition
    if (progress >= 1) {
      transitionRef.current.isTransitioning = false
    }
  })

  // Handle viewpoint changes
  useEffect(() => {
    // If switching to a specific viewpoint
    if (currentViewpoint) {
      const viewpoint = viewpoints.find(v => v.id === currentViewpoint)
      if (!viewpoint) return

      // Calculate current camera target (where it's looking)
      const direction = new THREE.Vector3()
      camera.getWorldDirection(direction)
      const currentTarget = camera.position.clone().add(direction.multiplyScalar(10))

      // Start transition to viewpoint
      transitionRef.current = {
        startTime: Date.now(),
        startPosition: camera.position.clone(),
        startTarget: currentTarget, // Current lookAt target
        targetPosition: new THREE.Vector3(...viewpoint.position),
        targetTarget: new THREE.Vector3(...viewpoint.target),
        startFov: camera instanceof THREE.PerspectiveCamera ? camera.fov : 75,
        targetFov: viewpoint.fov || 75,
        isTransitioning: true
      }
    } else {
      // If switching to free view (currentViewpoint is null)
      // Stop any ongoing transition to allow immediate free camera control
      if (transitionRef.current?.isTransitioning) {
        transitionRef.current.isTransitioning = false
      }
    }
  }, [currentViewpoint, viewpoints, camera])

  return null
}

// Component to handle mouse camera rotation
// 相机捕获组件 - 用于创建自定义视点
function CameraCapture({ 
  onCaptureViewpoint 
}: {
  onCaptureViewpoint: (position: [number, number, number], target: [number, number, number], fov: number) => void
}) {
  const { camera } = useThree()
  
  const captureCurrentView = () => {
    const position: [number, number, number] = [camera.position.x, camera.position.y, camera.position.z]
    
    // 计算相机朝向的目标点
    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    const target: [number, number, number] = [
      camera.position.x + direction.x * 10,
      camera.position.y + direction.y * 10,
      camera.position.z + direction.z * 10
    ]
    
    const fov = (camera as THREE.PerspectiveCamera).fov || 75
    
    onCaptureViewpoint(position, target, fov)
  }
  
  // 监听键盘事件来捕获视点
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'c' && event.ctrlKey) {
        event.preventDefault()
        captureCurrentView()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [camera])
  
  return null
}

function MouseController({ 
  isViewpointMode,
  onExitViewpointMode 
}: {
  isViewpointMode: boolean
  onExitViewpointMode: () => void
}) {
  const { camera } = useThree()
  const mouseRef = useRef({ x: 0, y: 0 })
  const isMouseDown = useRef(false)
  const sensitivity = 0.002
  const rotationRef = useRef({ x: 0, y: 0 })

  // Sync rotation with camera when exiting viewpoint mode
  useEffect(() => {
    if (!isViewpointMode) {
      // Extract current camera rotation and sync with rotationRef
      const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ')
      rotationRef.current.x = euler.x
      rotationRef.current.y = euler.y
    }
  }, [isViewpointMode, camera])

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) { // Left click
        if (isViewpointMode) {
          onExitViewpointMode()
          return
        }
        isMouseDown.current = true
        mouseRef.current = { x: event.clientX, y: event.clientY }
      }
    }

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        isMouseDown.current = false
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (isMouseDown.current && !isViewpointMode) {
        const deltaX = event.clientX - mouseRef.current.x
        const deltaY = event.clientY - mouseRef.current.y
        
        // Update rotation relative to current camera orientation
        rotationRef.current.x -= deltaY * sensitivity
        rotationRef.current.y -= deltaX * sensitivity
        
        // Clamp vertical rotation
        rotationRef.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotationRef.current.x))
        
        // Apply rotation to camera
        const euler = new THREE.Euler(rotationRef.current.x, rotationRef.current.y, 0, 'YXZ')
        camera.quaternion.setFromEuler(euler)
        
        mouseRef.current = { x: event.clientX, y: event.clientY }
      }
    }

    const handleWheel = (event: WheelEvent) => {
      if (isViewpointMode) {
        onExitViewpointMode()
        return
      }
      
      // Check if mouse is over control panels
      const target = event.target as HTMLElement
      const isOverControlPanel = target.closest('.control-panel') || 
                                target.closest('[class*="fixed"]') ||
                                target.closest('[class*="z-50"]')
      
      if (isOverControlPanel) {
        // Don't zoom if over control panels
        return
      }
      
      // Zoom in/out
      const zoomSpeed = 0.05
      const zoom = event.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed
      if ('fov' in camera) {
        const perspectiveCamera = camera as THREE.PerspectiveCamera
        perspectiveCamera.fov *= zoom
        perspectiveCamera.fov = Math.max(30, Math.min(120, perspectiveCamera.fov))
        camera.updateProjectionMatrix()
      }
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('wheel', handleWheel)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [camera, isViewpointMode, onExitViewpointMode])

  return null
}

interface Scene3DProps {
  uploadedModels?: PLYModel[]
  uploadedBackgroundColor?: string
  uploadedPointCloudResolution?: number
  uploadedProgressiveLoading?: boolean
  showPath?: boolean
  pathEnabled?: boolean
}

export function Scene3D({ 
  uploadedModels,
  uploadedBackgroundColor,
  uploadedPointCloudResolution,
  uploadedProgressiveLoading,
  showPath = true,
  pathEnabled = true
}: Scene3DProps = {}) {
  // Check if we're in development environment (memoized to prevent dependency array changes)
  const isDevelopment = useMemo(() => process.env.NODE_ENV === 'development', [])
  // console.log('Scene3D component rendered, isDevelopment:', isDevelopment)
  // Loading state
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Default model data
  const defaultModel: PLYModel = {
    id: '1',
    url: AVAILABLE_PLY_FILES[0].urls.ultra_low, // Start with fastest loading quality
    urls: AVAILABLE_PLY_FILES[0].urls, // Pass all quality URLs
    name: AVAILABLE_PLY_FILES[0].name,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    pointSize: 0.01,
    color: '#ffffff',
    visible: true
  }

  // Initialize with uploaded values or default values to prevent hydration mismatch
  const [models, setModels] = useState<PLYModel[]>(uploadedModels || [defaultModel])
  const [backgroundColor, setBackgroundColor] = useState<string>(uploadedBackgroundColor || '#000000')
  const [pointCloudResolution, setPointCloudResolution] = useState<number>(uploadedPointCloudResolution || 1.0)
  const [progressiveLoading, setProgressiveLoading] = useState<boolean>(uploadedProgressiveLoading ?? true)
  
  // 用户活动范围控制状态
  const [isRecordingPath, setIsRecordingPath] = useState<boolean>(false)
  const [pathPoints, setPathPoints] = useState<Array<PathPointData>>([])
   const [showPathState, setShowPathState] = useState<boolean>(showPath)
   const [pathEnabledState, setPathEnabledState] = useState<boolean>(pathEnabled)
   const [boundaryHeight, setBoundaryHeight] = useState<number>(2)
  
  // 视点导航状态
  const [customViewpoints, setCustomViewpoints] = useState<Viewpoint[]>([])
  const [currentViewpoint, setCurrentViewpoint] = useState<string | null>(null)
  const [isViewpointMode, setIsViewpointMode] = useState<boolean>(false)
  
  // 合并默认视点和自定义视点
  const allViewpoints = [...DEFAULT_VIEWPOINTS, ...customViewpoints]
  
  // Panel visibility state
  const [showModelManager, setShowModelManager] = useState<boolean>(true)
  const [showViewpointPanel, setShowViewpointPanel] = useState<boolean>(true)
  
  // Auto-import config files in production mode
  useEffect(() => {
    const loadProductionConfigs = async () => {
      // Load configs in both development and production modes
      // if (!isDevelopment) {
        try {
          console.log('Attempting to load JSON config...')
          // Load models config
          const modelsResponse = await fetch('/configs/ply-models-2025-08-24.json')
          console.log('Models response status:', modelsResponse.status, modelsResponse.ok)
          if (modelsResponse.ok) {
            const modelsData = await modelsResponse.json()
            if (modelsData.models && Array.isArray(modelsData.models)) {
              console.log('Loaded models from JSON config:', modelsData.models.slice(0, 2)) // Log first 2 models
              setModels(modelsData.models)
            }
          }

          // Load custom viewpoints config
          const viewpointsResponse = await fetch('/configs/custom-viewpoints-2025-08-24.json')
          if (viewpointsResponse.ok) {
            const viewpointsData = await viewpointsResponse.json()
            if (viewpointsData.customViewpoints && Array.isArray(viewpointsData.customViewpoints)) {
              setCustomViewpoints(viewpointsData.customViewpoints)
            }
          }

          // Load path data config
          const pathResponse = await fetch('/configs/path-data-2025-08-24.json')
          if (pathResponse.ok) {
            const pathData = await pathResponse.json()
            if (pathData.activityRange) {
              if (pathData.activityRange.pathPoints && Array.isArray(pathData.activityRange.pathPoints)) {
                const formattedPathPoints = pathData.activityRange.pathPoints.map((point: [number, number, number]) => ({
                  position: point,
                  heightLimit: 2,
                  timestamp: Date.now()
                }))
                setPathPoints(formattedPathPoints)
              }
              if (typeof pathData.activityRange.activityRadius === 'number') {
                // Handle activity radius if needed
              }
            }
          }
        } catch (error) {
          console.warn('Failed to load production config files:', error)
        }
      // }
    }

    loadProductionConfigs()
  }, []) // Remove isDevelopment dependency to ensure it runs

  // Load path data from localStorage on component mount (development mode)
   useEffect(() => {
     if (isDevelopment) {
       const savedPathData = localStorage.getItem('userActivityPath')
       if (savedPathData) {
         try {
           const pathData = JSON.parse(savedPathData)
           if (pathData.pathPoints && Array.isArray(pathData.pathPoints)) {
             setPathPoints(pathData.pathPoints)
           }
           if (typeof pathData.boundaryHeight === 'number') {
             setBoundaryHeight(pathData.boundaryHeight)
           }
         } catch (error) {
           console.warn('Failed to load saved path data:', error)
         }
       }
       
       // Load custom viewpoints from localStorage
       const savedViewpoints = localStorage.getItem('customViewpoints')
       if (savedViewpoints) {
         try {
           const viewpointsData = JSON.parse(savedViewpoints)
           if (Array.isArray(viewpointsData)) {
             setCustomViewpoints(viewpointsData)
           }
         } catch (error) {
           console.warn('Failed to load saved viewpoints:', error)
         }
       }
     }
   }, [isDevelopment])
  
  // Save path data to localStorage whenever pathPoints or boundaryHeight changes (development mode only)
   useEffect(() => {
     if (isDevelopment) {
       const pathData = {
         pathPoints,
         boundaryHeight,
         lastSaved: Date.now()
       }
       localStorage.setItem('userActivityPath', JSON.stringify(pathData))
     }
   }, [pathPoints, boundaryHeight, isDevelopment])
   
   // Save custom viewpoints to localStorage whenever they change (development mode only)
   useEffect(() => {
     if (isDevelopment) {
       localStorage.setItem('customViewpoints', JSON.stringify(customViewpoints))
     }
   }, [customViewpoints, isDevelopment])
  
  // 添加路径点的回调函数
  const handlePathPointAdd = (point: [number, number, number]) => {
    const newPathPoint: PathPoint = {
      position: point,
      heightLimit: boundaryHeight, // 使用当前的边界高度作为默认值
      timestamp: Date.now()
    }
    setPathPoints(prev => [...prev, newPathPoint])
  }
  
  // 清除路径的回调函数
  const handleClearPath = () => {
    setPathPoints([])
    setIsRecordingPath(false)
  }
  
  // 视点导航处理函数
  const handleViewpointChange = (viewpointId: string | null) => {
    setCurrentViewpoint(viewpointId)
    setIsViewpointMode(viewpointId !== null)
  }
  
  const handleExitViewpointMode = () => {
    setCurrentViewpoint(null)
    setIsViewpointMode(false)
  }
  
  // 自定义视点管理函数
  const handleCaptureViewpoint = (position: [number, number, number], target: [number, number, number], fov: number) => {
    const viewpointName = prompt('Enter a name for this viewpoint:')
    if (!viewpointName) return
    
    const newViewpoint: Viewpoint = {
      id: `custom-${Date.now()}`,
      name: viewpointName,
      position,
      target,
      fov,
      description: 'Custom viewpoint'
    }
    
    setCustomViewpoints(prev => [...prev, newViewpoint])
  }
  
  const handleDeleteViewpoint = (viewpointId: string) => {
    if (viewpointId.startsWith('custom-')) {
      setCustomViewpoints(prev => prev.filter(vp => vp.id !== viewpointId))
      if (currentViewpoint === viewpointId) {
        handleExitViewpointMode()
      }
    }
  }
  
  const handleRenameViewpoint = (viewpointId: string, newName: string) => {
    if (viewpointId.startsWith('custom-')) {
      setCustomViewpoints(prev => 
        prev.map(vp => vp.id === viewpointId ? { ...vp, name: newName } : vp)
      )
    }
  }

  const handleViewpointsImport = (importedViewpoints: Viewpoint[]) => {
    // Filter out any viewpoints that don't have the custom- prefix
    const customViewpoints = importedViewpoints.filter(vp => vp.id.startsWith('custom-'))
    
    // Add imported viewpoints to existing custom viewpoints
    setCustomViewpoints(prev => {
      const existingIds = new Set(prev.map(vp => vp.id))
      const newViewpoints = customViewpoints.filter(vp => !existingIds.has(vp.id))
      return [...prev, ...newViewpoints]
    })
  }

  // Load saved data from localStorage after hydration (only if not using uploaded data)
  useEffect(() => {
    if (uploadedModels || uploadedBackgroundColor || uploadedPointCloudResolution !== undefined || uploadedProgressiveLoading !== undefined) {
      // Using uploaded data, skip localStorage loading
      return
    }

    const savedModels = localStorage.getItem('ply-models')
    if (savedModels) {
      try {
        setModels(JSON.parse(savedModels))
      } catch (e) {
        console.warn('Failed to load saved models:', e)
      }
    }

    const savedBackgroundColor = localStorage.getItem('ply-background-color')
    if (savedBackgroundColor) {
      setBackgroundColor(savedBackgroundColor)
    }

    const savedResolution = localStorage.getItem('ply-resolution')
    if (savedResolution) {
      setPointCloudResolution(parseFloat(savedResolution))
    }

    const savedProgressiveLoading = localStorage.getItem('ply-progressive-loading')
    if (savedProgressiveLoading) {
      setProgressiveLoading(savedProgressiveLoading === 'true')
    }
  }, [uploadedModels, uploadedBackgroundColor, uploadedPointCloudResolution, uploadedProgressiveLoading])

  // Simulate loading progress
  useEffect(() => {
    const simulateLoading = () => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5 // Random increment between 5-20%
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          // Add a small delay before hiding the loading screen
          setTimeout(() => setIsLoading(false), 500)
        }
        setLoadingProgress(Math.min(progress, 100))
      }, 100)
    }

    simulateLoading()
  }, [])

  // Save models to localStorage whenever they change (only if not using uploaded data)
  useEffect(() => {
    if (typeof window !== 'undefined' && !uploadedModels) {
      localStorage.setItem('ply-models', JSON.stringify(models))
    }
  }, [models, uploadedModels])

  // Save background color to localStorage whenever it changes (only if not using uploaded data)
  useEffect(() => {
    if (typeof window !== 'undefined' && !uploadedBackgroundColor) {
      localStorage.setItem('ply-background-color', backgroundColor)
    }
  }, [backgroundColor, uploadedBackgroundColor])

  // Save point cloud resolution to localStorage whenever it changes (only if not using uploaded data)
  useEffect(() => {
    if (typeof window !== 'undefined' && uploadedPointCloudResolution === undefined) {
      localStorage.setItem('ply-resolution', pointCloudResolution.toString())
    }
  }, [pointCloudResolution, uploadedPointCloudResolution])

  // Save progressive loading setting to localStorage whenever it changes (only if not using uploaded data)
  useEffect(() => {
    if (typeof window !== 'undefined' && uploadedProgressiveLoading === undefined) {
      localStorage.setItem('ply-progressive-loading', progressiveLoading.toString())
    }
  }, [progressiveLoading, uploadedProgressiveLoading])

  const handleModelUpdate = (modelId: string, updates: Partial<PLYModel>) => {
    setModels(prev => prev.map(model => 
      model.id === modelId ? { ...model, ...updates } : model
    ))
  }

  const handleAddModel = () => {
    // Cycle through available files
    const fileIndex = models.length % AVAILABLE_PLY_FILES.length
    const selectedFile = AVAILABLE_PLY_FILES[fileIndex]
    
    // Calculate position on a horizontal plane (Y = 0) in a grid pattern
    const gridSize = 4 // Distance between models
    const modelsPerRow = 3 // Number of models per row
    const row = Math.floor(models.length / modelsPerRow)
    const col = models.length % modelsPerRow
    
    const newModel: PLYModel = {
      id: Date.now().toString(),
      url: selectedFile.urls.ultra_low, // Start with fastest loading quality
      urls: selectedFile.urls, // Pass all quality URLs
      name: selectedFile.name,
      position: [
        (col - 1) * gridSize, // X: center at 0, spread left and right
        0,                     // Y: all models on same horizontal plane
        row * gridSize         // Z: spread forward and backward
      ],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      pointSize: 0.01,
      color: '#ffffff',
      visible: true
    }
    setModels(prev => [...prev, newModel])
  }

  const handleRemoveModel = (modelId: string) => {
    setModels(prev => prev.filter(model => model.id !== modelId))
  }

  const handleModelsChange = (newModels: PLYModel[]) => {
    setModels(newModels)
  }

  return (
    <div className="w-full h-screen relative">
      {/* Loading Screen */}
      {isLoading && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900 bg-opacity-90 backdrop-blur-sm transition-all duration-300"
          style={{ fontFamily: '"Crimson Text", serif' }}
        >
          <div className="bg-white dark:bg-stone-800 shadow-2xl border border-stone-300 dark:border-stone-700 p-4 sm:p-6 lg:p-8 w-full max-w-2xl mx-4 sm:mx-6 lg:mx-8 transform transition-all duration-300">
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 mb-6 bg-stone-100 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 flex items-center justify-center mx-auto">
                <svg 
                  className="w-8 h-8 text-stone-700 dark:text-stone-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-50 mb-3 lg:mb-4" style={{ fontFamily: '"Crimson Text", serif' }}>
                Loading Environment
              </h1>
              
              {/* Subtitle */}
              <p className="text-stone-700 dark:text-stone-300 text-lg sm:text-xl leading-relaxed mb-6">
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-stone-200 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 h-3 mb-4">
                <div 
                  className="bg-stone-800 dark:bg-stone-400 h-3 transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              
              {/* Status Text */}
              <div className="text-sm text-stone-600 dark:text-stone-400 mb-2">
                {loadingProgress < 30 && "Initializing scene..."}
                {loadingProgress >= 30 && loadingProgress < 60 && "Loading models..."}
                {loadingProgress >= 60 && loadingProgress < 90 && "Setting up controls..."}
                {loadingProgress >= 90 && "Almost ready..."}
              </div>
              
              {/* Progress Percentage */}
              <div className="text-xs text-stone-500 dark:text-stone-500">
                {Math.round(loadingProgress)}% complete
              </div>
            </div>
          </div>
        </div>
      )}

      <Canvas
        camera={{ 
          position: [4.554685742129803, 1.7088000000119103, 19.003058173961286], 
          fov: 40
        }}
        style={{ background: backgroundColor }}
      >
        {/* Lighting Controller */}
        <LightingController lighting={{
          ambientIntensity: 0.1,
          directionalIntensity: 0.5,
          pointIntensity: 0.2,
          directionalPosition: [10, 10, 5],
          pointPosition: [-10, -10, -5]
        }} />
        
        {/* Keyboard Controller */}
        <KeyboardController 
          isRecordingPath={isRecordingPath}
          activityRadius={0}
          pathPoints={getPositionsArray(pathPoints)}
          onPathPointAdd={handlePathPointAdd}
          pathEnabled={pathEnabledState}
          boundaryHeight={boundaryHeight}
        />
        
        {/* Viewpoint Controller */}
        <ViewpointController 
          viewpoints={allViewpoints}
          currentViewpoint={currentViewpoint}
          onViewpointChange={handleViewpointChange}
        />
        
        {/* Camera Capture */}
        <CameraCapture 
          onCaptureViewpoint={handleCaptureViewpoint}
        />
        
        {/* Mouse Controller */}
        <MouseController 
          isViewpointMode={isViewpointMode}
          onExitViewpointMode={handleExitViewpointMode}
        />
        
        {/* Path Visualization - Only in development */}
        {isDevelopment && showPathState && (
         <PathVisualization 
           pathPoints={getPositionsArray(pathPoints)}
           activityRadius={0}
           isRecordingPath={isRecordingPath}
           boundaryHeight={boundaryHeight}
         />
         )}
        
        {/* Environment - Removed to avoid HDR loading issues */}
        {/* <Environment preset="sunset" background={false} /> */}
        
        {/* Model Manager */}
        <ModelManager 
          models={models}
          onModelUpdate={handleModelUpdate}
          resolution={pointCloudResolution}
          progressiveLoading={progressiveLoading}
        />
        
        {/* Controls */}
        {/* OrbitControls 
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={0.1}
          maxDistance={100}
          target={[0, 0, 0]}
        /> */}
        
        {/* Performance Stats - Only in development */}
        {isDevelopment && <Stats />}
      </Canvas>

      {/* Control Panel - Only in development */}
      {isDevelopment && showModelManager && (
        <ModelControlPanel
          models={models}
          onModelUpdate={handleModelUpdate}
          onAddModel={handleAddModel}
          onRemoveModel={handleRemoveModel}
          availableFiles={AVAILABLE_PLY_FILES}
        />
      )}

      {/* Development Panel - Only in development */}
      {isDevelopment && (
        <DevelopmentPanel
          models={models}
          onModelsChange={handleModelsChange}
          availableFiles={AVAILABLE_PLY_FILES}
          backgroundColor={backgroundColor}
          onBackgroundColorChange={setBackgroundColor}
          pointCloudResolution={pointCloudResolution}
          onPointCloudResolutionChange={setPointCloudResolution}
          progressiveLoading={progressiveLoading}
          onProgressiveLoadingChange={setProgressiveLoading}
          isRecordingPath={isRecordingPath}
          onRecordingPathChange={setIsRecordingPath}
          activityRadius={0}
          onActivityRadiusChange={() => {}}
          pathPoints={getPositionsArray(pathPoints)}
          onPathPointAdd={handlePathPointAdd}
          onClearPath={handleClearPath}
          showPath={showPathState}
          onShowPathChange={setShowPathState}
          pathEnabled={pathEnabledState}
          onPathEnabledChange={setPathEnabledState}
          boundaryHeight={boundaryHeight}
          onBoundaryHeightChange={setBoundaryHeight}
          viewpoints={allViewpoints}
          currentViewpoint={currentViewpoint}
          onViewpointChange={handleViewpointChange}
          onViewpointDelete={handleDeleteViewpoint}
          onViewpointRename={handleRenameViewpoint}
          showModelManager={showModelManager}
          onShowModelManagerChange={setShowModelManager}
          showViewpointPanel={showViewpointPanel}
          onShowViewpointPanelChange={setShowViewpointPanel}
          onViewpointsImport={handleViewpointsImport}
        />
      )}
        
        {/* Audience Viewpoint Panel */}
        {showViewpointPanel && (
          <ViewpointPanel
            viewpoints={allViewpoints}
            currentViewpoint={currentViewpoint}
            onViewpointChange={handleViewpointChange}
          />
        )}
    </div>
  )
}