import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { logError } from "@/utils/errorLogger"
import { OpenAI } from 'openai'
import { buildMessagesForOpenAI } from "@/utils/buildMessagesForOpenAI"
import { Simulation, Persona, SimulationMessage } from "@/utils/types"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Function to parse simulation response (similar to frontend)
function parseSimulationResponse(responseString: string): Array<{name: string, message: string}> {
  try {
    const cleanedString = responseString.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/, '')
      .replace(/^\s*=\s*/, '');
    const parsed = JSON.parse(cleanedString);
    
    // Handle different response formats
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    // Look for participants array
    if (parsed.participants && Array.isArray(parsed.participants)) {
      return parsed.participants;
    }
    
    // Look for any array property
    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value) && value.length > 0) {
        const firstItem = value[0];
        if (firstItem && typeof firstItem === 'object' && 
            ('name' in firstItem || 'Name' in firstItem) && 
            ('message' in firstItem || 'Message' in firstItem)) {
          return value;
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing simulation response:', error);
    return [];
  }
}

// Function to extract participant messages
function extractParticipantMessages(parsedResponse: any): Array<{name: string, message: string}> {
  if (Array.isArray(parsedResponse)) {
    return parsedResponse;
  }
  
  for (const [key, value] of Object.entries(parsedResponse)) {
    if (Array.isArray(value) && value.length > 0) {
      const firstItem = value[0];
      if (firstItem && typeof firstItem === 'object' && 
          ('name' in firstItem || 'Name' in firstItem) && 
          ('message' in firstItem || 'Message' in firstItem)) {
        return value;
      }
    }
  }
  
  return [];
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  let userId: string | undefined;
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = params
    
    // Get user ID for error logging
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id;
    
    // Fetch simulation data
    const { data: simulation, error: simulationError } = await supabase
      .from("simulations")
      .select("*")
      .eq("id", id)
      .single()
    
    if (simulationError || !simulation) {
      return NextResponse.json({ error: "Simulation not found" }, { status: 404 })
    }
    
    // Validate mode is ai-both
    if (simulation.mode !== 'ai-both') {
      return NextResponse.json({ error: "This endpoint is only for AI moderator mode" }, { status: 400 })
    }
    
    // Validate discussion questions exist
    let discussionQuestions: string[] = [];
    if (Array.isArray(simulation.discussion_questions)) {
      discussionQuestions = simulation.discussion_questions.filter((q: any) => q && String(q).trim().length > 0);
    } else if (typeof simulation.discussion_questions === 'string') {
      discussionQuestions = simulation.discussion_questions
        .split('\n')
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0);
    }
    
    if (discussionQuestions.length === 0) {
      return NextResponse.json({ error: "No discussion questions found" }, { status: 400 })
    }
    
    // Fetch personas
    const { data: simulationPersonas } = await supabase
      .from("simulation_personas")
      .select("persona_id")
      .eq("simulation_id", id)
    
    const personaIds = simulationPersonas?.map(sp => sp.persona_id) || []
    
    if (personaIds.length === 0) {
      return NextResponse.json({ error: "No personas found for this simulation" }, { status: 400 })
    }
    
    const { data: personaData } = await supabase
      .from("personas")
      .select("*")
      .in("id", personaIds)
    
    if (!personaData || personaData.length === 0) {
      return NextResponse.json({ error: "Persona details not found" }, { status: 400 })
    }
    
    const personas: Persona[] = personaData.map((p: any) => ({
      ...p,
      traits: Array.isArray(p.traits) ? p.traits : (typeof p.traits === 'string' ? JSON.parse(p.traits || '[]') : [])
    }));
    
    // Create name to persona ID map
    const nameToPersonaIdMap: Record<string, string> = {};
    personas.forEach(persona => {
      const firstName = persona.name.split(' ')[0];
      nameToPersonaIdMap[firstName] = persona.id;
      nameToPersonaIdMap[persona.name] = persona.id;
    });
    
    // Set status to in_progress at the start
    await supabase
      .from('simulations')
      .update({ status: 'in_progress' })
      .eq('id', id)
    
    // Get existing messages to determine next turn_number
    const { data: existingMessages } = await supabase
      .from("simulation_messages")
      .select("turn_number")
      .eq("simulation_id", id)
      .order("turn_number", { ascending: false })
      .limit(1)
    
    let currentTurnNumber = existingMessages && existingMessages.length > 0 
      ? existingMessages[0].turn_number 
      : 0;
    
    const errors: string[] = [];
    let questionsProcessed = 0;
    
    // Process each discussion question sequentially
    for (let i = 0; i < discussionQuestions.length; i++) {
      const question = discussionQuestions[i];
      
      try {
        // 1. Save moderator question
        currentTurnNumber++;
        const moderatorMessage = {
          simulation_id: id,
          sender_type: 'moderator' as const,
          sender_id: null,
          message: question,
          turn_number: currentTurnNumber
        };
        
        const { error: modError } = await supabase
          .from('simulation_messages')
          .insert([moderatorMessage])
        
        if (modError) {
          console.error(`Error saving moderator question ${i + 1}:`, modError);
          errors.push(`Failed to save question ${i + 1}`);
          continue; // Continue to next question
        }
        
        // 2. Get all messages up to this point for context
        const { data: contextMessages } = await supabase
          .from("simulation_messages")
          .select("*")
          .eq("simulation_id", id)
          .order("turn_number", { ascending: true })
        
        if (!contextMessages) {
          errors.push(`Failed to fetch context for question ${i + 1}`);
          continue;
        }
        
        // 3. Build prompt for LLM
        const simulationForPrompt: Simulation = {
          ...simulation,
          discussion_questions: discussionQuestions
        };
        
        const prompt = buildMessagesForOpenAI(
          {
            simulation: simulationForPrompt,
            messages: contextMessages as SimulationMessage[],
            personas: personas
          },
          simulation.study_type || 'focus-group',
          undefined, // userInstruction
          [], // attachedImages
          [] // documentTexts
        );
        
        // 4. Call OpenAI API
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini', // Default model
          messages: prompt,
          temperature: 0.9,
          max_tokens: 3000,
          response_format: { "type": "json_object" }
        });
        
        const reply = completion.choices[0]?.message?.content;
        if (!reply) {
          errors.push(`No response from AI for question ${i + 1}`);
          continue;
        }
        
        // 5. Parse responses
        const parsedMessages = parseSimulationResponse(reply);
        const participantMessages = extractParticipantMessages(parsedMessages);
        
        if (participantMessages.length === 0) {
          errors.push(`No participant responses parsed for question ${i + 1}`);
          continue;
        }
        
        // 6. Save participant responses
        const responseEntries = participantMessages.map((msg, index) => {
          const isModerator = msg.name.toLowerCase() === 'moderator';
          let senderId = null;
          
          if (!isModerator) {
            if (nameToPersonaIdMap[msg.name]) {
              senderId = nameToPersonaIdMap[msg.name];
            } else {
              const firstName = msg.name.split(' ')[0];
              senderId = nameToPersonaIdMap[firstName];
            }
          }
          
          return {
            simulation_id: id,
            sender_type: isModerator ? 'moderator' : 'participant',
            sender_id: senderId,
            message: msg.message,
            turn_number: currentTurnNumber + index + 1
          };
        });
        
        const { error: respError } = await supabase
          .from('simulation_messages')
          .insert(responseEntries)
        
        if (respError) {
          console.error(`Error saving responses for question ${i + 1}:`, respError);
          errors.push(`Failed to save responses for question ${i + 1}`);
          continue;
        }
        
        // Update current turn number
        currentTurnNumber += responseEntries.length;
        questionsProcessed++;
        
      } catch (error: any) {
        console.error(`Error processing question ${i + 1}:`, error);
        errors.push(`Error processing question ${i + 1}: ${error.message}`);
        // Continue to next question
      }
    }
    
    // Update simulation status to Running when all questions are processed
    await supabase
      .from('simulations')
      .update({ status: 'Running' })
      .eq('id', id)
    
    return NextResponse.json({
      success: true,
      message: `Processed ${questionsProcessed} of ${discussionQuestions.length} questions`,
      questionsProcessed,
      totalQuestions: discussionQuestions.length,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error: any) {
    console.error("Unexpected error in run-all-questions:", error)
    
    await logError(
      'run_all_questions_error',
      error instanceof Error ? error : String(error),
      undefined,
      {
        user_id: userId,
        simulation_id: params.id,
        error_type: 'unexpected_error'
      },
      userId
    )
    
    return NextResponse.json({ 
      error: "An unexpected error occurred",
      details: error.message 
    }, { status: 500 })
  }
}

