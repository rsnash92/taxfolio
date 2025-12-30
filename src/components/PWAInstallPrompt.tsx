'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)

      // Show prompt after a delay (don't be too aggressive)
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-prompt-dismissed')
        if (!dismissed) {
          setShowPrompt(true)
        }
      }, 30000) // 30 seconds delay
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Show iOS prompt after delay
    if (isIOSDevice) {
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-prompt-dismissed')
        if (!dismissed) {
          setShowPrompt(true)
        }
      }, 30000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
    }

    setInstallPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  if (isInstalled || !showPrompt) {
    return null
  }

  // iOS-specific prompt (can't auto-install, need to guide user)
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t z-50 animate-in slide-in-from-bottom duration-300">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4 max-w-lg mx-auto">
          <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
            <Download className="h-6 w-6 text-primary" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold mb-1">Install TaxFolio</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Add to your home screen for quick access
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Tap</span>
              <Share className="h-4 w-4" />
              <span>then &quot;Add to Home Screen&quot;</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Android/Desktop prompt
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t z-50 animate-in slide-in-from-bottom duration-300">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-4 max-w-lg mx-auto">
        <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
          <Download className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold mb-1">Install TaxFolio</h3>
          <p className="text-sm text-muted-foreground">
            Add to your home screen for quick access
          </p>
        </div>

        <Button onClick={handleInstall} size="sm">
          Install
        </Button>
      </div>
    </div>
  )
}
