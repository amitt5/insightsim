import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CREDIT_RATES } from '@/utils/openai'

async function getSupabaseAndUser() {
    const supabase = createRouteHandlerClient({ cookies })
    const user = await supabase.auth.getUser()
    const userId = user?.data?.user?.id
    return { supabase, userId }
}

export async function GET() {
  try {
    const { supabase, userId } = await getSupabaseAndUser()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data: userCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching user credits:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch user credits' },
        { status: 500 }
      )
    }

    if (!userCredits) {
      return NextResponse.json(
        { error: 'User credits not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      available_credits: userCredits.credits
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await getSupabaseAndUser()

    const body = await request.json()
    
    const { input_tokens, output_tokens, model } = body

    // Validate required fields
    if (!userId || typeof input_tokens !== 'number' || typeof output_tokens !== 'number' || !model ||
        !(model in CREDIT_RATES)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate model type
    if (!(model in CREDIT_RATES)) {
      return NextResponse.json(
        { error: 'Invalid model specified' },
        { status: 400 }
      )
    }

    // Calculate total tokens and credits to deduct
    const modelKey = model as keyof typeof CREDIT_RATES
    const creditsToDeduct = 
    (input_tokens / 100) * CREDIT_RATES[modelKey].input + 
    (output_tokens / 100) * CREDIT_RATES[modelKey].output

    // Fetch current user credits
    const { data: userCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching user credits:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch user credits' },
        { status: 500 }
      )
    }

    if (!userCredits || userCredits.credits < creditsToDeduct) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      )
    }

    // Deduct credits atomically
    const { data: updatedCredits, error: updateError } = await supabase
      .from('user_credits')
      .update({
        credits: userCredits.credits - creditsToDeduct,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('credits')
      .single()

    if (updateError) {
      console.error('Error updating user credits:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user credits' },
        { status: 500 }
      )
    }

    const { error: logError } = await supabase
    .from('model_usage_logs')
    .insert([{
      user_id: userId,
      model,
      input_tokens,
      output_tokens,
      credits_deducted: creditsToDeduct,
      created_at: new Date().toISOString()
    }])

    if (logError) {
      console.error('Error inserting usage log:', logError)
      // Do not return error to user — log silently
    }

    return NextResponse.json({
      remaining_credits: updatedCredits.credits,
      credits_deducted: creditsToDeduct
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 