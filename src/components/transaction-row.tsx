"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X, Edit2, TrendingUp, TrendingDown, User } from "lucide-react"
import type { TransactionWithCategory } from "@/types/database"

interface TransactionRowProps {
  transaction: TransactionWithCategory
  onConfirm: () => void
  onIgnore: () => void
  onChange: () => void
}

export function TransactionRow({
  transaction,
  onConfirm,
  onIgnore,
  onChange,
}: TransactionRowProps) {
  const isIncome = transaction.amount < 0 // Plaid: negative = money in
  const displayAmount = Math.abs(transaction.amount)

  const category = transaction.category || transaction.ai_suggested_category
  const confidence = transaction.ai_confidence

  // Check if transaction is personal (confirmed or AI suggested)
  const isPersonal = category?.code === 'personal'

  const getConfidenceBadge = () => {
    if (!confidence) return null
    if (confidence >= 0.9) return <Badge variant="default" className="bg-green-600">High</Badge>
    if (confidence >= 0.7) return <Badge variant="secondary" className="bg-amber-500 text-white">Medium</Badge>
    return <Badge variant="destructive">Low</Badge>
  }

  const getStatusBadge = () => {
    switch (transaction.review_status) {
      case "confirmed":
        return <Badge variant="default" className="bg-green-600">Confirmed</Badge>
      case "ignored":
        return <Badge variant="secondary">Ignored</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <div className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
      isPersonal ? "opacity-60 bg-muted/50" : ""
    }`}>
      {/* Amount indicator */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
        isPersonal
          ? "bg-muted"
          : isIncome
            ? "bg-green-100 dark:bg-green-900"
            : "bg-red-100 dark:bg-red-900"
      }`}>
        {isPersonal ? (
          <User className="h-5 w-5 text-muted-foreground" />
        ) : isIncome ? (
          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
        ) : (
          <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
        )}
      </div>

      {/* Transaction details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-medium truncate ${isPersonal ? "text-muted-foreground" : ""}`}>
            {transaction.description}
          </p>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{new Date(transaction.date).toLocaleDateString("en-GB")}</span>
          {transaction.merchant_name && (
            <>
              <span>•</span>
              <span className="truncate">{transaction.merchant_name}</span>
            </>
          )}
          {isPersonal && (
            <>
              <span>•</span>
              <span>Personal</span>
            </>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="flex-shrink-0 text-right hidden sm:block">
        {category ? (
          <div className="flex items-center gap-2 justify-end">
            <span className={`text-sm ${isPersonal ? "text-muted-foreground" : ""}`}>
              {category.name}
            </span>
            {transaction.review_status === "pending" && getConfidenceBadge()}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Uncategorised</span>
        )}
      </div>

      {/* Amount */}
      <div className={`flex-shrink-0 font-medium text-right w-24 ${
        isPersonal
          ? "text-muted-foreground"
          : isIncome
            ? "text-green-600 dark:text-green-400"
            : ""
      }`}>
        {isIncome ? "+" : "-"}£{displayAmount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
      </div>

      {/* Actions */}
      {transaction.review_status === "pending" && (
        <div className="flex-shrink-0 flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onConfirm} title="Confirm">
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onChange} title="Change category">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onIgnore} title="Ignore">
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      )}
    </div>
  )
}
