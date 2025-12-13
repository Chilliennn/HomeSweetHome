import { supabase } from '../../Service/APIService/supabase';

export type UserProfile = {
	id: string;
	full_name: string;
	age: number;
	avatar_url?: string | null;
	age_verified?: boolean;
	occupation?: string | null;
	education?: string | null;
	location?: string | null;
	created_at?: string | null;
};

export type ApplicationWithProfiles = {
	id: string;
	youth: UserProfile;
	elderly: UserProfile;
	motivation_letter: string;
	status: string;
	applied_at: string;
	locked_by?: string | null;
};

export type ApplicationStats = {
	pendingReview: number;
	lockedByOthers: number;
	approvedToday: number;
	avgWaitingTimeHours: number;
};

export const adminRepository = {
	async getApplications(status?: string, sortBy: 'oldest' | 'newest' = 'oldest', limit = 50, offset = 0): Promise<ApplicationWithProfiles[]> {
		// Simple Supabase join query (assuming tables: applications, users)
		let query = supabase
			.from('applications')
			.select(`*, youth:users(*), elderly:users(*)`)
			.order('applied_at', { ascending: sortBy === 'oldest' });

		if (status && status !== 'all') {
			query = query.eq('status', status);
		}

		if (limit) { query = query.range(offset, offset + limit - 1); }

		const { data, error } = await query;
		if (error) throw error;

		const results: ApplicationWithProfiles[] = (data || []).map((row: any) => ({
			id: row.id,
			youth: {
				id: row.youth?.id,
				full_name: row.youth?.full_name,
				age: row.youth?.age,
				avatar_url: row.youth?.avatar_url,
				age_verified: row.youth?.age_verified,
				occupation: row.youth?.occupation,
				education: row.youth?.education,
				location: row.youth?.location,
				created_at: row.youth?.created_at,
			},
			elderly: {
				id: row.elderly?.id,
				full_name: row.elderly?.full_name,
				age: row.elderly?.age,
				avatar_url: row.elderly?.avatar_url,
				age_verified: row.elderly?.age_verified,
				occupation: row.elderly?.occupation,
				education: row.elderly?.education,
				location: row.elderly?.location,
			},
			motivation_letter: row.motivation_letter,
			status: row.status,
			applied_at: row.applied_at,
			locked_by: row.locked_by,
		}));

		return results;
	},

	async getApplicationById(applicationId: string): Promise<ApplicationWithProfiles | null> {
		const { data, error } = await supabase
			.from('applications')
			.select(`*, youth:users(*), elderly:users(*)`)
			.eq('id', applicationId)
			.maybeSingle();

		if (error) throw error;
		if (!data) return null;

		return {
			id: data.id,
			youth: {
				id: data.youth?.id,
				full_name: data.youth?.full_name,
				age: data.youth?.age,
				avatar_url: data.youth?.avatar_url,
				age_verified: data.youth?.age_verified,
				occupation: data.youth?.occupation,
				education: data.youth?.education,
				location: data.youth?.location,
				created_at: data.youth?.created_at,
			},
			elderly: {
				id: data.elderly?.id,
				full_name: data.elderly?.full_name,
				age: data.elderly?.age,
				avatar_url: data.elderly?.avatar_url,
				age_verified: data.elderly?.age_verified,
				occupation: data.elderly?.occupation,
				education: data.elderly?.education,
				location: data.elderly?.location,
			},
			motivation_letter: data.motivation_letter,
			status: data.status,
			applied_at: data.applied_at,
			locked_by: data.locked_by,
		};
	},

	async getApplicationStats(): Promise<ApplicationStats> {
		// Implement simple aggregate queries
		const [{ data: pending }, { data: locked }, { data: approvedToday }, { data: avgWait }] = await Promise.all([
			supabase.from('applications').select('id', { count: 'exact' }).eq('status', 'pending_ngo_review'),
			supabase.from('applications').select('id', { count: 'exact' }).neq('locked_by', null),
			supabase
				.from('applications')
				.select('id', { count: 'exact' })
				.eq('status', 'ngo_approved')
				.gte('approved_at', new Date().toISOString().slice(0, 10)),
			supabase.rpc('avg_waiting_time_hours') // optional: a custom Postgres function; fallback handled below
		]).catch(() => [{ data: null }, { data: null }, { data: null }, { data: null }]);

		// Fallback values if database function not available
		const stats: ApplicationStats = {
			pendingReview: pending?.length || 0,
			lockedByOthers: locked?.length || 0,
			approvedToday: approvedToday?.length || 0,
			avgWaitingTimeHours: (avgWait && (avgWait as any).result) || 0,
		};

		return stats;
	},

	async approveApplication(applicationId: string, adminId: string, notes?: string): Promise<void> {
		const updates: any = { status: 'ngo_approved', approved_by: adminId, approved_at: new Date().toISOString() };
		if (notes) updates.approval_notes = notes;
		const { error } = await supabase.from('applications').update(updates).eq('id', applicationId);
		if (error) throw error;
	},

	async rejectApplication(applicationId: string, adminId: string, reason: string, notes: string): Promise<void> {
		const { error } = await supabase
			.from('applications')
			.update({ status: 'rejected', rejected_by: adminId, rejection_reason: reason, rejection_notes: notes, rejected_at: new Date().toISOString() })
			.eq('id', applicationId);
		if (error) throw error;
	},

	async requestMoreInfo(applicationId: string, adminId: string, infoRequested: string, notes: string): Promise<void> {
		const { error } = await supabase
			.from('applications')
			.update({ status: 'info_requested', info_requested_by: adminId, info_requested: infoRequested, info_notes: notes, info_requested_at: new Date().toISOString() })
			.eq('id', applicationId);
		if (error) throw error;
	},

	async lockApplication(applicationId: string, adminId: string): Promise<void> {
		const { error } = await supabase.from('applications').update({ locked_by: adminId }).eq('id', applicationId);
		if (error) throw error;
	},

	async releaseApplication(applicationId: string): Promise<void> {
		const { error } = await supabase.from('applications').update({ locked_by: null }).eq('id', applicationId);
		if (error) throw error;
	},

	// ============================================
	// SAFETY ALERTS (UC503)
	// ============================================

	async getSafetyAlerts(severity?: string, status?: string, sortBy: 'newest' | 'oldest' = 'newest', limit = 50, offset = 0): Promise<SafetyAlertWithProfiles[]> {
		let query = supabase
			.from('safety_incidents')
			.select(`
				*,
				reporter:users!reporter_id(*),
				reported_user:users!reported_user_id(*),
				relationship:relationships(*)
			`)
			.order('detected_at', { ascending: sortBy === 'oldest' });

		if (severity) query = query.eq('severity', severity);
		if (status) query = query.eq('status', status);
		if (limit) query = query.range(offset, offset + limit - 1);

		const { data, error } = await query;
		if (error) throw error;

		return (data || []).map((row: any) => mapRowToSafetyAlert(row));
	},

	async getSafetyAlertById(alertId: string): Promise<SafetyAlertWithProfiles | null> {
		const { data, error } = await supabase
			.from('safety_incidents')
			.select(`
				*,
				reporter:users!reporter_id(*),
				reported_user:users!reported_user_id(*),
				relationship:relationships(*)
			`)
			.eq('id', alertId)
			.maybeSingle();

		if (error) throw error;
		if (!data) return null;

		return mapRowToSafetyAlert(data);
	},

	async getSafetyAlertStats(): Promise<SafetyAlertStats> {
		const [
			{ count: critical },
			{ count: high },
			{ count: medium },
			{ count: low },
			{ count: pending }
		] = await Promise.all([
			supabase.from('safety_incidents').select('*', { count: 'exact', head: true }).eq('severity', 'critical'),
			supabase.from('safety_incidents').select('*', { count: 'exact', head: true }).eq('severity', 'high'),
			supabase.from('safety_incidents').select('*', { count: 'exact', head: true }).eq('severity', 'medium'),
			supabase.from('safety_incidents').select('*', { count: 'exact', head: true }).eq('severity', 'low'),
			supabase.from('safety_incidents').select('*', { count: 'exact', head: true }).eq('status', 'new')
		]);

		return { critical: critical || 0, high: high || 0, medium: medium || 0, low: low || 0, pending: pending || 0, avgResponseTimeMinutes: 15 };
	},

	async issueWarning(alertId: string, adminId: string, notes: string): Promise<void> {
		const { error } = await supabase
			.from('safety_incidents')
			.update({ status: 'resolved', assigned_admin_id: adminId, admin_notes: notes, admin_action_taken: 'warning_issued', resolved_at: new Date().toISOString() })
			.eq('id', alertId);
		if (error) throw error;
	},

	async suspendUser(alertId: string, userId: string, adminId: string, notes: string): Promise<void> {
		const { error: incidentError } = await supabase
			.from('safety_incidents')
			.update({ status: 'resolved', assigned_admin_id: adminId, admin_notes: notes, admin_action_taken: 'user_suspended', resolved_at: new Date().toISOString() })
			.eq('id', alertId);
		if (incidentError) throw incidentError;

		const { error: userError } = await supabase.from('users').update({ is_active: false }).eq('id', userId);
		if (userError) throw userError;
	},

	async dismissReport(alertId: string, adminId: string, reason: string): Promise<void> {
		const { error } = await supabase
			.from('safety_incidents')
			.update({ status: 'false_positive', assigned_admin_id: adminId, admin_notes: reason, admin_action_taken: 'dismissed', resolved_at: new Date().toISOString() })
			.eq('id', alertId);
		if (error) throw error;
	},

	async assignAlert(alertId: string, adminId: string): Promise<void> {
		const { error } = await supabase
			.from('safety_incidents')
			.update({ status: 'under_review', assigned_admin_id: adminId })
			.eq('id', alertId);
		if (error) throw error;
	},
};

