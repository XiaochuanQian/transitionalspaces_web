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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        style={{ fontFamily: '"Crimson Text", serif' }}
      >
        <div className="max-w-4xl mx-8 text-center">
          <p 
            className={`text-white text-xl sm:text-2xl lg:text-3xl leading-relaxed italic transition-opacity duration-1000 ${
              sentenceVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ fontFamily: '"Crimson Text", serif' }}
          >
            "{sentences[currentSentence]}"
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-stone-900 bg-opacity-90 backdrop-blur-sm transition-all duration-300 ${
        isAnimating ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ fontFamily: '"Crimson Text", serif' }}
    >
      <div 
        className={`bg-white dark:bg-stone-800 shadow-2xl border border-stone-300 dark:border-stone-700 p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-8 lg:my-16 transform transition-all duration-300 max-h-[90vh] overflow-y-auto ${
          isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-0">
          {/* Left Column - Header and Description */}
          <div className="flex flex-col justify-center">
            <div className="mb-6">
              <div className="w-16 h-16 mb-4 bg-stone-100 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 flex items-center justify-center">
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
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" 
                  />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-50 mb-3 lg:mb-4" style={{ fontFamily: '"Crimson Text", serif' }}>
                Transitional Spaces
              </h1>
              <p className="text-stone-700 dark:text-stone-300 text-lg sm:text-xl leading-relaxed mb-4 lg:mb-6">
Transitional Space are merely the path we take to travel from A to B. It is an integral medium that revokes our personal emotions connected to these spaces. As the hundred year old neighborhood are torn down giving way to new commercial centers, the spaces that once held collective memories and forged communal ties fade away. This project seeks to capture and reimagine these ephemeral spaces, allowing a reflection on the impact of irreversible urbanization, gentrification, economic growth on community bonds and individual experiences.
              </p>
            </div>

            {/* Content */}


            {/* Loading indicator */}
            <div className="text-left">
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
                Scene initialization in progress...
              </p>
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-b-2 border-stone-600 dark:border-stone-400"></div>
                <span className="text-xs text-stone-500 dark:text-stone-500">Loading models and environment</span>
              </div>
            </div>
          </div>

          {/* Right Column - Controls and Action */}
          <div className="flex flex-col justify-center">

            {/* Controls Info */}
            <div className="bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-4 lg:p-6 mb-4 lg:mb-6">
              <h3 className="text-stone-900 dark:text-stone-100 font-semibold mb-3 lg:mb-4 text-base lg:text-lg" style={{ fontFamily: '"Crimson Text", serif' }}>Navigation Controls</h3>
              <div className="grid grid-cols-1 gap-2 lg:gap-3 text-xs sm:text-sm">
                <div className="flex justify-between text-stone-700 dark:text-stone-300">
                  <span className="font-medium text-stone-900 dark:text-stone-100">Mouse:</span>
                  <span>Rotate view</span>
                </div>
                <div className="flex justify-between text-stone-700 dark:text-stone-300">
                  <span className="font-medium text-stone-900 dark:text-stone-100">Scroll:</span>
                  <span>Zoom in/out</span>
                </div>
                <div className="flex justify-between text-stone-700 dark:text-stone-300">
                  <span className="font-medium text-stone-900 dark:text-stone-100">WASD:</span>
                  <span>Move camera</span>
                </div>
                <div className="flex justify-between text-stone-700 dark:text-stone-300">
                  <span className="font-medium text-stone-900 dark:text-stone-100">Shift:</span>
                  <span>Accelerated movement</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleClose}
              className="w-full bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 dark:hover:bg-stone-600 text-stone-50 font-medium py-3 lg:py-4 px-4 lg:px-6 transition-all duration-200 border border-stone-700 dark:border-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-opacity-50 text-base lg:text-lg"
              style={{ fontFamily: '"Crimson Text", serif' }}
            >
              Enter Visualization Environment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}