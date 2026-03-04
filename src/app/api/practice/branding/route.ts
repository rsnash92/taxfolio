import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPracticeContext } from '@/lib/practice'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
const MAX_SIZE = 500 * 1024 // 500KB

/**
 * POST /api/practice/branding
 * Upload a practice logo. Owner only.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getPracticeContext(supabase, user.id)
    if (!context || context.membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only practice owners can update branding' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No logo file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: PNG, JPEG, SVG, WebP' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 500KB' }, { status: 400 })
    }

    const practiceId = context.practice.id
    const folder = `${practiceId}`

    // Delete any existing logo files first
    const { data: existingFiles } = await supabase.storage
      .from('practice-assets')
      .list(folder)

    if (existingFiles?.length) {
      const logoFiles = existingFiles.filter(f => f.name.startsWith('logo.'))
      if (logoFiles.length > 0) {
        await supabase.storage
          .from('practice-assets')
          .remove(logoFiles.map(f => `${folder}/${f.name}`))
      }
    }

    // Upload new logo
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const filePath = `${folder}/logo.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('practice-assets')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('[Branding] Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('practice-assets')
      .getPublicUrl(filePath)

    // Merge logo_url into existing branding
    const currentBranding = context.practice.branding || {}
    const updatedBranding = { ...currentBranding, logo_url: publicUrl }

    const { error: updateError } = await supabase
      .from('practices')
      .update({ branding: updatedBranding })
      .eq('id', practiceId)

    if (updateError) {
      console.error('[Branding] DB update error:', updateError)
      return NextResponse.json({ error: 'Failed to save branding' }, { status: 500 })
    }

    return NextResponse.json({ logo_url: publicUrl })
  } catch (error) {
    console.error('[Branding] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/practice/branding
 * Remove the practice logo. Owner only.
 */
export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getPracticeContext(supabase, user.id)
    if (!context || context.membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only practice owners can update branding' }, { status: 403 })
    }

    const practiceId = context.practice.id
    const folder = `${practiceId}`

    // Delete all logo files
    const { data: existingFiles } = await supabase.storage
      .from('practice-assets')
      .list(folder)

    if (existingFiles?.length) {
      const logoFiles = existingFiles.filter(f => f.name.startsWith('logo.'))
      if (logoFiles.length > 0) {
        await supabase.storage
          .from('practice-assets')
          .remove(logoFiles.map(f => `${folder}/${f.name}`))
      }
    }

    // Remove logo_url from branding
    const currentBranding = context.practice.branding || {}
    const { logo_url: _, ...remainingBranding } = currentBranding
    void _

    const { error: updateError } = await supabase
      .from('practices')
      .update({ branding: remainingBranding })
      .eq('id', practiceId)

    if (updateError) {
      console.error('[Branding] DB update error:', updateError)
      return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Branding] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
