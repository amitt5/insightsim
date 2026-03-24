import { randomUUID } from 'crypto';

export async function callGeminiVision(
  imageUrl: string,
  userMessage: string,
  systemPrompt: string,
): Promise<string> {
  const body = [{
    taskType: 'textInference',
    taskUUID: randomUUID(),
    model: 'google:gemini@3-flash',
    messages: [{ role: 'user', content: userMessage }],
    settings: {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 1000,
    },
  }];

  console.log('[Gemini] request body:', JSON.stringify(body).slice(0, 400));

  const res = await fetch('https://api.runware.ai/v1', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RUNWARE_API_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  console.log('[Gemini] raw response:', raw.slice(0, 600));

  if (!res.ok) {
    throw new Error(`Gemini HTTP error: ${res.status} ${raw}`);
  }

  const json = JSON.parse(raw) as { data?: { text?: string }[]; errors?: { message: string }[] };

  if (json.errors?.length) {
    throw new Error(`Gemini API error: ${json.errors.map(e => e.message).join(', ')}`);
  }

  const text = json.data?.[0]?.text;
  if (!text) throw new Error(`No text in Gemini response: ${raw.slice(0, 300)}`);
  return text;
}

export async function generatePersonImage(prompt: string): Promise<string> {
  const res = await fetch('https://api.runware.ai/v1', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RUNWARE_API_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{
      taskType: 'imageInference',
      taskUUID: randomUUID(),
      model: 'runware:101@1',
      positivePrompt: prompt,
      width: 512,
      height: 768,
      outputType: 'URL',
      outputFormat: 'PNG',
    }]),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Runware error: ${res.status} ${text}`);
  }

  const json = await res.json() as { data: { imageURL: string }[] };
  const imageURL = json.data?.[0]?.imageURL;
  if (!imageURL) throw new Error(`No imageURL in Runware response: ${JSON.stringify(json)}`);
  return imageURL;
}
