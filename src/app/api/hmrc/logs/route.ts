import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApiLogs, getErrorSummary, clearOldLogs } from '@/lib/hmrc/api-logger'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') as 'success' | 'error' | 'all' | null
  const endpoint = searchParams.get('endpoint')
  const limit = searchParams.get('limit')
  const summary = searchParams.get('summary') === 'true'

  try {
    if (summary) {
      const errorSummary = await getErrorSummary(user.id, 7)
      return NextResponse.json(errorSummary)
    }

    const logs = await getApiLogs({
      userId: user.id,
      status: status || 'all',
      endpoint: endpoint || undefined,
      limit: limit ? parseInt(limit) : 50,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Failed to get HMRC logs:', error)
    return NextResponse.json({ error: 'Failed to get logs' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const daysToKeep = searchParams.get('daysToKeep')

  try {
    const deleted = await clearOldLogs(daysToKeep ? parseInt(daysToKeep) : 30)
    return NextResponse.json({ deleted })
  } catch (error) {
    console.error('Failed to clear logs:', error)
    return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 })
  }
}
