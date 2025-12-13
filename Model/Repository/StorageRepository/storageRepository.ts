import { supabase } from '../../Service/APIService/supabase';

/**
 * storageRepository - Handles Supabase Storage operations
 * 
 * MVVM Architecture:
 * - Repository layer: Data access only (Storage CRUD)
 * - No business logic
 * - Used by Services for file uploads/downloads
 */
export const storageRepository = {
    /**
     * Upload file to Supabase Storage
     * @param bucket - Storage bucket name
     * @param path - File path within bucket
     * @param data - File data (ArrayBuffer, Blob, or File)
     * @param contentType - MIME type
     * @returns Upload result with path
     */
    async uploadFile(
        bucket: string,
        path: string,
        data: ArrayBuffer | Blob | File,
        contentType: string
    ): Promise<{ path: string }> {
        const { data: uploadData, error } = await supabase.storage
            .from(bucket)
            .upload(path, data, {
                contentType,
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('[storageRepository] Upload error:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }

        return { path: uploadData.path };
    },

    /**
     * Get public URL for a file
     * @param bucket - Storage bucket name
     * @param path - File path within bucket
     * @returns Public URL
     */
    getPublicUrl(bucket: string, path: string): string {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        if (!data?.publicUrl) {
            throw new Error('Failed to get public URL');
        }

        return data.publicUrl;
    },

    /**
     * Delete file from storage
     * @param bucket - Storage bucket name
     * @param path - File path within bucket
     */
    async deleteFile(bucket: string, path: string): Promise<void> {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            console.error('[storageRepository] Delete error:', error);
            throw error;
        }

        console.log('[storageRepository] Deleted:', path);
    },

    /**
     * Delete file by extracting path from public URL
     * @param bucket - Storage bucket name
     * @param publicUrl - Public URL of the file
     */
    async deleteFileByUrl(bucket: string, publicUrl: string): Promise<void> {
        try {
            // Extract file path from URL
            const url = new URL(publicUrl);
            const pathParts = url.pathname.split(`/${bucket}/`);

            if (pathParts.length < 2) {
                console.warn('[storageRepository] Could not extract file path from URL:', publicUrl);
                return;
            }

            const filePath = pathParts[1];
            await this.deleteFile(bucket, filePath);
        } catch (error) {
            console.error('[storageRepository] Delete by URL failed:', error);
            throw error;
        }
    },
};
