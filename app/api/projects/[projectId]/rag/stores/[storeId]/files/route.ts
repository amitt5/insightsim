import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { listFilesInStore } from "@/lib/googleFileSearch"

// GET route to list all files in a File Search Store
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; storeId: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, google_file_search_store_id")
      .eq("id", resolvedParams.projectId)
      .eq("user_id", session.user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Construct store name from storeId
    const storeName = `fileSearchStores/${resolvedParams.storeId}`

    // List files in the store
    const files = await listFilesInStore(storeName)

    return NextResponse.json({
      success: true,
      storeName,
      files
    })

  } catch (error: any) {
    console.error('Error listing files in store:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to list files' 
    }, { status: 500 })
  }
}

