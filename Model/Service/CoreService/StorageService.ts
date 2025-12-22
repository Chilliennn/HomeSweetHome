import { SupabaseClient } from "@supabase/supabase-js";

export class StorageService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Get public URL from storage path
     * Input: "reportId/timestamp_filename.pdf"
     * Output: "https://...supabase.co/storage/v1/object/public/safety-evidence/reportId/timestamp_filename.pdf"
     */
    getPublicUrl(bucketName: string, filePath: string): string {
        const { data } = this.supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return data.publicUrl;
    }

    /**
     * Extract storage path from full URL or return path as-is
     */
    extractStoragePath(urlOrPath: string, bucketName: string): string {
        if (!urlOrPath) return '';

        // If it's already just a path (no http), return as-is
        if (!urlOrPath.startsWith('http')) {
            return urlOrPath;
        }

        // Extract path from full URL
        try {
            const url = new URL(urlOrPath);
            const pathParts = url.pathname.split(`/${bucketName}/`);
            return pathParts[1] || urlOrPath;
        } catch {
            return urlOrPath;
        }
    }

    /**
     * Convert array of URLs/paths to clean storage paths
     */
    normalizeStoragePaths(urlsOrPaths: string[], bucketName: string): string[] {
        return urlsOrPaths.map(item => this.extractStoragePath(item, bucketName));
    }

    /**
     * Convert array of storage paths to public URLs
     */
    generatePublicUrls(paths: string[], bucketName: string): string[] {
        return paths.map(path => this.getPublicUrl(bucketName, path));
    }
}
