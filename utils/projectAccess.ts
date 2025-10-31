import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export interface ProjectAccessResult {
  success: boolean
  response?: NextResponse
  supabase?: any
  session?: any
  project?: any
  userData?: any
}

export async function checkProjectAccess(
  projectId: string,
  requireOwnership: boolean = true
): Promise<ProjectAccessResult> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return {
        success: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // Fetch user's role from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (userError) {
      console.error("Error fetching user role:", userError)
      return {
        success: false,
        response: NextResponse.json({ error: "Failed to fetch user role" }, { status: 500 })
      }
    }

    // If ownership check is required, verify project ownership
    if (requireOwnership) {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("user_id")
        .eq("id", projectId)
        .single()

      if (projectError || !project) {
        return {
          success: false,
          response: NextResponse.json({ error: "Project not found" }, { status: 404 })
        }
      }

      // Only check ownership if the user is not an admin
      if (userData?.role !== 'admin' && project.user_id !== session.user.id) {
        return {
          success: false,
          response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
      }

      return {
        success: true,
        supabase,
        session,
        project,
        userData
      }
    }

    // If no ownership check required, just return basic info
    return {
      success: true,
      supabase,
      session,
      userData
    }
  } catch (error) {
    console.error("Unexpected error in project access check:", error)
    return {
      success: false,
      response: NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
    }
  }
}
