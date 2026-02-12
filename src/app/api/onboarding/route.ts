import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/onboarding
 * Saves onboarding progress to users.dashboard_onboarding_data
 * Optionally marks onboarding as complete.
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { complete, ...updates } = body;

  // Get current onboarding data
  const { data: userData } = await supabase
    .from('users')
    .select('dashboard_onboarding_data')
    .eq('id', user.id)
    .single();

  const currentData = userData?.dashboard_onboarding_data || {
    currentStep: 1,
    aboutYou: null,
    hmrcConnected: false,
    hmrcSkipped: false,
    bankConnected: false,
    bankSkipped: false,
  };

  // Merge updates
  const newData = { ...currentData, ...updates };

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    dashboard_onboarding_data: newData,
  };

  if (complete) {
    updatePayload.dashboard_onboarding_completed = true;
  }

  // If aboutYou includes businessType, also update user_type (shared column)
  if (updates.aboutYou?.businessType) {
    updatePayload.user_type = updates.aboutYou.businessType;
  }

  const { error } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
