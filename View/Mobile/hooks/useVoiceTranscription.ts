import { useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { voiceTranscriptionService, type TranscriptionResult } from '@home-sweet-home/model';

/**
 * useVoiceTranscription - Hook for voice transcription file operations (View layer)
 * 
 * MVVM Architecture:
 * - View layer: Platform-specific file reading using expo-file-system
 * - Calls Service for business logic and transcription
 * - NO business logic in this hook
 * 
 * Responsibilities:
 * - Read audio file from device filesystem
 * - Convert to base64
 * - Pass to Service for transcription
 * 
 * Usage:
 * ```tsx
 * const { transcribeAudio } = useVoiceTranscription();
 * 
 * const result = await transcribeAudio(recordingUri);
 * console.log(result.text); // "Hello, this is my diary entry"
 * ```
 */
export function useVoiceTranscription() {
  /**
   * Transcribe audio file to text
   * 
   * Platform-specific: Reads file using expo-file-system
   * Then calls Service for business logic and Whisper transcription
   * 
   * @param audioUri - URI of the audio file on device (e.g., from Audio.Recording)
   * @returns Transcription result with text
   * @throws Error if file reading or transcription fails
   */
  const transcribeAudio = useCallback(
    async (audioUri: string): Promise<TranscriptionResult> => {
      try {
        console.log('[useVoiceTranscription] Starting transcription', {
          audioUri,
        });

        // Platform-specific: Read file using expo-file-system
        const base64Data = await FileSystem.readAsStringAsync(audioUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log('[useVoiceTranscription] Audio file read, size:', base64Data.length);

        // Call Service for business logic and transcription
        const result = await voiceTranscriptionService.transcribeDiary(base64Data);

        console.log('[useVoiceTranscription] Transcription successful', {
          textLength: result.text.length,
        });

        return result;
      } catch (error) {
        console.error('[useVoiceTranscription] Transcription failed:', error);
        throw error;
      }
    },
    []
  );

  return {
    transcribeAudio,
  };
}

export default useVoiceTranscription;
