import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Papa from 'papaparse'

const MAX_ROWS = 500
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

interface CSVRow {
  date: string
  description: string
  amount: string
  merchant_name?: string
}

function getTaxYear(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  // UK tax year runs 6 April to 5 April
  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}

function parseDate(dateStr: string): Date | null {
  // Try YYYY-MM-DD format first
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return new Date(dateStr)
  }

  // Try DD/MM/YYYY format (UK common)
  const ukMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ukMatch) {
    const [, day, month, year] = ukMatch
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
  }

  // Try DD-MM-YYYY format
  const dashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (dashMatch) {
    const [, day, month, year] = dashMatch
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
  }

  return null
}

function parseAmount(amountStr: string): number | null {
  // Remove currency symbols and whitespace
  const cleaned = amountStr.replace(/[£$€,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 5MB.' }, { status: 400 })
    }

    const text = await file.text()

    // Parse CSV
    const parseResult = Papa.parse<CSVRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
    })

    if (parseResult.errors.length > 0) {
      const errorMessages = parseResult.errors.slice(0, 3).map(e => e.message)
      return NextResponse.json({
        error: 'CSV parsing errors',
        details: errorMessages
      }, { status: 400 })
    }

    const rows = parseResult.data

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No transactions found in file' }, { status: 400 })
    }

    if (rows.length > MAX_ROWS) {
      return NextResponse.json({
        error: `Too many rows. Maximum ${MAX_ROWS} transactions per upload.`
      }, { status: 400 })
    }

    // Validate required columns
    const firstRow = rows[0]
    const hasDate = 'date' in firstRow
    const hasDescription = 'description' in firstRow
    const hasAmount = 'amount' in firstRow

    if (!hasDate || !hasDescription || !hasAmount) {
      const missing = []
      if (!hasDate) missing.push('date')
      if (!hasDescription) missing.push('description')
      if (!hasAmount) missing.push('amount')
      return NextResponse.json({
        error: `Missing required columns: ${missing.join(', ')}`
      }, { status: 400 })
    }

    // Generate batch ID for this upload
    const batchId = crypto.randomUUID()
    const errors: string[] = []
    const validTransactions: Array<{
      user_id: string
      date: string
      description: string
      amount: number
      merchant_name: string | null
      tax_year: string
      source: string
      csv_upload_batch_id: string
      review_status: string
    }> = []

    // Two years ago for date validation
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    // Get existing transactions for duplicate detection
    const { data: existingTransactions } = await supabase
      .from('transactions')
      .select('date, description, amount')
      .eq('user_id', user.id)

    const existingSet = new Set(
      existingTransactions?.map(t => `${t.date}|${t.description}|${t.amount}`) || []
    )

    let duplicateCount = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // Account for header row and 0-index

      // Parse and validate date
      const date = parseDate(row.date?.trim() || '')
      if (!date || isNaN(date.getTime())) {
        errors.push(`Row ${rowNum}: Invalid date "${row.date}"`)
        continue
      }

      if (date < twoYearsAgo) {
        errors.push(`Row ${rowNum}: Date too old (must be within last 2 years)`)
        continue
      }

      if (date > new Date()) {
        errors.push(`Row ${rowNum}: Date cannot be in the future`)
        continue
      }

      // Validate description
      const description = row.description?.trim()
      if (!description) {
        errors.push(`Row ${rowNum}: Description cannot be empty`)
        continue
      }

      // Parse and validate amount
      const amount = parseAmount(row.amount || '')
      if (amount === null) {
        errors.push(`Row ${rowNum}: Invalid amount "${row.amount}"`)
        continue
      }

      // Check for duplicates
      const dateStr = date.toISOString().split('T')[0]
      const key = `${dateStr}|${description}|${amount}`
      if (existingSet.has(key)) {
        duplicateCount++
        continue
      }
      existingSet.add(key) // Prevent duplicates within same upload

      const merchantName = row.merchant_name?.trim() || null

      validTransactions.push({
        user_id: user.id,
        date: dateStr,
        description,
        amount,
        merchant_name: merchantName,
        tax_year: getTaxYear(date),
        source: 'csv_upload',
        csv_upload_batch_id: batchId,
        review_status: 'pending',
      })
    }

    if (validTransactions.length === 0) {
      return NextResponse.json({
        error: 'No valid transactions to import',
        details: errors.slice(0, 10),
        duplicates_skipped: duplicateCount
      }, { status: 400 })
    }

    // Insert transactions
    const { error: insertError } = await supabase
      .from('transactions')
      .insert(validTransactions)

    if (insertError) {
      console.error('Error inserting CSV transactions:', insertError)
      return NextResponse.json({
        error: 'Failed to save transactions'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imported: validTransactions.length,
      duplicates_skipped: duplicateCount,
      errors: errors.slice(0, 10),
      batch_id: batchId,
    })
  } catch (error) {
    console.error('CSV upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process CSV file' },
      { status: 500 }
    )
  }
}
