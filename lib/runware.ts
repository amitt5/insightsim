import { randomUUID } from 'crypto';

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
