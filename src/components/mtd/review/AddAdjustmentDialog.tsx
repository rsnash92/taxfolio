'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { SELF_EMPLOYMENT_EXPENSE_CATEGORIES } from '@/types/mtd'
import type { AdjustmentSummary } from '@/app/api/mtd/aggregate/route'

const ADJUSTMENT_TYPES = [
  { value: 'mileage_allowance', label: 'Mileage allowance' },
  { value: 'use_of_home', label: 'Use of home' },
  { value: 'capital_allowance', label: 'Capital allowance' },
  { value: 'cash_expense', label: 'Cash expense' },
  { value: 'prior_period', label: 'Prior period' },
  { value: 'other', label: 'Other' },
] as const

const HMRC_FIELD_OPTIONS = [
  { value: 'turnover', label: 'Turnover (Income)' },
  ...SELF_EMPLOYMENT_EXPENSE_CATEGORIES.map((cat) => ({
    value: cat.key,
    label: cat.label,
  })),
  { value: 'consolidatedExpenses', label: 'Consolidated Expenses' },
]

interface AddAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  businessId: string
  taxYear: string
  periodStart: string
  periodEnd: string
  initialHmrcField: string
  editAdjustment: AdjustmentSummary | null
}

export function AddAdjustmentDialog({
  open,
  onOpenChange,
  onSave,
  businessId,
  taxYear,
  periodStart,
  periodEnd,
  initialHmrcField,
  editAdjustment,
}: AddAdjustmentDialogProps) {
  const [hmrcField, setHmrcField] = useState('')
  const [adjustmentType, setAdjustmentType] = useState('other')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!editAdjustment

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (editAdjustment) {
        setHmrcField(editAdjustment.hmrcField || '')
        setAdjustmentType(editAdjustment.adjustmentType || 'other')
        setAmount(editAdjustment.amount.toString())
        setDescription(editAdjustment.description)
      } else {
        setHmrcField(initialHmrcField || '')
        setAdjustmentType('other')
        setAmount('')
        setDescription('')
      }
      setError(null)
    }
  }, [open, editAdjustment, initialHmrcField])

  const handleSave = async () => {
    setError(null)

    if (!hmrcField) {
      setError('Please select a category')
      return
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      setError('Please enter a non-zero amount')
      return
    }

    if (!description.trim()) {
      setError('Please enter a description')
      return
    }

    setSaving(true)
    try {
      const url = '/api/mtd/adjustments'
      const method = isEditing ? 'PUT' : 'POST'
      const body = isEditing
        ? {
            id: editAdjustment!.id,
            hmrcField,
            adjustmentType,
            amount: parsedAmount,
            description: description.trim(),
          }
        : {
            businessId,
            taxYear,
            hmrcField,
            adjustmentType,
            amount: parsedAmount,
            description: description.trim(),
            periodStart,
            periodEnd,
          }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save adjustment')
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Adjustment' : 'Add Adjustment'}</DialogTitle>
          <DialogDescription>
            Adjustments are stored as digital records for HMRC compliance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="adj-category">Category</Label>
            <Select value={hmrcField} onValueChange={setHmrcField}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select HMRC category" />
              </SelectTrigger>
              <SelectContent>
                {HMRC_FIELD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-type">Type</Label>
            <Select value={adjustmentType} onValueChange={setAdjustmentType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                &pound;
              </span>
              <Input
                id="adj-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
            <p className="text-xs text-gray-400">
              Positive to increase, negative to decrease
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-description">Description</Label>
            <Input
              id="adj-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Business mileage 2,500 miles @ 45p"
              maxLength={200}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#00e3ec] hover:bg-[#00c4d4] text-black"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : isEditing ? (
              'Update'
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
