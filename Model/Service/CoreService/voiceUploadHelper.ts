import { supabase } from '../APIService/supabase';
import { File } from 'expo-file-system';

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
// HELPER
// ============================================================================
/**
 * voiceUploadHelper - Upload voice messages to Supabase Storage
 * 
 * Single-responsibility helper for uploading audio files to the voice-messages bucket.
 * 
 * File naming: <type>/<contextId>/<senderId>-<timestamp>.m4a
 * Examples:
 *   - preMatch/abc123/user456-1702389600000.m4a
 *   - relationship/xyz789/user456-1702389600000.m4a
 * 
 * @param localFileUri - Local file URI from recording (e.g., file:///...)
 * @param context - Typed chat context with type discriminator
 * @param senderId - Current user ID
 * @returns Public URL of uploaded file
 * @throws Error if upload fails
 * 
 * Usage:
 * ```typescript
 * const mediaUrl = await uploadVoiceMessage(
 *   recordingResult.uri,
 *   { type: 'preMatch', applicationId: 'abc123' },
 *   currentUserId
 * );
 * ```
 */
export async function uploadVoiceMessage(
    localFileUri: string,
    context: ChatContext,
    senderId: string
): Promise<string> {
    const { data } = await supabase.auth.getSession();
    console.log('[debug] session', data);
    console.log('[voiceUploadHelper] Starting upload', { localFileUri, context, senderId });

    // Extract context id based on type
    const contextType = context.type;
    const contextId = context.type === 'preMatch' ? context.applicationId : context.relationshipId;

    // Generate unique filename with type prefix for organization
    const timestamp = Date.now();
    const fileName = `${senderId}-${timestamp}.m4a`;
    const filePath = `${contextType}/${contextId}/${fileName}`;

    try {
        // Create File instance from local URI (Expo SDK 54+ new API)
        const file = new File(localFileUri);

        // Read file as base64 using new API
        const base64Data = await file.base64();

        // Convert base64 to Uint8Array (no external dependency needed)
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, bytes.buffer, {
                contentType: 'audio/m4a',
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('[voiceUploadHelper] Upload error:', error);
            throw new Error(`Failed to upload voice message: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
            throw new Error('Failed to get public URL for uploaded file');
        }

        console.log('[voiceUploadHelper] Upload successful', {
            filePath: data.path,
            publicUrl: urlData.publicUrl
        });

        return urlData.publicUrl;
    } catch (error) {
        console.error('[voiceUploadHelper] Upload failed:', error);
        throw error;
    }
}

/**
 * Delete a voice message from storage (for cleanup)
 * @param mediaUrl - Public URL of the voice message
 */
export async function deleteVoiceMessage(mediaUrl: string): Promise<void> {
    try {
        // Extract file path from URL
        const url = new URL(mediaUrl);
        const pathParts = url.pathname.split(`/${BUCKET_NAME}/`);
        if (pathParts.length < 2) {
            console.warn('[voiceUploadHelper] Could not extract file path from URL:', mediaUrl);
            return;
        }

        const filePath = pathParts[1];

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (error) {
            console.error('[voiceUploadHelper] Delete error:', error);
            throw error;
        }

        console.log('[voiceUploadHelper] Deleted:', filePath);
    } catch (error) {
        console.error('[voiceUploadHelper] Delete failed:', error);
        throw error;
    }
}

export default { uploadVoiceMessage, deleteVoiceMessage };
