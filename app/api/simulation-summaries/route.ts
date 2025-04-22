import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Define the structure of a message entry
interface SimulationSummary {
  simulation_id: string;
  summary: string[];
  themes: string[];
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the request body
    const { message } = await request.json() as { message: SimulationSummary }
    
    // Insert summaries
    const { error: summaryError } = await supabase
      .from('simulation_summaries')
      .insert(message.summary.map(summary => ({
        simulation_id: message.simulation_id,
        summary
      })))

    if (summaryError) {
      console.error("Error saving summaries:", summaryError)
      return NextResponse.json({ error: summaryError.message }, { status: 500 })
    }

    // Insert themes
    const { error: themeError } = await supabase
      .from('simulation_themes')
      .insert(message.themes.map(theme => ({
        simulation_id: message.simulation_id,
        theme
      })))
    
    if (themeError) {
      console.error("Error saving themes:", themeError)
      return NextResponse.json({ error: themeError.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully saved summaries and themes`
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 

