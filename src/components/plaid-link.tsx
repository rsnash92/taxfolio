"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"

// Plaid Link script loader
declare global {
  interface Window {
    Plaid: {
      create: (config: PlaidConfig) => PlaidHandler
    }
  }
}

interface PlaidConfig {
  token: string
  onSuccess: (publicToken: string, metadata: PlaidMetadata) => void
  onExit: (error: PlaidError | null, metadata: PlaidMetadata) => void
  onLoad: () => void
  onEvent: (eventName: string, metadata: PlaidMetadata) => void
}

interface PlaidHandler {
  open: () => void
  exit: (options?: { force: boolean }) => void
  destroy: () => void
}

interface PlaidMetadata {
  institution?: {
    institution_id: string
    name: string
  }
  accounts?: Array<{
    id: string
    name: string
    mask: string
    type: string
    subtype: string
  }>
  link_session_id?: string
  request_id?: string
}

interface PlaidError {
  error_type: string
  error_code: string
  error_message: string
  display_message: string
}

interface PlaidLinkProps {
  onSuccess: () => void
  children: React.ReactNode
}

export function PlaidLink({ onSuccess, children }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Load Plaid script
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const createLinkToken = useCallback(async () => {
    try {
      const res = await fetch("/api/plaid/create-link-token", {
        method: "POST",
      })
      const data = await res.json()
      if (data.link_token) {
        setLinkToken(data.link_token)
        return data.link_token
      } else {
        toast.error("Failed to create link token")
        return null
      }
    } catch {
      toast.error("Failed to connect to Plaid")
      return null
    }
  }, [])

  const handleClick = async () => {
    setLoading(true)

    try {
      let token = linkToken
      if (!token) {
        token = await createLinkToken()
      }

      if (!token || !window.Plaid) {
        setLoading(false)
        return
      }

      const handler = window.Plaid.create({
        token,
        onSuccess: async (publicToken, metadata) => {
          try {
            const res = await fetch("/api/plaid/exchange-public-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                public_token: publicToken,
                institution: metadata.institution,
              }),
            })

            const data = await res.json()
            if (data.success) {
              onSuccess()
            } else {
              toast.error(data.error || "Failed to connect bank")
            }
          } catch {
            toast.error("Failed to complete connection")
          }
        },
        onExit: (error) => {
          if (error) {
            console.error("Plaid error:", error)
            toast.error(error.display_message || "Connection cancelled")
          }
          setLoading(false)
        },
        onLoad: () => {
          setLoading(false)
        },
        onEvent: (eventName) => {
          console.log("Plaid event:", eventName)
        },
      })

      handler.open()
    } catch {
      setLoading(false)
      toast.error("Failed to open Plaid")
    }
  }

  return (
    <div onClick={handleClick} style={{ cursor: loading ? "wait" : "pointer" }}>
      {children}
    </div>
  )
}
