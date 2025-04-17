interface Persona {
    id: string;
    name: string;
    gender?: string;
    occupation?: string;
    bio?: string;
  }
  
  interface Simulation {
    study_title: string;
    topic?: string;
    discussion_questions?: string[]; // optional, could also be 'discussion_guide'
  }

  interface Simulation1 {
    id: string;
    user_id: string;
    study_title: string;
    study_type: "focus-group" | "idi";
    mode: "ai-both" | "human-mod";
    topic?: string;
    stimulus_media_url?: string;
    discussion_questions: string[];
    turn_based: boolean;
    num_turns: number;
    status: "Draft" | "Running" | "Completed";
    created_at: string;
  }
  
  export function prepareInitialPrompt(simulation: Simulation, personas: Persona[]) {
    const { study_title, topic, discussion_questions } = simulation;
  
    // Step 1: Build the context/introduction
    let prompt = `You are simulating a focus group discussion.\n`;
    prompt += `The topic of the discussion is: "${study_title}".\n`;
  
    if (topic) {
      prompt += `bio info: ${topic}\n`;
    }
  
    // Step 2: List the participants
    prompt += `\nThere are ${personas.length} participants:\n`;
  
    personas.forEach((persona, index) => {
      prompt += `Participant ${index + 1}: ${persona.name}`;
      if (persona.gender) prompt += ` (${persona.gender})`;
      if (persona.occupation) prompt += ` - occupation: ${persona.occupation}`;
      if (persona.bio) prompt += ` - bio: ${persona.bio}`;
      prompt += `\n`;
    });
  
    // Step 3: Add instructions for simulation behavior
    prompt += `\nSimulate a realistic and insightful conversation between these participants.\n`;
  
    if (discussion_questions) {
      prompt += `Use this guide to shape the conversation:\n${discussion_questions.join('\n')}\n`;
    }
  
    prompt += `\nStart the conversation with one participant making an opening remark.\n`;
  
    return prompt;
  }
  