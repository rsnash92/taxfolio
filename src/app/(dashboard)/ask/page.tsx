"use client"

import { ChatInterface } from "@/components/ask-taxfolio"
import { Card } from "@/components/ui/card"

export default function AskPage() {
  return (
    <div className="h-[calc(100vh-120px)]">
      <Card className="h-full flex flex-col overflow-hidden">
        <ChatInterface />
      </Card>
    </div>
  )
}
