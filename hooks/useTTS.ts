import { useState, useRef, useCallback } from 'react';
import { ttsService, TTSOptions } from '@/utils/ttsService';

interface UseTTSReturn {
  isPlaying: boolean;
  currentAudioUrl: string | null;
  playText: (text: string, options?: TTSOptions) => Promise<void>;
  stopPlayback: () => void;
  error: string | null;
}

export const useTTS = (): UseTTSReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopPlayback = useCallback(() => {
    // Stop audio element if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Stop browser speech synthesis if playing
    if (currentAudioUrl && currentAudioUrl.startsWith('browser-tts-')) {
      speechSynthesis.cancel();
    }
    
    setIsPlaying(false);
    
    // Clean up previous audio URL
    if (currentAudioUrl) {
      if (!currentAudioUrl.startsWith('browser-tts-')) {
        ttsService.revokeAudioUrl(currentAudioUrl);
      }
      setCurrentAudioUrl(null);
    }
  }, [currentAudioUrl]);

  const playText = useCallback(async (text: string, options?: TTSOptions) => {
    try {
      setError(null);
      
      // Stop any current playback
      stopPlayback();

      // Synthesize speech
      const result = await ttsService.synthesizeSpeech(text, options);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to synthesize speech');
      }

      // Check if this is browser TTS
      if (result.audioUrl.startsWith('browser-tts-')) {
        // Use browser's speech synthesis
        playBrowserTTS(result.audioUrl);
      } else {
        // Use audio element for ElevenLabs
        const audio = new Audio(result.audioUrl);
        audioRef.current = audio;
        setCurrentAudioUrl(result.audioUrl);

        // Set up event listeners
        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => {
          setIsPlaying(false);
          ttsService.revokeAudioUrl(result.audioUrl);
          setCurrentAudioUrl(null);
        };
        audio.onerror = () => {
          setIsPlaying(false);
          setError('Failed to play audio');
          ttsService.revokeAudioUrl(result.audioUrl);
          setCurrentAudioUrl(null);
        };

        // Set volume and playback rate
        if (options?.volume !== undefined) {
          audio.volume = Math.max(0, Math.min(1, options.volume));
        }
        if (options?.speed !== undefined) {
          audio.playbackRate = Math.max(0.5, Math.min(2, options.speed));
        }

        await audio.play();
      }
    } catch (err) {
      console.error('TTS playback error:', err);
      setError(err instanceof Error ? err.message : 'Failed to play speech');
      setIsPlaying(false);
    }
  }, [stopPlayback]);

  const playBrowserTTS = useCallback((audioUrl: string) => {
    try {
      // Find the TTS request in the queue
      const ttsQueue = (window as any).__browserTTSQueue || [];
      const ttsRequest = ttsQueue.find((req: any) => req.id === audioUrl);
      
      if (!ttsRequest) {
        throw new Error('TTS request not found');
      }

      // Stop any current speech
      speechSynthesis.cancel();

      // Create speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(ttsRequest.text);
      
      // Set options
      utterance.volume = ttsRequest.options.volume;
      utterance.rate = ttsRequest.options.rate;
      utterance.pitch = ttsRequest.options.pitch;

      // Set up event listeners
      utterance.onstart = () => {
        setIsPlaying(true);
        setCurrentAudioUrl(audioUrl);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentAudioUrl(null);
        // Remove from queue
        const index = ttsQueue.findIndex((req: any) => req.id === audioUrl);
        if (index > -1) {
          ttsQueue.splice(index, 1);
        }
      };
      
      utterance.onerror = (event) => {
        setIsPlaying(false);
        setCurrentAudioUrl(null);
        setError(`Speech synthesis error: ${event.error}`);
        // Remove from queue
        const index = ttsQueue.findIndex((req: any) => req.id === audioUrl);
        if (index > -1) {
          ttsQueue.splice(index, 1);
        }
      };

      // Speak
      speechSynthesis.speak(utterance);
      
    } catch (err) {
      console.error('Browser TTS error:', err);
      setError(err instanceof Error ? err.message : 'Browser TTS failed');
      setIsPlaying(false);
    }
  }, []);

  return {
    isPlaying,
    currentAudioUrl,
    playText,
    stopPlayback,
    error
  };
};
