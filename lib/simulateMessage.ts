import { openai } from "./openai";

export async function simulateMessage({ messages }: { messages: Array<{ role: "system" | "user" | "assistant"; content: string }> }) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "";
}
