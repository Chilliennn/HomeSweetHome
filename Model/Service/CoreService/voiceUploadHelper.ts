import { storageRepository } from '../../Repository/StorageRepository/storageRepository';

// ============================================================================
// TYPES
// ============================================================================
/**
 * ChatContext - Typed context for upload path determination
 * Use this to ensure type safety when passing context around
 */
export type ChatContext =
    | { type: 'preMatch'; applicationId: string }
    | { type: 'relationship'; relationshipId: string };

// ============================================================================
// CONSTANTS
// ============================================================================
const BUCKET_NAME = 'voice-messages';

// ============================================================================
// SERVICE
// ============================================================================
/**
 * voiceUploadService - Business logic for voice message uploads
 * 
 * MVVM Architecture:
 * - Service layer: Business logic only
 * - NO platform-specific code (file reading moved to View layer)
 * - Uses Repository for storage operations
 * 
 * File naming: <type>/<contextId>/<senderId>-<timestamp>.m4a
 * Examples:
 *   - preMatch/abc123/user456-1702389600000.m4a
 *   - relationship/xyz789/user456-1702389600000.m4a
 * 
 * @param base64Data - Base64-encoded audio data (from View layer)
 * @param context - Typed chat context with type discriminator
 * @param senderId - Current user ID
 * @param durationSeconds - Optional duration in seconds
 * @returns Public URL of uploaded file
 * @throws Error if upload fails
 * 
 * Usage (from View layer hook):
 * ```typescript
 * const url = await voiceUploadService.uploadVoiceMessage(
 *   base64Data,
 *   { type: 'preMatch', applicationId: 'abc123' },
 *   currentUserId,
 *   120
 * );
 * ```
 */
export async function uploadVoiceMessage(
    base64Data: string,
    context: ChatContext,
    senderId: string,
    durationSeconds?: number
): Promise<string> {
    console.log('[voiceUploadService] Starting upload', {
        context,
        senderId,
        durationSeconds,
        dataLength: base64Data.length
    });

    // Business logic: Validate inputs
    if (!base64Data || !senderId) {
        throw new Error('Base64 data and sender ID are required');
    }

    // Business logic: Extract context id based on type
    const contextType = context.type;
    const contextId = context.type === 'preMatch' ? context.applicationId : context.relationshipId;

    // Business logic: Generate unique filename with type prefix for organization
    const timestamp = Date.now();
    const fileName = `${senderId}-${timestamp}.m4a`;
    const filePath = `${contextType}/${contextId}/${fileName}`;

    try {
        // Convert base64 to Uint8Array (no external dependency needed)
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Upload via Repository
        const { path } = await storageRepository.uploadFile(
            BUCKET_NAME,
            filePath,
            bytes.buffer,
            'audio/m4a'
        );

        // Get public URL via Repository
        const publicUrl = storageRepository.getPublicUrl(BUCKET_NAME, path);

        console.log('[voiceUploadService] Upload successful', {
            filePath: path,
            publicUrl,
            durationSeconds
        });

        return publicUrl;
    } catch (error) {
        console.error('[voiceUploadService] Upload failed:', error);
        throw error;
    }
}

/**
 * Delete a voice message from storage (for cleanup)
 * Business logic: Extract path and delete via Repository
 * @param mediaUrl - Public URL of the voice message
 */
export async function deleteVoiceMessage(mediaUrl: string): Promise<void> {
    try {
        await storageRepository.deleteFileByUrl(BUCKET_NAME, mediaUrl);
        console.log('[voiceUploadService] Deleted:', mediaUrl);
    } catch (error) {
        console.error('[voiceUploadService] Delete failed:', error);
        throw error;
    }
}

export const voiceUploadService = {
    uploadVoiceMessage,
    deleteVoiceMessage,
};

export default voiceUploadService;

