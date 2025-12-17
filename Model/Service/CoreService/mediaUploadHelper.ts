import { storageRepository } from '../../Repository/UserRepository/storageRepository';
import type { ChatContext } from './voiceUploadHelper';

// ============================================================================
// CONSTANTS
// ============================================================================
const BUCKET_NAME = 'chat-media';
const MAX_IMAGE_SIZE_MB = 10; // UC104 C4: max 10MB for photos
const MAX_VIDEO_SIZE_MB = 30; // Custom: max 30MB for videos

// ============================================================================
// SERVICE
// ============================================================================
/**
 * mediaUploadHelper - Business logic for chat media uploads (photos/videos)
 * 
 * MVVM Architecture:
 * - Service layer: Business logic only
 * - Uses Repository for storage operations
 * 
 * File naming: <type>/<contextId>/<senderId>-<timestamp>.<ext>
 */

/**
 * Validate file size from base64 data
 * @param base64Data - Base64-encoded data
 * @param maxSizeMB - Maximum allowed size in MB
 * @returns true if valid, throws error if too large
 */
function validateFileSize(base64Data: string, maxSizeMB: number, mediaType: string): void {
    // Base64 encodes 3 bytes into 4 characters, so: size = base64Length * 3/4
    const estimatedSizeBytes = (base64Data.length * 3) / 4;
    const estimatedSizeMB = estimatedSizeBytes / (1024 * 1024);

    if (estimatedSizeMB > maxSizeMB) {
        throw new Error(
            `${mediaType} size too large: ${estimatedSizeMB.toFixed(2)}MB. Maximum allowed: ${maxSizeMB}MB`
        );
    }

    console.log(`[mediaUploadHelper] ${mediaType} size validated: ${estimatedSizeMB.toFixed(2)}MB`);
}

/**
 * Upload image to chat-media bucket
 * @param base64Data - Base64-encoded image data
 * @param context - Chat context (preMatch or relationship)
 * @param senderId - Current user ID
 * @param fileExtension - File extension (jpg, png, etc.)
 * @returns Public URL of uploaded file
 */
export async function uploadChatImage(
    base64Data: string,
    context: ChatContext,
    senderId: string,
    fileExtension: string = 'jpg'
): Promise<string> {
    console.log('[mediaUploadHelper] Uploading image', {
        context,
        senderId,
        dataLength: base64Data.length
    });

    if (!base64Data || !senderId) {
        throw new Error('Base64 data and sender ID are required');
    }

    // Validate file size (max 10MB for images)
    validateFileSize(base64Data, MAX_IMAGE_SIZE_MB, 'Image');

    const contextType = context.type;
    const contextId = context.type === 'preMatch' ? context.applicationId : context.relationshipId;

    const timestamp = Date.now();
    const fileName = `${senderId}-${timestamp}.${fileExtension}`;
    const filePath = `${contextType}/${contextId}/images/${fileName}`;

    try {
        // Convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Determine MIME type
        const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

        // Upload via Repository
        const { path } = await storageRepository.uploadFile(
            BUCKET_NAME,
            filePath,
            bytes.buffer,
            mimeType
        );

        // Get public URL
        const publicUrl = storageRepository.getPublicUrl(BUCKET_NAME, path);

        console.log('[mediaUploadHelper] Image upload successful', { filePath: path, publicUrl });
        return publicUrl;
    } catch (error) {
        console.error('[mediaUploadHelper] Image upload failed:', error);
        throw error;
    }
}

/**
 * Upload video to chat-media bucket
 * @param base64Data - Base64-encoded video data
 * @param context - Chat context (preMatch or relationship)
 * @param senderId - Current user ID
 * @param fileExtension - File extension (mp4, mov, etc.)
 * @returns Public URL of uploaded file
 */
export async function uploadChatVideo(
    base64Data: string,
    context: ChatContext,
    senderId: string,
    fileExtension: string = 'mp4'
): Promise<string> {
    console.log('[mediaUploadHelper] Uploading video', {
        context,
        senderId,
        dataLength: base64Data.length
    });

    if (!base64Data || !senderId) {
        throw new Error('Base64 data and sender ID are required');
    }

    // Validate file size (max 30MB for videos)
    validateFileSize(base64Data, MAX_VIDEO_SIZE_MB, 'Video');

    const contextType = context.type;
    const contextId = context.type === 'preMatch' ? context.applicationId : context.relationshipId;

    const timestamp = Date.now();
    const fileName = `${senderId}-${timestamp}.${fileExtension}`;
    const filePath = `${contextType}/${contextId}/videos/${fileName}`;

    try {
        // Convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Determine MIME type
        const mimeType = fileExtension === 'mov' ? 'video/quicktime' : 'video/mp4';

        // Upload via Repository
        const { path } = await storageRepository.uploadFile(
            BUCKET_NAME,
            filePath,
            bytes.buffer,
            mimeType
        );

        // Get public URL
        const publicUrl = storageRepository.getPublicUrl(BUCKET_NAME, path);

        console.log('[mediaUploadHelper] Video upload successful', { filePath: path, publicUrl });
        return publicUrl;
    } catch (error) {
        console.error('[mediaUploadHelper] Video upload failed:', error);
        throw error;
    }
}

/**
 * Delete chat media from storage
 * @param mediaUrl - Public URL of the media
 */
export async function deleteChatMedia(mediaUrl: string): Promise<void> {
    try {
        await storageRepository.deleteFileByUrl(BUCKET_NAME, mediaUrl);
        console.log('[mediaUploadHelper] Deleted:', mediaUrl);
    } catch (error) {
        console.error('[mediaUploadHelper] Delete failed:', error);
        throw error;
    }
}

export const mediaUploadHelper = {
    uploadChatImage,
    uploadChatVideo,
    deleteChatMedia,
};

export default mediaUploadHelper;
