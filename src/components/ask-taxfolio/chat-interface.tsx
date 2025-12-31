"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { SuggestedQuestions } from "./suggested-questions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot } from "lucide-react"
import Cookies from "js-cookie"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatInterfaceProps {
  transactionId?: string
  className?: string
}

const TAX_YEAR_COOKIE = "taxfolio_tax_year"

function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}

export function ChatInterface({ transactionId, className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(true)
  const [rateLimit, setRateLimit] = useState<{ remaining: number; resetAt: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [taxYear, setTaxYear] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return Cookies.get(TAX_YEAR_COOKIE) || getCurrentTaxYear()
    }
    return getCurrentTaxYear()
  })

  // Listen for tax year changes
  useEffect(() => {
    const handleTaxYearChange = (e: CustomEvent) => {
      setTaxYear(e.detail)
      // Refresh suggestions when tax year changes
      fetchSuggestions(e.detail)
    }

    window.addEventListener("taxYearChanged", handleTaxYearChange as EventListener)
    return () => {
      window.removeEventListener("taxYearChanged", handleTaxYearChange as EventListener)
    }
  }, [])

  // Fetch suggestions on mount
  const fetchSuggestions = useCallback(async (year: string) => {
    setSuggestionsLoading(true)
    try {
      const response = await fetch(`/api/ask?tax_year=${year}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error)
    } finally {
      setSuggestionsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSuggestions(taxYear)
  }, [fetchSuggestions, taxYear])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          tax_year: taxYear,
          transaction_id: transactionId,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response")
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (data.rate_limit) {
        setRateLimit(data.rate_limit)
      }

      // Hide suggestions after first message
      if (messages.length === 0) {
        setSuggestions([])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "Sorry, I encountered an error. Please try again.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (question: string) => {
    sendMessage(question)
  }

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="w-16 h-16 rounded-full bg-[#15e49e]/20 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-[#15e49e]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ask TaxFolio</h3>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              I can help you understand your finances and UK tax rules. Ask me about
              your transactions, allowable expenses, or tax calculations.
            </p>
            {!suggestionsLoading && suggestions.length > 0 && (
              <SuggestedQuestions
                questions={suggestions}
                onSelect={handleSuggestionClick}
                isLoading={isLoading}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))}
            {isLoading && (
              <ChatMessage role="assistant" content="" isLoading />
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="border-t p-4 space-y-3">
        {rateLimit && rateLimit.remaining < 10 && (
          <p className="text-xs text-muted-foreground text-center">
            {rateLimit.remaining} questions remaining this hour
          </p>
        )}
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}
