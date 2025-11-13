/**
 * AssemblyAI Transcription Service
 * Handles audio transcription using AssemblyAI API
 */

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLY_API_KEY;
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';

if (!ASSEMBLYAI_API_KEY) {
  console.warn('ASSEMBLY_API_KEY is not set in environment variables');
}

export interface Utterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

interface TranscriptionResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  utterances?: Utterance[];
  error?: string;
}

/**
 * Upload audio file to AssemblyAI and start transcription
 * @param audioUrl Public URL of the audio file
 * @param webhookUrl Optional webhook URL to receive transcription completion notification
 * @returns Transcription job ID
 */
export async function submitTranscription(
  audioUrl: string,
  webhookUrl?: string
): Promise<string> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error('ASSEMBLY_API_KEY is not configured');
  }

  const requestBody: any = {
    audio_url: audioUrl,
    speaker_labels: true, // Enable speaker diarization
  };

  // Add webhook if provided
  if (webhookUrl) {
    requestBody.webhook_url = webhookUrl;
  }

  const response = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
    method: 'POST',
    headers: {
      'authorization': ASSEMBLYAI_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `AssemblyAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Get transcription status and result
 * @param transcriptId Transcription job ID
 * @returns Transcription status and text if completed
 */
export async function getTranscriptionStatus(
  transcriptId: string
): Promise<TranscriptionResponse> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error('ASSEMBLY_API_KEY is not configured');
  }

  const response = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`, {
    method: 'GET',
    headers: {
      'authorization': ASSEMBLYAI_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `AssemblyAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    status: data.status,
    text: data.text || undefined,
    utterances: data.utterances || undefined,
    error: data.error || undefined,
  };
}

/**
 * Format utterances with speaker labels into a readable transcript
 * @param utterances Array of utterances with speaker labels
 * @returns Formatted transcript string with speaker names
 */
export function formatTranscriptWithSpeakers(utterances: Utterance[]): string {
  if (!utterances || utterances.length === 0) {
    return '';
  }

  return utterances
    .map(utterance => `Speaker ${utterance.speaker}: ${utterance.text}`)
    .join('\n\n');
}

/**
 * Poll for transcription completion
 * @param transcriptId Transcription job ID
 * @param maxAttempts Maximum number of polling attempts
 * @param intervalMs Polling interval in milliseconds
 * @returns Transcription text when completed
 */
export async function pollTranscription(
  transcriptId: string,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getTranscriptionStatus(transcriptId);

    if (status.status === 'completed') {
      // Prefer utterances with speaker labels if available
      if (status.utterances && status.utterances.length > 0) {
        return formatTranscriptWithSpeakers(status.utterances);
      }
      // Fallback to plain text
      if (status.text) {
        return status.text;
      }
    }

    if (status.status === 'error') {
      throw new Error(status.error || 'Transcription failed');
    }

    // Wait before next poll
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('Transcription timeout - maximum polling attempts reached');
}


