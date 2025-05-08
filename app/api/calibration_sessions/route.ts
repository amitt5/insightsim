import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const user = await supabase.auth.getUser()
    const { data, error } = await supabase.from('calibration_sessions').select('*').eq('user_id', user?.data?.user?.id || '')
    if (error) {
      console.error("Error fetching calibration sessions:", error)
    }
    return NextResponse.json({ data, error })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
