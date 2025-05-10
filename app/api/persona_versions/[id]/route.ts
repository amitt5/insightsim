import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getSupabase() {
  return createRouteHandlerClient({ cookies });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const calibrationId = params.id;
    
    if (!calibrationId) {
      return NextResponse.json(
        { error: "Calibration ID is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabase();
    
    // Query persona_versions for the given calibration_id
    const { data, error } = await supabase
      .from("persona_versions")
      .select("*")
      .eq("calibration_id", calibrationId);

    if (error) {
      console.error("Error fetching persona versions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 