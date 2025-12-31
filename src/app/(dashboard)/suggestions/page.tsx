"use client"

import { SuggestionsList } from "@/components/suggestions/suggestions-list"

export default function SuggestionsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tax Saving Suggestions</h1>
        <p className="text-muted-foreground">
          AI-powered recommendations to reduce your tax bill
        </p>
      </div>

      <SuggestionsList />
    </div>
  )
}
