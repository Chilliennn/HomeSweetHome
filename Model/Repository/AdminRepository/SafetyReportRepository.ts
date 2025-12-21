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
     */
    async uploadEvidence(files: File[], reportId: string): Promise<string[]> {
        const uploadedUrls: string[] = [];

        for (const file of files) {
            const fileName = `${reportId}/${Date.now()}_${file.name}`;
            const { data, error } = await this.supabase.storage
                .from('safety-evidence')
                .upload(fileName, file);

            if (error) {
                console.error('Error uploading file:', error);
                throw new Error(`Failed to upload ${file.name}. Please try again.`);
            }

            const { data: { publicUrl } } = this.supabase.storage
                .from('safety-evidence')
                .getPublicUrl(fileName);

            uploadedUrls.push(publicUrl);
        }

        return uploadedUrls;
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
}