// ============================================
// SAFETY ALERT TYPES
// ============================================

export type SafetyAlertWithProfiles = {
	id: string;
	reporter: { id: string; full_name: string; age: number; location: string | null; user_type: 'youth' | 'elderly'; account_created: string; previous_reports: number; };
	reported_user: { id: string; full_name: string; age: number; occupation: string | null; user_type: 'youth' | 'elderly'; account_status: 'active' | 'suspended' | 'banned'; previous_warnings: number; };
	relationship_id: string;
	incident_type: string;
	severity: 'critical' | 'high' | 'medium' | 'low';
	status: 'new' | 'under_review' | 'resolved' | 'false_positive';
	description: string;
	subject: string;
	evidence: { name: string; type: 'image' | 'document'; size: string; url?: string }[];
	detected_keywords: string[];
	ai_analysis: { severity_assessment: string; risk_factors: string[]; recommendation: string } | null;
	relationship_stage: string;
	relationship_duration: string;
	detected_at: string;
	waiting_time_minutes: number;
	assigned_admin_id: string | null;
	admin_notes: string | null;
	admin_action_taken: string | null;
	resolved_at: string | null;
};

export type SafetyAlertStats = {
	critical: number; high: number; medium: number; low: number; pending: number; avgResponseTimeMinutes: number;
};

