// import { SimulationMessage, Persona } from "@/types";
import { Persona } from "@/utils/types";
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
  let systemPrompt = `You are simulating a realistic and insightful focus group discussion with multiple participants and a human moderator.\n\n`;

  systemPrompt += `Here are the participants:\n`;
  personas.forEach((p, i) => {
    systemPrompt += `- ${p.name}`;
    if (p.gender) systemPrompt += ` (${p.gender})`;
    if (p.occupation) systemPrompt += `, occupation: ${p.occupation}`;
    if (p.bio) systemPrompt += `, bio: ${p.bio}`;
    systemPrompt += `\n`;
  });

  systemPrompt += `\nThe moderator is named "Moderator". They guide the discussion by asking questions.\n`;
  systemPrompt += `\nRespond ONLY as the participants (never the moderator), in JSON format:\n`;
  systemPrompt += `[\n  { "name": "Participant Name", "message": "Their message." },\n  ...\n]\n`;
  systemPrompt += `Respond with 2–4 participant messages in a natural back-and-forth.\n`;
  systemPrompt += `Do not include explanations or markdown — only valid JSON.\n`;

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
