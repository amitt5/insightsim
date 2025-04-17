// pages/api/test-simulation.ts
import { NextApiRequest, NextApiResponse } from "next";
import { simulateMessage } from "@/lib/simulateMessage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const result = await simulateMessage({
    messages: [
      { role: "system", content: "You are an enthusiastic teenager discussing social media." },
      { role: "user", content: "What do you think about TikTok?" },
    ],
  });
  console.log('amit2');

  res.status(200).json({ reply: result });
}