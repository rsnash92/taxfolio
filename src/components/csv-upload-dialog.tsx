"use client"

import { useState, useRef } from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface CSVRow {
  date?: string
  description?: string
  amount?: string
  merchant_name?: string
}

interface CSVUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CSVUploadDialog({ open, onOpenChange, onSuccess }: CSVUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CSVRow[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setParseError(null)

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please select a CSV file')
      return
    }

    Papa.parse<CSVRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
      preview: 6, // Get first 5 rows + check total
      complete: (results) => {
        // Validate required columns
        if (results.data.length === 0) {
          setParseError('No data found in CSV file')
          return
        }

        const firstRow = results.data[0]
        const hasDate = 'date' in firstRow
        const hasDescription = 'description' in firstRow
        const hasAmount = 'amount' in firstRow

        if (!hasDate || !hasDescription || !hasAmount) {
          const missing = []
          if (!hasDate) missing.push('date')
          if (!hasDescription) missing.push('description')
          if (!hasAmount) missing.push('amount')
          setParseError(`Missing required columns: ${missing.join(', ')}`)
          return
        }

        setFile(selectedFile)
        setPreview(results.data.slice(0, 5))

        // Get total row count
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (fullResults) => {
            setTotalRows(fullResults.data.length)
          }
        })
      },
      error: () => {
        setParseError('Failed to parse CSV file')
      }
    })
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/transactions/upload-csv', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      let message = `Imported ${data.imported} transactions`
      if (data.duplicates_skipped > 0) {
        message += ` (${data.duplicates_skipped} duplicates skipped)`
      }
      toast.success(message)

      // Reset state
      setFile(null)
      setPreview([])
      setTotalRows(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview([])
    setTotalRows(0)
    setParseError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload CSV</DialogTitle>
          <DialogDescription>
            Import transactions from a CSV file. Required columns: date, description, amount.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors ${
              parseError ? 'border-red-500' : 'border-muted-foreground/25'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-sm">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <span className="font-medium">{file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <span>Click to select a CSV file</span>
              </div>
            )}
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>{totalRows} transactions found</span>
              </div>

              <div className="text-sm text-muted-foreground">Preview (first 5 rows):</div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">Description</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{row.date}</td>
                        <td className="px-3 py-2 truncate max-w-[200px]">{row.description}</td>
                        <td className="px-3 py-2 text-right">{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-muted-foreground">
                <strong>Amount convention:</strong> Positive = money out (expenses), Negative = money in (income)
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading || !!parseError}>
            {uploading ? 'Uploading...' : `Import ${totalRows} Transactions`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
