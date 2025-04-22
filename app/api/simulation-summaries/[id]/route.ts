import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET request to fetch summaries and themes for a specific simulation

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      const { id } = params
      
      const { data, error } = await supabase
        .from('simulation_summaries')
        .select('*')
        .eq('simulation_id', id) 
      const { data: themes, error: themesError } = await supabase
        .from('simulation_themes')
        .select('*')
        .eq('simulation_id', id)
  
  
      return NextResponse.json({ summaries: data, themes: themes })
    } catch (error: any) {
      console.error("Unexpected error:", error)
      return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
    }
  }