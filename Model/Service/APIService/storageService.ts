import { supabase } from './supabase';

/**
 * StorageService - Handles file uploads to Supabase Storage
 * 
 * Responsibilities:
 * - Upload files to Supabase Storage buckets
 * - Generate public URLs for uploaded files
 * - Handle file path construction
 * - Manage storage errors
 */

const MEDIA_BUCKET = 'family-media'; // bucket name
const MAX_RETRIES = 3;

// Pure JS base64 decoder (avoids Buffer/atob dependencies)
function base64ToBytes(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = base64.replace(/\s/g, '');
  let output = [] as number[];

  let buffer = 0;
  let bitsCollected = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charAt(i);
    const val = chars.indexOf(ch);
    if (val === -1) continue; // skip invalid chars
    if (ch === '=') break; // padding

    buffer = (buffer << 6) | val;
    bitsCollected += 6;

    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      const byte = (buffer >> bitsCollected) & 0xff;
      output.push(byte);
    }
  }

  return new Uint8Array(output);
}

export const storageService = {
  /**
   * Upload a media file to Supabase Storage
   * Returns the public URL of the uploaded file
   * 
   * @param bucket - Storage bucket name
   * @param fileData - File data with base64 content
   * @param fileName - File name
   * @param fileType - MIME type
   * @param folder - Folder path in bucket (e.g., 'relationship_123/photos')
   * @returns Public URL of the uploaded file
   */
  async uploadMediaFile(
    bucket: string,
    fileData: {
      base64: string;
      name: string;
      type: string;
    },
    folder: string
  ): Promise<string> {
    try {
      // Generate unique file name with timestamp to avoid collisions
      const timestamp = Date.now();
      const fileExtension = fileData.name.split('.').pop() || 'jpg';
      const uniqueFileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = `${folder}/${uniqueFileName}`;

      console.log('[storageService] Uploading file:', { bucket, filePath, fileType: fileData.type });

      // Convert base64 string directly using a string decoder approach
      // This creates a proper binary string that Supabase can handle
      const binaryString = atob(fileData.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('[storageService] Byte array length:', bytes.length);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, bytes, {
          contentType: fileData.type || 'application/octet-stream',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('[storageService] Upload error:', error);
        throw error;
      }

      console.log('[storageService] File uploaded successfully:', { path: data.path });

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;
      console.log('[storageService] Public URL:', publicUrl);

      // Verify the uploaded file can be fetched and is valid
      try {
        const verifyResp = await fetch(publicUrl, { method: 'GET' });
        const ok = verifyResp.ok;
        const ct = verifyResp.headers.get('content-type');
        const cl = verifyResp.headers.get('content-length');
        console.log('[storageService] Verify fetch:', { ok, contentType: ct, contentLength: cl });
      } catch (e) {
        console.warn('[storageService] Verify fetch failed:', (e as any)?.message);
      }

      return publicUrl;
    } catch (error: any) {
      console.error('[storageService] Upload failed:', error);
      throw new Error(`Failed to upload media file: ${error.message}`);
    }
  },

  /**
   * Upload media file with retry logic
   * @param bucket - Storage bucket name
   * @param fileData - File data with base64 content
   * @param folder - Folder path in bucket
   * @param retries - Number of retries
   * @returns Public URL of the uploaded file
   */
  async uploadMediaFileWithRetry(
    bucket: string,
    fileData: {
      base64: string;
      name: string;
      type: string;
    },
    folder: string,
    retries: number = MAX_RETRIES
  ): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.uploadMediaFile(bucket, fileData, folder);
      } catch (error: any) {
        console.warn(`[storageService] Upload attempt ${attempt}/${retries} failed:`, error.message);
        
        if (attempt === retries) {
          throw error; // Final attempt failed
        }

        // Wait before retrying (exponential backoff)
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`[storageService] Retrying after ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw new Error('Upload failed after all retries');
  },

  /**
   * Get the media bucket name
   */
  getMediaBucket(): string {
    return MEDIA_BUCKET;
  },

  /**
   * Delete a file from storage
   * @param bucket - Storage bucket name
   * @param filePath - Path to the file in bucket
   */
  async deleteMediaFile(bucket: string, filePath: string): Promise<void> {
    try {
      console.log('[storageService] Deleting file:', { bucket, filePath });

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      console.log('[storageService] File deleted successfully');
    } catch (error: any) {
      console.error('[storageService] Delete failed:', error);
      throw new Error(`Failed to delete media file: ${error.message}`);
    }
  },

  /**
   * Extract file path from public URL
   * @param publicUrl - Public URL of the file
   * @param bucket - Storage bucket name
   * @returns File path in the bucket
   */
  extractFilePathFromUrl(publicUrl: string, bucket: string): string {
    // Extract path from URL like: https://xxxxx.supabase.co/storage/v1/object/public/family-media/path/to/file.jpg
    try {
      const match = publicUrl.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`));
      if (match && match[1]) {
        return match[1];
      }
    } catch (error) {
      console.error('[storageService] Failed to extract path from URL:', error);
    }
    
    return '';
  },
};
