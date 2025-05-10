import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getSupabase() {
  return createRouteHandlerClient({ cookies });
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabase();
    const payload = await request.json();
    
    // Handle both single object and array of objects
    const improvements = Array.isArray(payload) ? payload : [payload];
    
    // Validate each improvement has required fields
    for (const item of improvements) {
      if (!item.persona_id || !item.calibration_id || !item.updated_prompt) {
        return NextResponse.json({ 
          error: "Each item must include persona_id, calibration_id, and updated_prompt" 
        }, { status: 400 });
      }
    }

    // Insert all improvements at once
    const { data, error } = await supabase
      .from("persona_versions")
      .insert(improvements)
      .select();

    if (error) {
      console.error("Error creating persona versions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
} 