/**
 * voiceTranscriptionService - Speech-to-Text via AssemblyAI
 * 
 * MVVM Architecture:
 * - Service layer: Business logic only
 * - Handles audio transcription via AssemblyAI API
 * - NO platform-specific code (file reading handled by View layer hook)
 * - Returns plain transcribed text
 * 
 * Uses AssemblyAI free tier: 100 hours/month free
 * https://www.assemblyai.com/
 * 
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TranscriptionResult {
  text: string;
  confidence?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// AssemblyAI API endpoints
const ASSEMBLYAI_UPLOAD_URL = 'https://api.assemblyai.com/v2/upload';
const ASSEMBLYAI_TRANSCRIPT_URL = 'https://api.assemblyai.com/v2/transcript';

// Get API token from environment variable
// - React Native (Expo): Uses EXPO_PUBLIC_* prefix, automatically injected by Expo
// - Web (Vite): Uses VITE_* prefix, mapped to EXPO_PUBLIC_* via vite.config.ts define
const ASSEMBLYAI_API_KEY = process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY || '';

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Transcribe audio to text using AssemblyAI API
 * 
 * Business Logic:
 * - Validates inputs
 * - Uploads audio to AssemblyAI
 * - Submits transcription request
 * - Polls for completion
 * - Returns transcribed text
 * 
 * @param base64Audio - Base64-encoded audio data (from View layer hook)
 * @returns Transcription result with text
 * @throws Error if transcription fails
 * 
 * Usage (from ViewModel):
 * ```typescript
 * const result = await voiceTranscriptionService.transcribeDiary(base64Audio);
 * this.content = result.text;
 * ```
 */
async function transcribeDiary(base64Audio: string): Promise<TranscriptionResult> {
  console.log('[voiceTranscriptionService] Starting transcription', {
    audioLength: base64Audio.length,
  });

  // Business Logic: Validate inputs
  if (!base64Audio) {
    throw new Error('Audio data is required for transcription');
  }

  if (!ASSEMBLYAI_API_KEY) {
    throw new Error(
      'AssemblyAI API token not configured. Set EXPO_PUBLIC_ASSEMBLYAI_API_KEY in .env'
    );
  }

  console.log('[voiceTranscriptionService] API Key configured:', {
    hasKey: !!ASSEMBLYAI_API_KEY,
    keyLength: ASSEMBLYAI_API_KEY?.length || 0,
  });

  try {
    // Business Logic: Convert base64 to binary
    const base64Data = base64Audio.replace(/^data:audio\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Step 1: Upload audio file
    console.log('[voiceTranscriptionService] Uploading audio...');
    const uploadResponse = await fetch(ASSEMBLYAI_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/octet-stream',
      },
      body: bytes,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[voiceTranscriptionService] Upload error details:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        errorText,
        keyLength: ASSEMBLYAI_API_KEY?.length,
      });
    }

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
    }

    const { upload_url } = await uploadResponse.json();
    console.log('[voiceTranscriptionService] Upload successful, transcribing...');

    // Step 2: Submit transcription request
    const transcriptResponse = await fetch(ASSEMBLYAI_TRANSCRIPT_URL, {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: upload_url,
        language_detection: true, // Auto-detect language (supports 99+ languages including Chinese, English, Malay)
      }),
    });

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      throw new Error(`Transcription request failed: ${transcriptResponse.status} ${errorText}`);
    }

    const { id } = await transcriptResponse.json();

    // Step 3: Poll for completion
    console.log('[voiceTranscriptionService] Polling for result...');
    let transcript = null;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max

    while (attempts < maxAttempts) {
      const pollingResponse = await fetch(`${ASSEMBLYAI_TRANSCRIPT_URL}/${id}`, {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
        },
      });

      transcript = await pollingResponse.json();

      if (transcript.status === 'completed') {
        break;
      } else if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      // Wait 1 second before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    if (transcript.status !== 'completed') {
      throw new Error('Transcription timed out');
    }

    console.log('[voiceTranscriptionService] Transcription successful', {
      textLength: transcript.text?.length || 0,
      text: transcript.text?.substring(0, 100), // Log first 100 chars
    });

    if (!transcript.text || transcript.text.trim().length === 0) {
      throw new Error('Transcription returned empty text');
    }

    return {
      text: transcript.text.trim(),
      confidence: transcript.confidence,
    };
  } catch (error: any) {
    console.error('[voiceTranscriptionService] Error:', error);
    throw error;
  }
}

/**
 * Transcribe voice message in chat/pre-match context
 * (Same implementation as diary, kept separate for future feature-specific logic)
 */
async function transcribeMessage(base64Audio: string): Promise<TranscriptionResult> {
  return transcribeDiary(base64Audio);
}

// ============================================================================
// SERVICE EXPORT
// ============================================================================

export const voiceTranscriptionService = {
  transcribeDiary,
  transcribeMessage,
};

export default voiceTranscriptionService;
