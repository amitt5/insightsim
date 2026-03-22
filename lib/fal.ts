import { fal } from '@fal-ai/client';

fal.config({ credentials: process.env.FAL_KEY! });

interface FabricOutput {
  data?: {
    video?: {
      url?: string;
    };
  };
  video?: {
    url?: string;
  };
}

// Hardcoded UGC audio for hackathon testing — protein shake ad
const HARDCODED_AUDIO_URL = 'https://v3b.fal.media/files/b/0a93121a/xW6Xv3wQySG0tZYivxHic_protein-ugc.mp3';

export async function generateUGCVideo(imageUrl: string, _script: string): Promise<string> {
  console.log('[fal] Calling VEED Fabric — image_url:', imageUrl);

  let result: FabricOutput;
  try {
    result = await fal.subscribe('veed/fabric-1.0', {
      input: {
        image_url: imageUrl,
        audio_url: HARDCODED_AUDIO_URL,
        resolution: '480p',
      },
    }) as unknown as FabricOutput;
  } catch (err) {
    const details = err instanceof Error
      ? `${err.name}: ${err.message}`
      : JSON.stringify(err);
    console.error('[fal] VEED Fabric error details:', details);
    throw new Error(`VEED Fabric error: ${details}`);
  }

  console.log('[fal] VEED Fabric response:', JSON.stringify(result));
  const videoUrl = result.data?.video?.url ?? result.video?.url;
  if (!videoUrl) throw new Error(`No video URL in VEED Fabric response: ${JSON.stringify(result)}`);
  return videoUrl;
}
