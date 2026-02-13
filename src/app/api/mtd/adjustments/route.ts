import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface ManualAdjustment {
  id: string
  user_id: string
  business_id: string
  tax_year: string
  hmrc_field: string
  amount: number
  description: string
  adjustment_type: string
  period_start: string | null
  period_end: string | null
  created_at: string
  updated_at: string
}

const VALID_HMRC_FIELDS = [
  // SE expense fields
  'costOfGoods', 'constructionIndustryScheme', 'staffCosts', 'travelCosts',
  'premisesRunningCosts', 'maintenanceCosts', 'adminCosts', 'advertisingCosts',
  'interest', 'financialCharges', 'badDebt', 'professionalFees',
  'depreciation', 'other',
  // SE income fields
  'turnover',
  // Consolidated
  'consolidatedExpenses',
]

const VALID_ADJUSTMENT_TYPES = [
  'mileage_allowance', 'use_of_home', 'capital_allowance',
  'cash_expense', 'prior_period', 'other',
]

/**
 * GET /api/mtd/adjustments
 * Retrieve adjustments for a business + tax year
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')
    const taxYear = searchParams.get('taxYear')

    if (!businessId || !taxYear) {
      return NextResponse.json(
        { error: 'businessId and taxYear are required' },
        { status: 400 }
      )
    }

    const { data: adjustments, error } = await supabase
      .from('manual_adjustments')
      .select('*')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .eq('tax_year', taxYear)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Adjustments fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch adjustments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ adjustments: adjustments || [] })
  } catch (error) {
    console.error('Adjustments GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch adjustments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mtd/adjustments
 * Create a new adjustment
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, taxYear, hmrcField, amount, description, adjustmentType, periodStart, periodEnd } = body

    // Validate required fields
    if (!businessId || !taxYear || !hmrcField || amount === undefined || !description) {
      return NextResponse.json(
        { error: 'businessId, taxYear, hmrcField, amount, and description are required' },
        { status: 400 }
      )
    }

    if (!VALID_HMRC_FIELDS.includes(hmrcField)) {
      return NextResponse.json(
        { error: `Invalid hmrcField: ${hmrcField}` },
        { status: 400 }
      )
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      return NextResponse.json(
        { error: 'Amount must be a non-zero number' },
        { status: 400 }
      )
    }

    // Round to 2 decimal places
    const roundedAmount = Math.round(parsedAmount * 100) / 100

    const type = adjustmentType || 'other'
    if (!VALID_ADJUSTMENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid adjustmentType: ${type}` },
        { status: 400 }
      )
    }

    if (typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    const { data: adjustment, error } = await supabase
      .from('manual_adjustments')
      .insert({
        user_id: user.id,
        business_id: businessId,
        tax_year: taxYear,
        hmrc_field: hmrcField,
        amount: roundedAmount,
        description: description.trim(),
        adjustment_type: type,
        period_start: periodStart || null,
        period_end: periodEnd || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Adjustment insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create adjustment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ adjustment })
  } catch (error) {
    console.error('Adjustments POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create adjustment' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/mtd/adjustments
 * Update an existing adjustment
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, amount, description, adjustmentType, hmrcField } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount === 0) {
        return NextResponse.json(
          { error: 'Amount must be a non-zero number' },
          { status: 400 }
        )
      }
      updates.amount = Math.round(parsedAmount * 100) / 100
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        return NextResponse.json(
          { error: 'Description cannot be empty' },
          { status: 400 }
        )
      }
      updates.description = description.trim()
    }

    if (adjustmentType !== undefined) {
      if (!VALID_ADJUSTMENT_TYPES.includes(adjustmentType)) {
        return NextResponse.json(
          { error: `Invalid adjustmentType: ${adjustmentType}` },
          { status: 400 }
        )
      }
      updates.adjustment_type = adjustmentType
    }

    if (hmrcField !== undefined) {
      if (!VALID_HMRC_FIELDS.includes(hmrcField)) {
        return NextResponse.json(
          { error: `Invalid hmrcField: ${hmrcField}` },
          { status: 400 }
        )
      }
      updates.hmrc_field = hmrcField
    }

    const { data: adjustment, error } = await supabase
      .from('manual_adjustments')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Adjustment update error:', error)
      return NextResponse.json(
        { error: 'Failed to update adjustment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ adjustment })
  } catch (error) {
    console.error('Adjustments PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update adjustment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/mtd/adjustments
 * Delete an adjustment
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('manual_adjustments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Adjustment delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete adjustment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Adjustments DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete adjustment' },
      { status: 500 }
    )
  }
}
