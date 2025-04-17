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
  
    let prompt = `You are simulating a focus group discussion.\n`;
    prompt += `The topic of the discussion is: "${study_title}".\n`;
  
    if (topic) {
      prompt += `Background info: ${topic}\n`;
    }
  
    // Step 1: Participants
    prompt += `\nThere are ${personas.length} participants:\n`;
  
    personas.forEach((persona, index) => {
      prompt += `Participant ${index + 1}: ${persona.name}`;
      if (persona.gender) prompt += ` (${persona.gender})`;
      if (persona.occupation) prompt += ` - occupation: ${persona.occupation}`;
      if (persona.bio) prompt += ` - bio: ${persona.bio}`;
      prompt += `\n`;
    });
  
    // Step 2: Moderator instructions
    prompt += `\nThere is also a moderator named "Moderator". The moderator asks the questions and guides the discussion.\n`;
  
    // Step 3: Guide the conversation
    prompt += `\nUse the following discussion guide to structure the conversation:\n`;
  
    if (discussion_questions?.length) {
      discussion_questions.forEach((q, i) => {
        prompt += `${i + 1}. ${q}\n`;
      });
    }
  
    // Step 4: Response formatting
    prompt += `\nSimulate a realistic and insightful conversation, with natural back-and-forth between participants and moderator.\n`;
    prompt += `Respond ONLY with a JSON array of message objects, where each object has:\n`;
    prompt += `- "name": the speaker (either "Moderator" or one of the participant names)\n`;
    prompt += `- "message": the text they speak\n`;
    prompt += `Do not include any explanation, introduction, or closing text. Just the JSON array.\n`;
  
    prompt += `\nStart the conversation with the moderator initiating the discussion.\n`;
  
    return prompt;
  }
  
