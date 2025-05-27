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
}, study_type: string) {
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

  // Emphasize depth requirement EARLY
  if (study_type === "idi") {
    systemPrompt += `IMPORTANT: Respond with a long, detailed, descriptive message of at least 50–200 words per participant. Be reflective and realistic in tone.\n`;
  } else {
    systemPrompt += `Respond with 1–4 participant messages in a natural back-and-forth. Make each message realistic and contextually aware.\n`;
  }

  // JSON format rules
  systemPrompt += `
Respond ONLY as the participants (never the moderator), in JSON format:

[
  { "name": "Participant Name", "message": "Their message." },
  ...
]

Strictly follow these rules:
- DO NOT include any moderator messages or names.
- DO NOT include any explanation, commentary, or markdown.
- DO NOT include text outside the JSON array.
- DO NOT wrap the response in triple backticks or say "Here is the response".
- ONLY return a valid JSON array of 1 to 4 participant messages.
- Each participant message MUST be elaborate, descriptive, and realistic, with at least 150–200 words.

To guide you, here is an example of the expected format and depth:

[
  {
    "name": "Michael Rodriguez",
    "message": "When I’m developing a new investment thesis, I start by identifying key macroeconomic trends that could influence the sector. For example, if I'm looking into renewable energy, I consider factors like regulatory shifts, technological innovation, and capital flows. Next, I analyze industry reports and peer commentary to benchmark companies. I rely on both qualitative inputs—like executive interviews and field insights—and quantitative data like EBITDA margins, ROIC, and market multiples. I also assess competitive moats and their sustainability over a 5–10 year horizon. I build financial models based on conservative assumptions, stress-test them with pessimistic scenarios, and use DCF and relative valuation methods. My thesis also includes a risk section covering geopolitical and supply chain issues. Once I’m confident, I present it to the investment committee, making sure I can defend my assumptions with credible evidence and anticipate counterarguments. It’s not just about data; it’s about the narrative that connects the data to a long-term value opportunity."
  }
]

Make the conversation feel natural and realistic, as if participants are talking to each other in a group setting.
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
