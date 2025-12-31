import { createClient } from '@/lib/supabase/server'

export async function logActivity(
  userId: string | null,
  userEmail: string | null,
  action: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase.from('activity_log').insert({
      user_id: userId,
      user_email: userEmail,
      action,
      details: details || null,
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}
