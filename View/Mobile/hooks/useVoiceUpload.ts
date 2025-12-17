import { useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { voiceUploadService, type ChatContext } from '@home-sweet-home/model';

/**
 * useVoiceUpload - Hook for voice message file operations (View layer)
 * 
 * MVVM Architecture:
 * - View layer: Platform-specific file reading using expo-file-system
 * - Calls Service for business logic and upload
 * - NO business logic in this hook
 * 
 * Usage:
 * ```tsx
 * const { uploadVoiceMessage } = useVoiceUpload();
 * 
 * const url = await uploadVoiceMessage(
 *   recordingResult.uri,
 *   { type: 'preMatch', applicationId: 'abc123' },
 *   currentUserId,
 *   recordingResult.durationSeconds
 * );
 * ```
 */
export function useVoiceUpload() {
    /**
     * Upload voice message
     * Platform-specific: Reads file using expo-file-system
     * Then calls Service for business logic
     */
    const uploadVoiceMessage = useCallback(async (
        fileUri: string,
        context: ChatContext,
        senderId: string,
        durationSeconds?: number
    ): Promise<string> => {
        try {
            // Platform-specific: Read file using expo-file-system
            const base64Data = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Call Service for business logic and upload
            const publicUrl = await voiceUploadService.uploadVoiceMessage(
                base64Data,
                context,
                senderId,
                durationSeconds
            );

            return publicUrl;
        } catch (error) {
            console.error('[useVoiceUpload] Upload failed:', error);
            throw error;
        }
    }, []);

    /**
     * Delete voice message
     * Delegates to Service
     */
    const deleteVoiceMessage = useCallback(async (mediaUrl: string): Promise<void> => {
        try {
            await voiceUploadService.deleteVoiceMessage(mediaUrl);
        } catch (error) {
            console.error('[useVoiceUpload] Delete failed:', error);
            throw error;
        }
    }, []);

    return {
        uploadVoiceMessage,
        deleteVoiceMessage,
    };
}

export default useVoiceUpload;
