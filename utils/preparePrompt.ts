import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { SimulationMessage } from "@/utils/types";
import { Persona, Simulation } from "@/utils/types";

  


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