import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Interface for contact form data
interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Parse the request body
    const body: ContactFormData = await request.json()
    
    // Validate required fields
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { error: "Name, email, and message are required fields" }, 
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" }, 
        { status: 400 }
      )
    }
    
    // Validate message length
    if (body.message.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters long" }, 
        { status: 400 }
      )
    }
    
    // Get the current session (optional - contact form can work for non-authenticated users)
    const { data: { session } } = await supabase.auth.getSession()
    
    // Prepare data for insertion
    const contactData = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      message: body.message.trim(),
      user_id: session?.user?.id || null,
      status: 'new'
    }
    
    // Insert into database
    const { data: contactMessage, error: insertError } = await supabase
      .from("contact_messages")
      .insert(contactData)
      .select()
      .single()
    
    if (insertError) {
      console.error("Error inserting contact message:", insertError)
      return NextResponse.json(
        { error: "Failed to submit your message. Please try again." }, 
        { status: 500 }
      )
    }
    
    // Return success response
    return NextResponse.json({
      message: "Your message has been submitted successfully. We'll get back to you soon!",
      id: contactMessage.id
    }, { status: 201 })
    
  } catch (error) {
    console.error("Unexpected error in contact form:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." }, 
      { status: 500 }
    )
  }
}

// Optional: GET method to retrieve contact messages (for admin panel)
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all contact messages for admin
    const { data: messages, error: messagesError } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (messagesError) {
      console.error("Error fetching contact messages:", messagesError)
      return NextResponse.json({ error: messagesError.message }, { status: 500 })
    }
    
    return NextResponse.json({ messages })
    
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 