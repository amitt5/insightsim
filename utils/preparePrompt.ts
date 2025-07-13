import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { SimulationMessage } from "@/utils/types";
import { Persona, Simulation } from "@/utils/types";

  
interface  TranscriptEntry  {
  speaker: string;
  text: string;
};

interface  PersonaMapping  {
  [persona_id: string]: string; // persona_id → real participant name
};

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
      console.log('persona:' + index, persona);
      prompt += `Participant ${index + 1}: ${persona.name}`;
      if (persona.gender) {
        prompt += ` (${persona.gender})`;
      }
      if (persona.age) {
        prompt += ` - age: ${persona.age}`;
      }
      if (persona.occupation) {
        prompt += ` - occupation: ${persona.occupation}`;
      }
      if (persona.location) {
        prompt += ` - location: ${persona.location}`;
      }
      if (persona.archetype) {
        prompt += ` - archetype: ${persona.archetype}`;
      }
      if (persona.traits && persona.traits.length > 0) {
        prompt += ` - traits: ${persona.traits.join(", ")}`;
      }
      if (persona.goal) {
        prompt += ` - goal: ${persona.goal}`;
      }
      
      if (persona.attitude) {
        prompt += ` - attitude: ${persona.attitude}`;
      }
      
      if (persona.bio) {
        prompt += ` - bio: ${persona.bio}`;
      }
    
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
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: prompt
      }
    ];

    return messages;
  }

  export function prepareSummaryPrompt(simulation:Simulation, transcript: SimulationMessage[]): ChatCompletionMessageParam[] {
    const { study_title, topic, discussion_questions } = simulation;
  
    let prompt = `You are a research assistant helping summarize a focus group discussion.\n`;
    prompt += `The study is titled: "${study_title}".\n`;
  
    if (topic) {
      prompt += `Topic background: ${topic}\n`;
    }
  
    if (discussion_questions?.length) {
      prompt += `\nDiscussion Questions:\n`;
      discussion_questions.forEach((q, i) => {
        prompt += `${i + 1}. ${q}\n`;
      });
    }
  
    prompt += `\nBelow is the full transcript of the discussion between the moderator and the participants:\n`;
  
    transcript.forEach(({ sender_type, message }) => {
      prompt += `${sender_type}: ${message}\n`;
    });
  
    prompt += `\nPlease do the following:\n`;
    prompt += `1. Summarize the discussion into 3–5 bullet points (each bullet should be 1–2 sentences).\n`;
    prompt += `2. Extract 4–6 key themes or insights that emerged, as a plain text array..\n`;
    prompt += `Each theme should be a maximum of 1–2 words (e.g., "Influencers", "Sustainability", "Pricing").\n`;

    prompt += `\nRespond in this JSON format:\n`;
    prompt += `{\n  "summary": ["Bullet point 1", "Bullet point 2", ...],\n  "themes": ["Theme 1", "Theme 2", ...]\n}\n`;
  
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: prompt
      }
    ];

    return messages;
  }

  export function buildPersonaImprovementPrompt(
    realTranscriptText: string,
    aiTranscriptText: string,
    personas: Persona[],
    persona_mapping: PersonaMapping
  ): ChatCompletionMessageParam[] {
    const systemPrompt: ChatCompletionMessageParam = {
      role: 'system',
      content:`
      You are an expert qualitative researcher specializing in focus group analysis and AI persona development.
      Your job is to:
      1. Analyze the differences between a real focus group transcript and an AI-simulated version.
      2. Evaluate how well each AI persona (defined with fields like name, age, occupation, traits, archetype, etc.) matched the behavior of their corresponding real participant.
      3. Suggest edits to each AI persona to make them more realistic and better aligned with their intended real counterpart. Improvements can include traits, goals, attitudes, or bio.

      You will receive:
      - personas: A list of AI personas used in the simulation, each with fields like name, age, gender, occupation, traits, archetype, attitude, goal, bio, etc.
      - persona_mapping: A mapping of persona IDs to the real participant names they were meant to represent.
      - real_transcript: A list of transcript entries (speaker + text) from the real discussion.
      - ai_transcript: A list of transcript entries (speaker + text) from the simulated discussion.

      Return your analysis as a JSON object in the following structure:

      {
        "transcript_differences": [string], 
        "persona_improvements": [
          {
            "persona_id": string,
            "suggested_improvements": string
          }
        ]
      }`
    };
  
    const personasText = personas
      .map((p) => {
        return `Persona ID: ${p.id}
        Name: ${p.name}
        ${p.age ? `Age: ${p.age}` : ''}
        ${p.gender ? `Gender: ${p.gender}` : ''}
        ${p.occupation ? `Occupation: ${p.occupation}` : ''}
        ${p.archetype ? `Archetype: ${p.archetype}` : ''}
        ${p.traits?.length ? `Traits: ${p.traits.join(', ')}` : ''}
        ${p.attitude ? `Attitude: ${p.attitude}` : ''}
        ${p.goal ? `Goal: ${p.goal}` : ''}
        ${p.bio ? `Bio: ${p.bio}` : ''}
        `.trim();
      })
      .join('\n\n');
  
    const personaMappingText = Object.entries(persona_mapping)
      .map(([personaId, realName]) => `Persona ID ${personaId} → Participant "${realName}"`)
      .join('\n');

  
    const userPrompt: ChatCompletionMessageParam = {
      role: 'user',
      content: `
    Below are details for your task:
    
    --- PERSONAS ---
    ${personasText}
    
    --- PERSONA MAPPING (AI persona → real participant) ---
    ${personaMappingText}
    
    --- REAL TRANSCRIPT ---
    ${realTranscriptText}
    
    --- AI TRANSCRIPT ---
    ${aiTranscriptText}
    
    Your task:
    1. Summarize key thematic differences between the AI and real transcripts. Focus on overall tone, specificity, emotional nuance, language style, and the kinds of examples given — rather than sentence-by-sentence comparison. Return 3–7 key points that would help improve how personas are written or simulated.
    2. For each persona, **suggest concrete changes to the persona definition** (fields like "traits", "bio", "goals", etc.) based on how the real participant behaved in the transcript.  
    Be **explicit** about what text should be **added**, **removed**, or **reworded**.  
    Avoid vague instructions like "emphasize her skepticism"; instead, provide specific updates like:  
    - "Add to traits": “cautious toward exaggerated marketing claims”  
    - "Revise bio": “...frequently uses Facebook groups for health information”  
    - "Update goal": “...seeks trustworthy product recommendations for her family”

    Return a JSON object of this shape:
    
    {
      "transcript_differences": string[], 
      "persona_improvements": [
        {
          "persona_id": string,
          "suggested_improvements": string
        }
      ]
    }
      `.trim(),
    };
  
    return [systemPrompt, userPrompt];
  }
  