// Helper function to map database row to typed alert
function mapRowToSafetyAlert(row: any): SafetyAlertWithProfiles {
	const detectedAt = new Date(row.detected_at);
	const now = new Date();
	const waitingTimeMinutes = Math.round((now.getTime() - detectedAt.getTime()) / (1000 * 60));

	let relationshipDuration = 'Unknown';
	if (row.relationship?.created_at) {
		const days = Math.floor((now.getTime() - new Date(row.relationship.created_at).getTime()) / (1000 * 60 * 60 * 24));
		relationshipDuration = `${days} days`;
	}

	const calculateAge = (dob: string | null): number => {
		if (!dob) return 0;
		const dobDate = new Date(dob);
		let age = now.getFullYear() - dobDate.getFullYear();
		if (now.getMonth() < dobDate.getMonth() || (now.getMonth() === dobDate.getMonth() && now.getDate() < dobDate.getDate())) age--;
		return age;
	};

	const incidentTypeSubjects: Record<string, string> = {
		financial_request: 'Financial Exploitation Request Detected',
		negative_sentiment: 'Negative Sentiment Pattern Detected',
		harassment: 'Harassment Behavior Reported',
		abuse: 'Abuse Concern Reported',
		inappropriate_content: 'Inappropriate Content Detected',
		other: 'Safety Concern Reported'
	};

	return {
		id: row.id,
		reporter: {
			id: row.reporter?.id || '',
			full_name: row.reporter?.full_name || 'Unknown',
			age: calculateAge(row.reporter?.date_of_birth),
			location: row.reporter?.location,
			user_type: row.reporter?.user_type || 'elderly',
			account_created: row.reporter?.created_at || '',
			previous_reports: 0
		},
		reported_user: {
			id: row.reported_user?.id || '',
			full_name: row.reported_user?.full_name || 'Unknown',
			age: calculateAge(row.reported_user?.date_of_birth),
			occupation: row.reported_user?.profile_data?.occupation || null,
			user_type: row.reported_user?.user_type || 'youth',
			account_status: row.reported_user?.is_active ? 'active' : 'suspended',
			previous_warnings: 0
		},
		relationship_id: row.relationship_id,
		incident_type: row.incident_type,
		severity: row.severity,
		status: row.status,
		description: row.description || '',
		subject: incidentTypeSubjects[row.incident_type] || 'Safety Alert',
		evidence: row.evidence?.files || [],
		detected_keywords: row.evidence?.keywords || [],
		ai_analysis: row.evidence?.ai_analysis || null,
		relationship_stage: row.relationship?.current_stage || 'Unknown',
		relationship_duration: relationshipDuration,
		detected_at: row.detected_at,
		waiting_time_minutes: waitingTimeMinutes,
		assigned_admin_id: row.assigned_admin_id,
		admin_notes: row.admin_notes,
		admin_action_taken: row.admin_action_taken,
		resolved_at: row.resolved_at
	};
}

