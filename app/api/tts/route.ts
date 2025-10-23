import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voice, speed, volume } = await request.json();
    console.log('TTS API: Received request for text:', text?.substring(0, 50) + '...');

    if (!text) {
      console.log('TTS API: No text provided');
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.log('TTS API: No API key found');
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    console.log('TTS API: Making request to ElevenLabs...');
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice || 'ys3XeJJA4ArWMhRpcX1D'}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    console.log('TTS API: ElevenLabs response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('TTS API: ElevenLabs error response:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Return the audio data as a stream
    const audioBuffer = await response.arrayBuffer();
    console.log('TTS API: Received audio buffer of size:', audioBuffer.byteLength);
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
