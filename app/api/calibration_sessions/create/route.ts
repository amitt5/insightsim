import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"


async function getSupabaseAndUser() {
    const supabase = createRouteHandlerClient({ cookies })
    const user = await supabase.auth.getUser()
    const userId = user?.data?.user?.id
    return { supabase, userId }
  }
  

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await getSupabaseAndUser()
    const calibrationSession = await request.json()
    const { data, error } = await supabase.from('calibration_sessions').insert({
      ...calibrationSession,
      user_id: userId
    })
    if (error) {
      console.error('Error creating calibration session:', error)
    }
    return NextResponse.json({ data, error })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 