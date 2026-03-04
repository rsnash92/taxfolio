"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface BrandingContextValue {
  branding: Record<string, string>
  setBranding: (branding: Record<string, string>) => void
  resetBranding: () => void
}

const BrandingContext = createContext<BrandingContextValue>({
  branding: {},
  setBranding: () => {},
  resetBranding: () => {},
})

export function useBranding() {
  return useContext(BrandingContext)
}

interface BrandingProviderProps {
  initial: Record<string, string>
  children: ReactNode
}

export function BrandingProvider({ initial, children }: BrandingProviderProps) {
  const [branding, setBrandingState] = useState(initial)

  const setBranding = useCallback((b: Record<string, string>) => {
    setBrandingState(b)
  }, [])

  const resetBranding = useCallback(() => {
    setBrandingState(initial)
  }, [initial])

  return (
    <BrandingContext.Provider value={{ branding, setBranding, resetBranding }}>
      <div
        style={{
          "--brand": branding.primary_color || "#00e3ec",
          "--sidebar-bg": branding.sidebar_bg || "#0f172a",
        } as React.CSSProperties}
      >
        {children}
      </div>
    </BrandingContext.Provider>
  )
}
