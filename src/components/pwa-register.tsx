"use client"

import React, { useEffect, useState } from 'react'
import { Download, X, Smartphone, Share, PlusSquare, MoreVertical, Monitor, ChevronDown, Sparkles, ExternalLink } from 'lucide-react'

type DeviceType = 'ios' | 'android' | 'desktop'

export function PwaRegister() {
  const [mounted, setMounted] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showInstructionsModal, setShowInstructionsModal] = useState(false)

  useEffect(() => {
    setMounted(true)

    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered:', reg.scope)
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err)
          })
      })
    }

    // 2. Comprehensive check if already installed & running in standalone mode
    const checkIsStandalone = () => {
      if (typeof window === 'undefined') return false
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
      )
    }

    if (checkIsStandalone()) {
      setIsStandalone(true)
      return // User has already installed the app and is running it from their home screen/app icon!
    }

    // Listen for display-mode changes (e.g. when app gets installed)
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true)
      }
    }
    try {
      mediaQuery.addEventListener('change', handleDisplayModeChange)
    } catch {
      // Fallback for older browsers
      mediaQuery.addListener(handleDisplayModeChange)
    }

    // 3. Detect Device Platform
    const ua = window.navigator.userAgent.toLowerCase()
    const isIos =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    const isAndroid = /android/i.test(ua)
    
    if (isIos) {
      setDeviceType('ios')
    } else if (isAndroid) {
      setDeviceType('android')
    } else {
      setDeviceType('desktop')
    }

    // 4. Detect in-app browsers (WhatsApp, Instagram, Telegram, Facebook, etc.)
    const inApp = /fban|fbav|instagram|whatsapp|line|twitter|snapchat|micromessenger/i.test(ua)
    setIsInAppBrowser(inApp)

    // 5. Capture beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsStandalone(true)
      setDeferredPrompt(null)
      setShowInstructionsModal(false)
    }
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
      try {
        mediaQuery.removeEventListener('change', handleDisplayModeChange)
      } catch {
        mediaQuery.removeListener(handleDisplayModeChange)
      }
    }
  }, [])

  // Do not render anything until client mounted, or if already running as installed app
  if (!mounted || isStandalone) {
    return null
  }

  const handleInstallClick = async () => {
    // If native prompt is available (Chrome Android, Edge, Desktop Chrome)
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          setIsStandalone(true)
          setDeferredPrompt(null)
          return
        }
      } catch (err) {
        console.warn('[PWA] Prompt error:', err)
      }
      setDeferredPrompt(null)
    }

    // If native prompt is not available (iOS Safari, iPad, in-app browser, or Chrome without prompt fired):
    // Open clear, tailored step-by-step visual instruction modal!
    setShowInstructionsModal(true)
  }

  return (
    <>
      {/* 1. PERMANENT FLOATING APP BANNER (when expanded) */}
      {!isMinimized ? (
        <aside
          role="region"
          aria-label="Install Al-Ihsan Academy App"
          className="fixed bottom-3 left-3 right-3 sm:bottom-4 sm:left-auto sm:right-4 z-[9999] sm:max-w-md bg-[#0A3D3A] text-white p-3.5 sm:p-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] border-2 border-emerald-400/40 animate-in fade-in slide-in-from-bottom-3 backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src="/icons/icon-192x192.png"
                  alt="Al-Ihsan Academy App Icon"
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-contain shadow-md border border-white/20 bg-white"
                />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-xs sm:text-[13px] font-black tracking-wide uppercase text-white truncate">
                    Al-Ihsan Academy App
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-emerald-400/20 text-emerald-300 rounded border border-emerald-400/30">
                    Official
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs font-medium text-emerald-100/90 mt-0.5 leading-snug">
                  {deviceType === 'ios'
                    ? 'Install on your iPhone or iPad for 1-tap class access.'
                    : 'Install app icon for faster classes and instant notifications.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsMinimized(true)}
              title="Minimize banner"
              aria-label="Minimize install banner"
              className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-emerald-950 font-black text-xs sm:text-[13px] py-2 px-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              <span>{deviceType === 'ios' ? 'Install on iPhone / iPad' : 'Install App'}</span>
            </button>

            <button
              onClick={() => setShowInstructionsModal(true)}
              className="bg-white/10 hover:bg-white/15 text-white text-[11px] sm:text-xs font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer min-h-[40px] whitespace-nowrap"
            >
              How to install
            </button>
          </div>
        </aside>
      ) : (
        /* 2. MINIMIZED FLOATING ACTION PILL (Stays permanently on screen until installed) */
        <aside
          role="region"
          aria-label="Install App Shortcut"
          className="fixed bottom-4 right-3 sm:bottom-5 sm:right-5 z-[9999]"
        >
          <button
            onClick={() => setIsMinimized(false)}
            aria-label="Open App Install Options"
            className="flex items-center gap-2 bg-[#0A3D3A] hover:bg-[#0D4A47] text-white px-3.5 py-2.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.4)] border-2 border-emerald-400/50 font-extrabold text-xs cursor-pointer transition-all hover:scale-105 active:scale-95 group"
          >
            <div className="relative">
              <img
                src="/icons/icon-192x192.png"
                alt="App Icon"
                className="w-5 h-5 rounded-md object-contain bg-white"
              />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
            </div>
            <span className="text-emerald-100 group-hover:text-white">Install App</span>
            <Download className="w-3.5 h-3.5 text-emerald-300" />
          </button>
        </aside>
      )}

      {/* 3. STEP-BY-STEP VISUAL INSTALLATION MODAL */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-900/10 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0A3D3A] text-white p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/icons/icon-192x192.png"
                    alt="Al-Ihsan Logo"
                    className="w-12 h-12 rounded-2xl object-contain bg-white p-0.5 shadow-md border border-white/20"
                  />
                  <div>
                    <h2 className="text-base font-black leading-tight">Install Al-Ihsan Academy</h2>
                    <p className="text-xs text-emerald-200/90 mt-0.5">
                      {deviceType === 'ios'
                        ? 'Apple iOS & iPadOS Instructions'
                        : deviceType === 'android'
                        ? 'Android Phone & Tablet Instructions'
                        : 'Desktop & Laptop Instructions'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstructionsModal(false)}
                  className="text-white/70 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* In-App Browser Alert (e.g. WhatsApp / Instagram link) */}
            {isInAppBrowser && (
              <div className="mx-5 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                <p className="font-bold flex items-center gap-1.5 text-amber-800">
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  Viewing inside an In-App Browser
                </p>
                <p className="mt-1 leading-relaxed text-[11px]">
                  Please tap the three dots <strong>(⋮)</strong> or <strong>Share</strong> button and choose{' '}
                  <strong>&quot;Open in Chrome&quot;</strong> or <strong>&quot;Open in Safari&quot;</strong> to install the app icon.
                </p>
              </div>
            )}

            {/* Platform-Specific Step Guide */}
            <div className="p-5 space-y-3.5">
              {deviceType === 'ios' ? (
                /* iOS / iPad Instructions */
                <>
                  <div className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black text-sm">
                      1
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1A2B23]">
                        Tap the Safari <span className="text-emerald-700">Share</span> Button
                      </p>
                      <p className="text-[11px] text-[#4A5D53] mt-0.5 leading-snug">
                        Look for the square icon with an arrow pointing up{' '}
                        <Share className="inline h-3.5 w-3.5 text-blue-600 mx-0.5 align-text-bottom" /> at the bottom
                        of your iPhone screen (or top-right on iPad).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black text-sm">
                      2
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1A2B23]">
                        Select <span className="text-emerald-700">&quot;Add to Home Screen&quot;</span>
                      </p>
                      <p className="text-[11px] text-[#4A5D53] mt-0.5 leading-snug">
                        Scroll down through the share options and tap{' '}
                        <PlusSquare className="inline h-3.5 w-3.5 text-emerald-700 mx-0.5 align-text-bottom" />{' '}
                        <strong>&quot;Add to Home Screen&quot;</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black text-sm">
                      3
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1A2B23]">
                        Tap <span className="text-emerald-700">&quot;Add&quot;</span> in the top-right
                      </p>
                      <p className="text-[11px] text-[#4A5D53] mt-0.5 leading-snug">
                        Confirm the name. The Al-Ihsan Academy app icon will appear immediately on your home screen!
                      </p>
                    </div>
                  </div>
                </>
              ) : deviceType === 'android' ? (
                /* Android Instructions */
                <>
                  <div className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black text-sm">
                      1
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1A2B23]">
                        Tap the Browser Menu <span className="text-emerald-700">(⋮)</span>
                      </p>
                      <p className="text-[11px] text-[#4A5D53] mt-0.5 leading-snug">
                        Tap the three vertical dots{' '}
                        <MoreVertical className="inline h-3.5 w-3.5 text-emerald-800 mx-0.5 align-text-bottom" /> at
                        the top-right corner of Chrome or your browser.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black text-sm">
                      2
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1A2B23]">
                        Select <span className="text-emerald-700">&quot;Install app&quot;</span> or{' '}
                        <span className="text-emerald-700">&quot;Add to Home screen&quot;</span>
                      </p>
                      <p className="text-[11px] text-[#4A5D53] mt-0.5 leading-snug">
                        Look for the download arrow icon or &quot;Add to Home screen&quot; in the dropdown menu.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black text-sm">
                      3
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1A2B23]">
                        Tap <span className="text-emerald-700">&quot;Install&quot;</span> to Finish
                      </p>
                      <p className="text-[11px] text-[#4A5D53] mt-0.5 leading-snug">
                        Confirm the prompt. The app will be installed directly to your phone/tablet app drawer and home screen.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* Desktop / Laptop Instructions */
                <>
                  <div className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black text-sm">
                      1
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1A2B23]">
                        Look at your Browser <span className="text-emerald-700">Address Bar</span>
                      </p>
                      <p className="text-[11px] text-[#4A5D53] mt-0.5 leading-snug">
                        In Google Chrome or Microsoft Edge, look at the right side of the URL bar (near the bookmark star).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black text-sm">
                      2
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1A2B23]">
                        Click the <span className="text-emerald-700">Install Icon</span>
                      </p>
                      <p className="text-[11px] text-[#4A5D53] mt-0.5 leading-snug">
                        Click the computer/download icon{' '}
                        <Download className="inline h-3.5 w-3.5 text-emerald-700 mx-0.5 align-text-bottom" /> with the
                        label &quot;Install Al-Ihsan Academy LMS&quot;.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black text-sm">
                      3
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1A2B23]">
                        Click <span className="text-emerald-700">&quot;Install&quot;</span>
                      </p>
                      <p className="text-[11px] text-[#4A5D53] mt-0.5 leading-snug">
                        A desktop shortcut and standalone window will be created immediately!
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="w-full bg-[#0A3D3A] hover:bg-[#0D4A47] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer min-h-[44px]"
              >
                Understood, Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
