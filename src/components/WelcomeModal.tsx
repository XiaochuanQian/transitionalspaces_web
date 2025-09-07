'use client'

import { useState, useEffect } from 'react'

interface WelcomeModalProps {
  onClose: () => void
  isVisible: boolean
}

export function WelcomeModal({ onClose, isVisible }: WelcomeModalProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [currentSentence, setCurrentSentence] = useState(0)
  const [sentenceVisible, setSentenceVisible] = useState(false)

  const handleClose = () => {
    setIsAnimating(true)
    setTimeout(() => {
      // Reset states before starting transition
      setCurrentSentence(0)
      setSentenceVisible(false)
      setShowTransition(true)
    }, 300) // Show transition screen first
  }

  const sentences = [
    "As urbanization advances, cultural landscapes risk fading into mere memories, and once these spaces are forgotten, they effectively cease to exist.",
    "It’s a process fraught with contradictions and a sense of helplessness, emblematic of the inevitable march of modernization."
  ]

  useEffect(() => {
    if (showTransition) {
      const timers: NodeJS.Timeout[] = []

      // Show first sentence
      timers.push(setTimeout(() => {
        setSentenceVisible(true)
      }, 500))

      // Hide first sentence
      timers.push(setTimeout(() => {
        setSentenceVisible(false)
      }, 3500))

      // Switch to second sentence and show it
      timers.push(setTimeout(() => {
        setCurrentSentence(1)
      }, 4500))

      timers.push(setTimeout(() => {
        setSentenceVisible(true)
      }, 4600))

      // Hide second sentence
      timers.push(setTimeout(() => {
        setSentenceVisible(false)
      }, 7500))

      // Close modal
      timers.push(setTimeout(() => {
        onClose()
      }, 8500))

      return () => {
        timers.forEach(timer => clearTimeout(timer))
      }
    }
  }, [showTransition, onClose])

  if (!isVisible) return null

  // Transition screen with philosophical quote
  if (showTransition) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        <div className="max-w-4xl mx-8 text-center">
          <p 
            className={`text-white text-xl sm:text-2xl lg:text-3xl leading-relaxed italic transition-opacity duration-1000 ${
              sentenceVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ fontFamily: 'Arial, Helvetica, sans-serif', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            "{sentences[currentSentence]}"
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isAnimating ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      <div 
        className={`p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-8 lg:my-16 transform transition-all duration-300 max-h-[90vh] overflow-y-auto bg-black bg-opacity-20 ${
          isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-0">
          {/* Left Column - Header and Description */}
          <div className="flex flex-col justify-center">
            <div className="mb-6">

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 lg:mb-4" style={{ fontFamily: 'Arial, Helvetica, sans-serif', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                Transitional Spaces
              </h1>
              <p className="text-white text-lg sm:text-xl leading-relaxed mb-4 lg:mb-6" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
Transitional Space are merely the path we take to travel from A to B. It is an integral medium that revokes our personal emotions connected to these spaces. As the hundred year old neighborhood are torn down giving way to new commercial centers, the spaces that once held collective memories and forged communal ties fade away. This project seeks to capture and reimagine these ephemeral spaces, allowing a reflection on the impact of irreversible urbanization, gentrification, economic growth on community bonds and individual experiences.
              </p>
            </div>

            {/* Content */}


            {/* Loading indicator */}
            <div className="text-left">
              <p className="text-sm text-white mb-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                Scene initialization in progress...
              </p>
              <div>
                <span className="text-xs text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Loading models and environment</span>
              </div>
            </div>
          </div>

          {/* Right Column - Controls and Action */}
          <div className="flex flex-col justify-center">

            {/* Controls Info */}
            <div className="mb-4 lg:mb-6">
              <h3 className="text-white font-semibold mb-3 lg:mb-4 text-base lg:text-lg" style={{ fontFamily: 'Arial, Helvetica, sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Navigation Controls</h3>
              <div className="grid grid-cols-1 gap-2 lg:gap-3 text-xs sm:text-sm">
                <div className="flex justify-between text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  <span className="font-medium">Mouse:</span>
                  <span>Rotate view</span>
                </div>
                <div className="flex justify-between text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  <span className="font-medium">Scroll:</span>
                  <span>Zoom in/out</span>
                </div>
                <div className="flex justify-between text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  <span className="font-medium">WASD:</span>
                  <span>Move camera</span>
                </div>
                <div className="flex justify-between text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  <span className="font-medium">Shift:</span>
                  <span>Accelerated movement</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleClose}
              className="w-full text-stone-50 font-medium py-3 lg:py-4 px-4 lg:px-6 transition-all duration-200 text-base lg:text-lg border-2 border-white rounded hover:bg-white hover:bg-opacity-20"
              style={{ fontFamily: 'Arial, Helvetica, sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              Enter Visualization Environment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}