// ViewModel/SafetyViewModel/SafetyFeedbackViewModel.ts

import { makeAutoObservable } from "mobx";
import type { SafetyReportService } from "../../Model/Service/CoreService/SafetyReportService";
import type { ReportType, SafetyReport } from "../../Model/types/SafetyTypes";

export class SafetyFeedbackViewModel {
    // Observable form state
    reportType: ReportType | null = null;
    subject: string = '';
    description: string = '';
    evidenceFiles: File[] = [];

    // Validation errors
    errors: { [key: string]: string } = {};

    // UI state
    isSubmitting: boolean = false;
    submitSuccess: boolean = false;
    submitError: string | null = null;
    submittedReportId: string | null = null;
    submittedReport: SafetyReport | null = null;

    // Form configuration
    maxFiles: number = 5;
    maxFileSizeMB: number = 10;
    allowedFormats: string[] = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

    private service: SafetyReportService;
    private userId: string;

    constructor(service: SafetyReportService, userId: string) {
        makeAutoObservable(this);
        this.service = service;
        this.userId = userId;
        this.loadFormConfig();
    }

    /**
     * UC401_2: Fetch form configuration
     */
    async loadFormConfig() {
        try {
            const config = await this.service.getFormConfig();
            this.maxFiles = config.max_files;
            this.maxFileSizeMB = config.max_file_size_mb;
            this.allowedFormats = config.allowed_file_formats;
        } catch (error) {
            console.error('Error loading form config:', error);
            // Use default values if fetch fails
        }
    }

    /**
     * Set report type
     */
    setReportType(type: ReportType) {
        this.reportType = type;
        if (this.errors.reportType) {
            delete this.errors.reportType;
        }
    }

    /**
     * Set subject
     */
    setSubject(subject: string) {
        this.subject = subject;
        if (this.errors.subject) {
            delete this.errors.subject;
        }
    }

    /**
     * Set description
     */
    setDescription(description: string) {
        this.description = description;
        if (this.errors.description) {
            delete this.errors.description;
        }
    }

    /**
     * Add evidence file
     * UC401_6: User attaches evidence
     */
    addEvidenceFile(file: File): boolean {
        // Check max files
        if (this.evidenceFiles.length >= this.maxFiles) {
            this.errors.evidenceFiles = `Maximum ${this.maxFiles} files allowed`;
            return false;
        }

        // Check file size (UC401 A3a: File Upload Fails)
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > this.maxFileSizeMB) {
            this.errors.evidenceFiles = `File size must be less than ${this.maxFileSizeMB}MB`;
            return false;
        }

        // Check file format (UC401 A3b: Unsupported File Format)
        if (!this.allowedFormats.includes(file.type)) {
            this.errors.evidenceFiles = 'File upload failed. Please try uploading the supported file format (PNG,JPEG,JPG,PDF).';
            return false;
        }

        this.evidenceFiles.push(file);
        delete this.errors.evidenceFiles;
        return true;
    }

    /**
     * Remove evidence file
     */
    removeEvidenceFile(index: number) {
        this.evidenceFiles.splice(index, 1);
        delete this.errors.evidenceFiles;
    }

    /**
     * Validate form
     * UC401_8: System validates input fields
     * UC401 A2: User leaves fields blank
     */
    validateForm(): boolean {
        this.errors = {};
        let isValid = true;

        // Validate report type
        if (!this.reportType) {
            this.errors.reportType = 'Please select a report type';
            isValid = false;
        }

        // Validate subject
        if (!this.subject.trim()) {
            this.errors.subject = 'Subject is required';
            isValid = false;
        } else if (this.subject.trim().length < 3) {
            this.errors.subject = 'Subject must be at least 3 characters';
            isValid = false;
        }

        // Validate description
        if (!this.description.trim()) {
            this.errors.description = 'Description is required';
            isValid = false;
        } else if (this.description.trim().length < 10) {
            this.errors.description = 'Description must be at least 10 characters';
            isValid = false;
        }

        // UC401 M2: Display error message if validation fails
        if (!isValid) {
            this.submitError = 'Please fill in all required fields (Report Type, Subject, Description).';
        }

        return isValid;
    }

    /**
     * Submit safety report
     * UC401_7 to UC401_12: Complete submission flow
     */
    async submitReport(): Promise<void> {
        // UC401_8: Validate form
        if (!this.validateForm()) {
            return;
        }

        this.isSubmitting = true;
        this.submitError = null;
        this.submitSuccess = false;

        try {
            // UC401_7: Submit report
            const report = await this.service.submitReport(
                {
                    report_type: this.reportType!,
                    subject: this.subject,
                    description: this.description,
                    evidence_files: this.evidenceFiles.length > 0 ? this.evidenceFiles : undefined,
                },
                this.userId
            );

            // UC401_12: Display success message with report ID
            this.submittedReportId = report.id;
            this.submittedReport = report;
            this.submitSuccess = true;

            // Reset form after successful submission
            this.resetForm();

        } catch (error) {
            console.error('Error submitting report:', error);
            // UC401 M3: File upload failed message
            this.submitError = error instanceof Error
                ? error.message
                : 'An error occurred while submitting your report. Please try again.';
        } finally {
            this.isSubmitting = false;
        }
    }

    /**
     * Reset form to initial state
     */
    resetForm() {
        this.reportType = null;
        this.subject = '';
        this.description = '';
        this.evidenceFiles = [];
        this.errors = {};
    }

    /**
     * Close success modal
     * UC401_14: User closes confirmation message
     */
    closeSuccessModal() {
        this.submitSuccess = false;
        this.submittedReportId = null;
        this.submittedReport = null;
    }

    /**
     * Clear error message
     */
    clearError() {
        this.submitError = null;
    }
}
