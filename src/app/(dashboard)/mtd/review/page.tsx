import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QuarterlyReview } from '@/components/mtd/review/QuarterlyReview'

interface ReviewPageProps {
  searchParams: Promise<{
    businessId?: string
    businessType?: string
    periodStart?: string
    periodEnd?: string
  }>
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const params = await searchParams
  const { businessId, businessType, periodStart, periodEnd } = params

  if (!businessId || !businessType || !periodStart || !periodEnd) {
    redirect('/mtd/quarterly')
  }

  return (
    <QuarterlyReview
      businessId={businessId}
      businessType={businessType}
      periodStart={periodStart}
      periodEnd={periodEnd}
    />
  )
}
