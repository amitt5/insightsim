import { NextResponse } from "next/server"
import { checkProjectAccess } from "@/utils/projectAccess"

// GET /api/projects/[projectId]/analysis/synthetic
// Returns existing synthetic analysis from database if found
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const projectId = params.projectId
  try {
    const access = await checkProjectAccess(projectId, false)
    if (!access.success || !access.supabase || !access.session) {
      return access.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const supabase = access.supabase

    // Fetch existing analysis from database
    const { data, error } = await supabase
      .from('project_analysis')
      .select('analysis_json, model, created_at, updated_at')
      .eq('project_id', projectId)
      .eq('source', 'synthetic')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned (not found)
        return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
      }
      console.error('Error fetching analysis from database:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || !data.analysis_json) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      analysis: data.analysis_json,
      model: data.model,
      created_at: data.created_at,
      updated_at: data.updated_at
    })
  } catch (error: any) {
    console.error('Error fetching synthetic analysis:', error)
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 })
  }
}

