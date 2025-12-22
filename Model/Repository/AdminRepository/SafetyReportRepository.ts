// Model/Repository/AdminRepository/SafetyReportRepository.ts

import { SupabaseClient } from "@supabase/supabase-js";
import type { SafetyReport, SafetyReportSubmission, SeverityLevel } from "../../types/SafetyTypes";

export class SafetyReportRepository {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async submitReport(
        submission: SafetyReportSubmission,
        userId: string,
        severityLevel: SeverityLevel
    ): Promise<SafetyReport> {
        const { data, error } = await this.supabase
            .from('safety_reports')
            .insert({
                user_id: userId,
                report_type: submission.report_type,
                subject: submission.subject,
                description: submission.description,
                severity_level: severityLevel,
                status: 'Pending',
            })
            .select()
            .single();

        if (error) {
            console.error('Error submitting safety report:', error);
            throw new Error('Failed to submit report. Please try again.');
        }

        return data as SafetyReport;
    }

    /**
     * Fetch all reports for a specific user
     * UC401_13: User can view their submitted reports
     */
    async getUserReports(userId: string): Promise<SafetyReport[]> {
        const { data, error } = await this.supabase
            .from('safety_reports')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user reports:', error);
            throw new Error('Failed to fetch reports. Please try again.');
        }

        return data || [];
    }

    /**
     * Upload evidence files to Supabase Storage
     * UC401_6: User attaches evidence files
     * Handles both web File objects and React Native file objects with uri
     */
    async uploadEvidence(files: any[], reportId: string): Promise<string[]> {
        const uploadedPaths: string[] = []; // Change from uploadedUrls to uploadedPaths
        console.log('[SafetyReportRepository] uploadEvidence called with', files.length, 'files');

        for (const file of files) {
            try {
                const fileName = `${reportId}/${Date.now()}_${file.name || 'evidence'}`;
                console.log('[SafetyReportRepository] Uploading file:', fileName);

                let fileData: ArrayBuffer | Blob | File;

                // Check if this is a React Native file object with uri
                if (file.uri) {
                    console.log('[SafetyReportRepository] React Native file detected, fetching from URI:', file.uri);
                    const response = await fetch(file.uri);
                    fileData = await response.arrayBuffer();
                    console.log('[SafetyReportRepository] ArrayBuffer created, byteLength:', fileData.byteLength);
                } else if (file instanceof Blob || file instanceof File) {
                    // Web File object
                    fileData = file;
                } else {
                    console.error('[SafetyReportRepository] Unknown file format:', file);
                    continue;
                }

                const { data, error } = await this.supabase.storage
                    .from('safety-evidence')
                    .upload(fileName, fileData, {
                        contentType: file.type || 'image/jpeg',
                        upsert: false
                    });

                if (error) {
                    console.error('[SafetyReportRepository] Error uploading file:', error);
                    throw new Error(`Failed to upload ${file.name}. Please try again.`);
                }

                console.log('[SafetyReportRepository] Upload successful:', data);

                // IMPORTANT: Store only the path, not the full URL
                uploadedPaths.push(fileName); // Store: "reportId/timestamp_filename.pdf"
                console.log('[SafetyReportRepository] Stored path:', fileName);
            } catch (fileError) {
                console.error('[SafetyReportRepository] Error processing file:', file.name, fileError);
                // Continue with other files
            }
        }

        console.log('[SafetyReportRepository] All uploads complete, paths:', uploadedPaths);
        return uploadedPaths; // Return paths, not URLs
    }

    /**
     * Update report status (for admin use)
     */
    async updateReportStatus(reportId: string, status: 'Pending' | 'In Review' | 'Resolved'): Promise<void> {
        const { error } = await this.supabase
            .from('safety_reports')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', reportId);

        if (error) {
            console.error('Error updating report status:', error);
            throw new Error('Failed to update report status. Please try again.');
        }
    }

    /**
     * Update evidence URLs for a report
     */
    async updateEvidenceUrls(reportId: string, evidencePaths: string[]): Promise<void> {
        const { error } = await this.supabase
            .from('safety_reports')
            .update({
                evidence_urls: evidencePaths, // Store paths in database
                updated_at: new Date().toISOString()
            })
            .eq('id', reportId);

        if (error) {
            console.error('Error updating evidence URLs:', error);
            throw new Error('Failed to update evidence URLs. Please try again.');
        }
        console.log('[SafetyReportRepository] Evidence paths saved to database:', evidencePaths);
    }
}
