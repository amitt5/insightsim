import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
  
      // Fetch user's role from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', session.user.id)
        .single()
  
      if (userError) {
        console.error("Error fetching user role:", userError)
        return NextResponse.json({ error: "Failed to fetch user role" }, { status: 500 })
      }
  
      // Build the query with counts
      let query = supabase
        .from("projects")
        .select(`
          *,
          simulations:simulations(count),
          human_respondents:human_respondents(count),
          project_personas:project_personas(count)
        `)
        .order("created_at", { ascending: false })
        // .or("is_deleted.is.null,is_deleted.eq.false") // Filter out soft-deleted simulations (include NULL and false values)
  
      // Only filter by user_id if the user is not an admin
      if (userData?.role !== 'admin') {
        query = query.eq("user_id", session.user.id)
      }
  
      // Execute the query
      const { data: projects, error: projectsError } = await query
      
      if (projectsError) {
        console.error("Error fetching projects:", projectsError)
        return NextResponse.json({ error: projectsError.message }, { status: 500 })
      }
  
      // Early return if no projects found
      if (!projects || projects.length === 0) {
        return NextResponse.json({ projects: [] })
      }
      
      // Process projects to include counts
      const projectsWithCounts = projects.map(project => ({
        ...project,
        simulation_count: project.simulations?.[0]?.count || 0,
        interview_count: project.human_respondents?.[0]?.count || 0,
        personas_count: project.project_personas?.[0]?.count || 0
      }))
      
      return NextResponse.json({ 
        projects: projectsWithCounts
      })
    } catch (error) {
      console.error("Unexpected error:", error)
      return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
    }
  }
  