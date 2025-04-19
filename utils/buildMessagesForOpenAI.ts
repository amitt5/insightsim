// import { SimulationMessage, Persona } from "@/types";
interface Persona {
    id: string;
    name: string;
    gender?: string;
    occupation?: string;
    bio?: string;
  }
import { SimulationMessage } from "@/utils/types";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";



export function buildMessagesForOpenAI({
  messages,
  personas,
}: {
  messages: SimulationMessage[],
  personas: Persona[],
}) {
  const personaMap = Object.fromEntries(personas.map(p => [p.id, p.name]));

  const openAIMessages: ChatCompletionMessageParam[] = [];

  // SYSTEM PROMPT
  openAIMessages.push({
    role: "system",
    content: `
You are simulating a realistic and insightful focus group discussion with multiple participants and a human moderator.

Respond ONLY as the participants (never the moderator), in JSON format:
[
  { "name": "Participant Name", "message": "Their message." },
  ...
]

Respond with 2–4 participant messages in a natural back-and-forth.
Do not include explanations or markdown — only valid JSON.
    `.trim(),
  });

  // CONVERSATION HISTORY
  for (const m of messages) {
    let name = m.sender_type === "moderator" ? "Moderator" : personaMap[m.sender_id ?? ""] ?? "Unknown";

    openAIMessages.push({
      role: m.sender_type === "moderator" ? "user" : "assistant",
      content: `${name}: ${m.message}`,
    });
  }

  return openAIMessages;
}
