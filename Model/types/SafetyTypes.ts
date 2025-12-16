// Model/types/SafetyTypes.ts

export type ReportType = 'Positive Feedback' | 'Safety Concern';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ReportStatus = 'Pending' | 'In Review' | 'Resolved';

export interface SafetyReport {
    id: string;
    user_id: string;
    report_type: ReportType;
    subject: string;
    description: string;
    severity_level: SeverityLevel;
    status: ReportStatus;
    evidence_urls?: string[];
    created_at: string;
    updated_at: string;
}

export interface SafetyReportSubmission {
    report_type: ReportType;
    subject: string;
    description: string;
    evidence_files?: File[];
}

export interface SafetyReportFormConfig {
    report_types: ReportType[];
    max_files: number;
    max_file_size_mb: number;
    allowed_file_formats: string[];
}
