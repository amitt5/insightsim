// import { SimulationMessage, Persona } from "@/types";
import { Persona, SimulationMessage, Simulation} from "@/utils/types";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";



export function buildMessagesForOpenAI({
  simulation,
  messages,
  personas,
}: {
  simulation: Simulation,
  messages: SimulationMessage[],
  personas: Persona[],
}, study_type: string, userInstruction?: string) {
  const { study_title, topic, discussion_questions } = simulation;
  const personaMap = Object.fromEntries(personas.map(p => [p.id, p.name]));

  const openAIMessages: ChatCompletionMessageParam[] = [];

  // SYSTEM PROMPT
  let systemPrompt = `You are simulating a realistic and insightful focus group discussion with multiple participants and a human moderator.\n\n`;

  systemPrompt += `The topic of the discussion is: "${study_title}".\n`;

  if (topic) {
    systemPrompt += `Background info: ${topic}\n`;
  }

  systemPrompt += `Here are the participants:\n`;

  personas.forEach((p) => {
    systemPrompt += `- ${p.name}`;
    if (p.gender) systemPrompt += ` (${p.gender})`;
    if (p.age) systemPrompt += `, age: ${p.age}`;
    if (p.occupation) systemPrompt += `, occupation: ${p.occupation}`;
    if (p.archetype) systemPrompt += `, archetype: ${p.archetype}`;
    if (p.traits?.length) systemPrompt += `, traits: ${p.traits.join(", ")}`;
    if (p.goal) systemPrompt += `, goal: ${p.goal}`;
    if (p.attitude) systemPrompt += `, attitude: ${p.attitude}`;
    if (p.bio) systemPrompt += `, bio: ${p.bio}`;
    systemPrompt += `\n`;
  });

  if (discussion_questions) {
    systemPrompt += `\nThe moderator has prepared the following discussion guide (questions may be asked in any order):\n`;
    discussion_questions.forEach((q, idx) => {
      if (q?.trim()) {
        systemPrompt += `${idx + 1}. ${q.trim()}\n`;
      }
    });
  }

  systemPrompt += `\nThe moderator is named "Moderator". They guide the discussion by asking questions.\n\n`;


  // Add user instruction if provided (NEW SECTION)
  if (userInstruction?.trim()) {
    systemPrompt += `USER INSTRUCTION (MUST FOLLOW):\n${userInstruction.trim()}\n\n`;
  }

  // Emphasize depth requirement EARLY
  if (study_type === "idi") {
    // systemPrompt += `IMPORTANT: Respond with a short message. Max 10 words\n`;
    // systemPrompt += `IMPORTANT: Respond with a long, detailed, descriptive message of at least 50–200 words per participant. Be reflective and realistic in tone.\n`;
  } else {
    systemPrompt += `Respond with 1–4 participant messages in a natural back-and-forth. Make each message realistic and contextually aware.\n`;
  }

  // JSON format rules
  // Replace your current JSON format rules section with:
systemPrompt += `
RESPONSE FORMAT - CRITICAL:
You must ALWAYS respond with valid JSON in this exact format:

{
  "participants": [
    {"name": "Participant Name", "message": "Their response message"}
  ]
}

STRICT RULES:
- Return ONLY valid JSON - no other text, explanations, or markdown
- Include 1-4 participant responses per turn
- Never include moderator responses
- Each participant gets their own object in the array
- Messages should be ${study_type === "idi" ? "detailed (50-200 words)" : "natural and conversational"}

EXAMPLE:
{
  "participants": [
    {
      "name": "Michael Rodriguez", 
      "message": "When I'm developing a new investment thesis, I start by identifying key macroeconomic trends..."
    }
  ]
}
`;


  openAIMessages.push({
    role: "system",
    content: systemPrompt.trim(),
  });

  // CONVERSATION HISTORY
  for (const m of messages) {
    let name =
      m.sender_type === "moderator"
        ? "Moderator"
        : personaMap[m.sender_id ?? ""] ?? "Unknown";

    openAIMessages.push({
      role: m.sender_type === "moderator" ? "user" : "assistant",
      content: `${name}: ${m.message}`,
    });
  }

  return openAIMessages;
}


export function buildFollowUpQuestionsPrompt({
  simulation,
  messages,
  personas,
}: {
  simulation: Simulation,
  messages: SimulationMessage[],
  personas: Persona[],
}) {
  const { study_title, topic, discussion_questions } = simulation;
  const personaMap = Object.fromEntries(personas.map(p => [p.id, p.name]));

  const openAIMessages: ChatCompletionMessageParam[] = [];

  // Get last 6-8 messages for context (adjust as needed)
  const recentMessages = messages.slice(-8);

  let systemPrompt = `You are an expert qualitative research moderator assistant with 15 years of experience. Your job is to suggest insightful follow-up questions based on the recent conversation in this ${simulation.study_type === 'idi' ? 'in-depth interview' : 'focus group discussion'}.

Study Topic: "${study_title}"
${topic ? `Background: ${topic}` : ''}

Participants:
${personas.map(p => `- ${p.name}${p.age ? ` (${p.age})` : ''}${p.occupation ? `, ${p.occupation}` : ''}${p.archetype ? `, ${p.archetype}` : ''}`).join('\n')}

Based on the recent conversation, suggest 4-5 follow-up questions that would help the moderator:
1. Probe deeper into interesting points participants made
2. Explore contradictions or differences in opinions
3. Uncover underlying motivations or emotions
4. Get more specific examples or stories
5. Challenge assumptions or explore alternative perspectives

Focus on questions that would generate rich, detailed responses and deeper insights.

Return ONLY a JSON array of question objects in this exact format:
[
  { "question": "Can you tell me more about..." },
  { "question": "What specifically made you feel..." },
  { "question": "How does that compare to..." },
  { "question": "Can you give me a specific example of..." }
]

Do not include any explanation, commentary, or text outside the JSON array.`;

  openAIMessages.push({
    role: "system",
    content: systemPrompt.trim(),
  });

  // Add recent conversation context
  let conversationContext = "Recent conversation:\n\n";
  
  for (const m of recentMessages) {
    let name = m.sender_type === "moderator" 
      ? "Moderator" 
      : personaMap[m.sender_id ?? ""] ?? "Unknown";
    
    conversationContext += `${name}: ${m.message}\n\n`;
  }

  openAIMessages.push({
    role: "user",
    content: conversationContext.trim(),
  });

  return openAIMessages;
}
