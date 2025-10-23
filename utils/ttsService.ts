interface TTSOptions {
  voice?: string;
  speed?: number;
  volume?: number;
}

interface TTSResponse {
  audioUrl: string;
  success: boolean;
  error?: string;
}

class TTSService {
  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<TTSResponse> {
    try {
      console.log('TTS: Starting synthesis for text:', text.substring(0, 50) + '...');
      
      // First try ElevenLabs API
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            voice: options.voice,
            speed: options.speed,
            volume: options.volume
          }),
        });

        console.log('TTS: Response status:', response.status, response.statusText);

        if (response.ok) {
          // Convert response to blob and create object URL
          const audioBlob = await response.blob();
          console.log('TTS: Audio blob size:', audioBlob.size, 'bytes');
          
          if (audioBlob.size > 0) {
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log('TTS: Successfully created audio URL with ElevenLabs');
            return {
              audioUrl,
              success: true
            };
          }
        }
        
        // If we get here, ElevenLabs failed, so fall back to browser TTS
        console.log('TTS: ElevenLabs failed, falling back to browser TTS');
      } catch (elevenLabsError) {
        console.log('TTS: ElevenLabs error, falling back to browser TTS:', elevenLabsError);
      }

      // Fallback to browser's built-in TTS
      return this.useBrowserTTS(text, options);
      
    } catch (error) {
      console.error('TTS synthesis error:', error);
      return {
        audioUrl: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private useBrowserTTS(text: string, options: TTSOptions = {}): TTSResponse {
    try {
      // Check if browser supports speech synthesis
      if (!('speechSynthesis' in window)) {
        throw new Error('Browser does not support speech synthesis');
      }

      // Create a unique identifier for this TTS request
      const audioUrl = `browser-tts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Store the TTS parameters for the useTTS hook to use
      (window as any).__browserTTSQueue = (window as any).__browserTTSQueue || [];
      (window as any).__browserTTSQueue.push({
        id: audioUrl,
        text,
        options: {
          volume: options.volume || 0.8,
          rate: options.speed || 1.0,
          pitch: 1.0
        }
      });

      console.log('TTS: Using browser TTS fallback');
      return {
        audioUrl,
        success: true
      };
    } catch (error) {
      console.error('Browser TTS error:', error);
      return {
        audioUrl: '',
        success: false,
        error: error instanceof Error ? error.message : 'Browser TTS failed'
      };
    }
  }

  // Get available voices
  async getVoices(): Promise<any[]> {
    try {
      const response = await fetch('/api/tts/voices');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const voices = await response.json();
      return voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  // Clean up object URLs to prevent memory leaks
  revokeAudioUrl(audioUrl: string) {
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
  }
}

export const ttsService = new TTSService();
export type { TTSOptions, TTSResponse };
