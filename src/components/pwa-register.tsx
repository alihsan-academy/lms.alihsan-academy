"use client"

import React, { useEffect, useState } from 'react'
import { Download, X, Smartphone, Share } from 'lucide-react'

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered with scope:', reg.scope)
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err)
          })
      })
    }

    // 2. Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isStandalone) {
      return // Already running inside installed PWA
    }

    // Check dismissal status in localStorage (7-day mute)
    const dismissedTime = localStorage.getItem('alihsan_pwa_dismissed')
    const now = Date.now()
    if (dismissedTime && now - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000) {
      return
    }

    // 3. Android / Chrome / Desktop beforeinstallprompt handler
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
      setIsDismissed(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // 4. iOS Safari Detection
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream
    if (isIosDevice) {
      setIsIOS(true)
      setIsDismissed(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstallable(false)
      setIsDismissed(true)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('alihsan_pwa_dismissed', Date.now().toString())
  }

  if (isDismissed) return null

  // iOS Safari Install Instruction Drawer
  if (isIOS && !isInstallable) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm bg-[#0D4A47] text-white p-4 rounded-2xl shadow-2xl border-2 border-emerald-400/40 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs font-black tracking-wide uppercase text-emerald-300">Install Al-Ihsan App</p>
              <p className="text-xs font-medium text-white/90 mt-0.5 leading-snug">
                Install on your iPhone or iPad for quick 1-tap access.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="text-white/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-emerald-100 flex items-center gap-2 font-medium">
          <Share className="h-4 w-4 text-emerald-300 shrink-0" />
          <span>Tap the <strong>Share</strong> button below, then select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
        </div>
      </div>
    )
  }

  // Android / Chrome / Desktop Native One-Click Install Banner
  if (isInstallable) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm bg-[#0D4A47] text-white p-4 rounded-2xl shadow-2xl border-2 border-emerald-400/40 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs font-black tracking-wide uppercase text-emerald-300">Install Al-Ihsan App</p>
              <p className="text-xs font-medium text-white/90 mt-0.5 leading-snug">
                Get full-screen app experience on your device.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="text-white/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 pt-2.5 flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs py-2 px-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install App</span>
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-xs font-bold text-white/80 hover:text-white transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    )
  }

  return null
}
