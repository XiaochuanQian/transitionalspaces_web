'use client'

import { Scene3D } from '../components/Scene3D'
import { WelcomeModal } from '../components/WelcomeModal'
import { useEffect, useState } from 'react'

export default function Home() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(true)

  useEffect(() => {
    // Prevent browser zoom
    const preventZoom = (e: Event) => {
      // Allow scrolling within control panels
      const target = e.target as HTMLElement
      const isOverControlPanel = target.closest('.control-panel') || 
                                target.closest('[class*="fixed"]') ||
                                target.closest('[class*="z-50"]')
      
      if (isOverControlPanel) {
        // Allow scrolling within control panels
        return
      }
      
      e.preventDefault()
      return false
    }

    // Prevent various zoom triggers
    document.addEventListener('wheel', preventZoom, { passive: false })
    document.addEventListener('touchmove', preventZoom, { passive: false })
    document.addEventListener('gesturestart', preventZoom, { passive: false })
    document.addEventListener('gesturechange', preventZoom, { passive: false })
    document.addEventListener('gestureend', preventZoom, { passive: false })

    // Prevent keyboard zoom
    const preventKeyboardZoom = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=')) {
        e.preventDefault()
        return false
      }
    }
    document.addEventListener('keydown', preventKeyboardZoom)

    return () => {
      document.removeEventListener('wheel', preventZoom)
      document.removeEventListener('touchmove', preventZoom)
      document.removeEventListener('gesturestart', preventZoom)
      document.removeEventListener('gesturechange', preventZoom)
      document.removeEventListener('gestureend', preventZoom)
      document.removeEventListener('keydown', preventKeyboardZoom)
    }
  }, [])

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false)
  }

  return (
    <div 
      className="w-full h-screen" 
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
      {/* Scene loads in background regardless of modal state */}
      <Scene3D />
      
      {/* Welcome Modal */}
      <WelcomeModal 
        isVisible={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
      />
    </div>
  )
}