// ============================================
// CONSULTATION TYPES
// ============================================

export type ConsultationRequest = {
	id: string;
	requesterId: string;
	requesterName: string;
	requesterType: 'youth' | 'elderly';
	requesterAge: number;
	partnerName: string;
	partnerAge: number;
	consultationType: string;
	preferredMethod: string;
	preferredDateTime: string;
	concernDescription: string;
	status: 'pending_assignment' | 'assigned' | 'in_progress' | 'completed' | 'dismissed';
	submittedAt: string;
	urgency: 'low' | 'normal' | 'high';
	relationshipStage: string;
	relationshipDuration: string;
	assignedAdvisorId: string | null;
	assignedAdvisorName: string | null;
};

export type Advisor = {
	id: string;
	name: string;
	specialization: string;
	status: 'available' | 'busy' | 'offline';
	currentWorkload: number;
	languages: string[];
};

export type ConsultationStats = {
	pendingAssignment: number;
	assigned: number;
	inProgress: number;
	completedToday: number;
	availableAdvisors: number;
};

// ============================================
// CONSULTATION REPOSITORY METHODS
// ============================================

export const consultationRepository = {
	async getConsultations(status?: string, urgency?: string, sortBy: 'newest' | 'oldest' = 'newest', limit = 50, offset = 0): Promise<ConsultationRequest[]> {
		let query = supabase
			.from('consultation_requests')
			.select(`
				*,
				requester:users!requester_id(*),
				partner:users!partner_id(*),
				relationship:relationships(*),
				advisor:advisors(*)
			`)
			.order('submitted_at', { ascending: sortBy === 'oldest' });

		if (status && status !== 'all') query = query.eq('status', status);
		if (urgency) query = query.eq('urgency', urgency);
		if (limit) query = query.range(offset, offset + limit - 1);

		const { data, error } = await query;
		if (error) throw error;

		return (data || []).map((row: any) => mapRowToConsultation(row));
	},

	async getConsultationById(id: string): Promise<ConsultationRequest | null> {
		const { data, error } = await supabase
			.from('consultation_requests')
			.select(`
				*,
				requester:users!requester_id(*),
				partner:users!partner_id(*),
				relationship:relationships(*),
				advisor:advisors(*)
			`)
			.eq('id', id)
			.maybeSingle();

		if (error) throw error;
		if (!data) return null;
		return mapRowToConsultation(data);
	},

	async getConsultationStats(): Promise<ConsultationStats> {
		const today = new Date().toISOString().slice(0, 10);
		const [pending, assigned, inProgress, completedToday, advisors] = await Promise.all([
			supabase.from('consultation_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_assignment'),
			supabase.from('consultation_requests').select('*', { count: 'exact', head: true }).eq('status', 'assigned'),
			supabase.from('consultation_requests').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
			supabase.from('consultation_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('completed_at', today),
			supabase.from('advisors').select('*', { count: 'exact', head: true }).eq('status', 'available')
		]);

		return {
			pendingAssignment: pending.count || 0,
			assigned: assigned.count || 0,
			inProgress: inProgress.count || 0,
			completedToday: completedToday.count || 0,
			availableAdvisors: advisors.count || 0
		};
	},

	async getAdvisors(status?: string): Promise<Advisor[]> {
		let query = supabase.from('advisors').select('*').order('name');
		if (status) query = query.eq('status', status);

		const { data, error } = await query;
		if (error) throw error;

		return (data || []).map((row: any) => ({
			id: row.id,
			name: row.name,
			specialization: row.specialization || '',
			status: row.status,
			currentWorkload: row.current_workload || 0,
			languages: row.languages || ['English']
		}));
	},

	async assignAdvisor(consultationId: string, advisorId: string, adminId: string): Promise<void> {
		const { error } = await supabase
			.from('consultation_requests')
			.update({ status: 'assigned', assigned_advisor_id: advisorId, assigned_at: new Date().toISOString(), assigned_by: adminId })
			.eq('id', consultationId);
		if (error) throw error;

		// Update advisor workload (optional RPC, ignore errors if not available)
		try {
			await supabase.rpc('increment_advisor_workload', { advisor_id: advisorId });
		} catch {
			// RPC may not exist in database
		}
	},

	async dismissRequest(consultationId: string, _adminId: string, reason: string): Promise<void> {
		const { error } = await supabase
			.from('consultation_requests')
			.update({ status: 'dismissed', dismissed_reason: reason, updated_at: new Date().toISOString() })
			.eq('id', consultationId);
		if (error) throw error;
	},

	async completeRequest(consultationId: string, notes: string): Promise<void> {
		const { error } = await supabase
			.from('consultation_requests')
			.update({ status: 'completed', resolution_notes: notes, completed_at: new Date().toISOString() })
			.eq('id', consultationId);
		if (error) throw error;
	}
};

// Helper function to map database row to ConsultationRequest
function mapRowToConsultation(row: any): ConsultationRequest {
	const now = new Date();
	const calculateAge = (dob: string | null): number => {
		if (!dob) return 0;
		const dobDate = new Date(dob);
		let age = now.getFullYear() - dobDate.getFullYear();
		if (now.getMonth() < dobDate.getMonth() || (now.getMonth() === dobDate.getMonth() && now.getDate() < dobDate.getDate())) age--;
		return age;
	};

	let relationshipDuration = 'Unknown';
	if (row.relationship?.created_at) {
		const days = Math.floor((now.getTime() - new Date(row.relationship.created_at).getTime()) / (1000 * 60 * 60 * 24));
		relationshipDuration = `${days} days`;
	}

	return {
		id: row.id,
		requesterId: row.requester_id,
		requesterName: row.requester?.full_name || 'Unknown',
		requesterType: row.requester?.user_type || 'elderly',
		requesterAge: calculateAge(row.requester?.date_of_birth),
		partnerName: row.partner?.full_name || 'Unknown',
		partnerAge: calculateAge(row.partner?.date_of_birth),
		consultationType: row.consultation_type,
		preferredMethod: row.preferred_method || 'video_call',
		preferredDateTime: row.preferred_datetime || '',
		concernDescription: row.concern_description,
		status: row.status,
		submittedAt: row.submitted_at,
		urgency: row.urgency || 'normal',
		relationshipStage: row.relationship?.current_stage || 'Unknown',
		relationshipDuration: relationshipDuration,
		assignedAdvisorId: row.assigned_advisor_id,
		assignedAdvisorName: row.advisor?.name || null
	};
}

export default adminRepository;