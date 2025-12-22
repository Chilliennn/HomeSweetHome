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
	warning_count?: number;
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

export type AdminNotification = {
	id: string;
	type: 'application' | 'safety_alert' | 'consultation' | 'relationship' | 'system';
	title: string;
	message: string;
	reference_id: string | null;
	is_read: boolean;
	created_at: string;
};

// Fetch admin notifications (aggregated from various sources)
export async function getAdminNotifications(limit = 10): Promise<AdminNotification[]> {
	const notifications: AdminNotification[] = [];

	try {
		// Get recent pending applications
		const { data: pendingApps } = await supabase
			.from('applications')
			.select('id, youth:users!youth_id(full_name), applied_at')
			.eq('status', 'pending_review')
			.order('applied_at', { ascending: false })
			.limit(3);

		pendingApps?.forEach((app: any) => {
			notifications.push({
				id: `app-${app.id}`,
				type: 'application',
				title: 'New Application',
				message: `New application from ${app.youth?.full_name || 'Unknown'}`,
				reference_id: app.id,
				is_read: false,
				created_at: app.applied_at
			});
		});

		// Get recent safety incidents
		const { data: safetyAlerts } = await supabase
			.from('safety_incidents')
			.select('id, incident_type, severity, detected_at')
			.eq('status', 'new')
			.order('detected_at', { ascending: false })
			.limit(3);

		safetyAlerts?.forEach((alert: any) => {
			notifications.push({
				id: `safety-${alert.id}`,
				type: 'safety_alert',
				title: `${alert.severity?.toUpperCase()} Safety Alert`,
				message: `${alert.incident_type?.replace(/_/g, ' ')} detected`,
				reference_id: alert.id,
				is_read: false,
				created_at: alert.detected_at
			});
		});

		// Get recent safety reports (manual)
		const { data: safetyReports } = await supabase
			.from('safety_reports')
			.select('id, report_type, severity_level, created_at')
			.eq('status', 'Pending')
			.order('created_at', { ascending: false })
			.limit(3);

		safetyReports?.forEach((report: any) => {
			notifications.push({
				id: `report-${report.id}`,
				type: 'safety_alert',
				title: `${report.severity_level?.toUpperCase()} Safety Report`,
				message: `${report.report_type?.replace(/_/g, ' ')} submitted`,
				reference_id: report.id,
				is_read: false,
				created_at: report.created_at
			});
		});

		// Get recent consultation requests
		const { data: consultations } = await supabase
			.from('consultation_requests')
			.select('id, consultation_type, submitted_at')
			.eq('status', 'pending_assignment')
			.order('submitted_at', { ascending: false })
			.limit(3);

		consultations?.forEach((req: any) => {
			notifications.push({
				id: `consult-${req.id}`,
				type: 'consultation',
				title: 'Consultation Request',
				message: `New ${req.consultation_type?.replace(/_/g, ' ')} request`,
				reference_id: req.id,
				is_read: false,
				created_at: req.submitted_at
			});
		});

		// Sort by date and limit
		notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
		return notifications.slice(0, limit);
	} catch (error) {
		console.error('Error fetching admin notifications:', error);
		return [];
	}
}

export const adminRepository = {
	async getApplications(status?: string, sortBy: 'oldest' | 'newest' = 'oldest', limit = 50, offset = 0): Promise<ApplicationWithProfiles[]> {
		// Valid statuses for Application Review Queue
		const QUEUE_STATUSES = ['pending_review', 'info_requested'];
		// Supabase join query with explicit FK references
		let query = supabase
			.from('applications')
			.select(`*, youth:users!youth_id(*), elderly:users!elderly_id(*)`)
			.order('applied_at', { ascending: sortBy === 'oldest' });

		// Handle special 'locked' filter - filter by locked_by not null (among queue statuses)
		if (status === 'locked') {
			query = query.in('status', QUEUE_STATUSES).not('locked_by', 'is', null);
		} else if (status && status !== 'all') {
			// Specific status filter
			query = query.eq('status', status);
		} else {
			// 'all' or no status - return only queue-relevant statuses
			query = query.in('status', QUEUE_STATUSES);
		}

		if (limit) { query = query.range(offset, offset + limit - 1); }

		const { data, error } = await query;
		if (error) throw error;

		// Helper to calculate age from date_of_birth
		const calculateAge = (dob: string | null): number => {
			if (!dob) return 0;
			const dobDate = new Date(dob);
			const now = new Date();
			let age = now.getFullYear() - dobDate.getFullYear();
			if (now.getMonth() < dobDate.getMonth() || (now.getMonth() === dobDate.getMonth() && now.getDate() < dobDate.getDate())) age--;
			return age;
		};

		const results: ApplicationWithProfiles[] = (data || []).map((row: any) => ({
			id: row.id,
			youth: {
				id: row.youth?.id,
				full_name: row.youth?.full_name,
				age: row.youth?.age || calculateAge(row.youth?.date_of_birth),
				// FIXED: Get avatar_url from profile_data.avatar_url (custom avatar storage location)
				avatar_url: row.youth?.profile_data?.avatar_url || row.youth?.profile_photo_url || null,
				age_verified: row.youth?.profile_data?.age_verified ?? row.youth?.age_verified ?? false,
				occupation: row.youth?.profile_data?.occupation || row.youth?.occupation || null,
				education: row.youth?.profile_data?.education || row.youth?.education || null,
				location: row.youth?.location,
				created_at: row.youth?.created_at,
			},
			elderly: {
				id: row.elderly?.id,
				full_name: row.elderly?.full_name,
				age: row.elderly?.age || calculateAge(row.elderly?.date_of_birth),
				// FIXED: Get avatar_url from profile_data.avatar_url (custom avatar storage location)
				avatar_url: row.elderly?.profile_data?.avatar_url || row.elderly?.profile_photo_url || null,
				age_verified: row.elderly?.profile_data?.age_verified ?? row.elderly?.age_verified ?? false,
				occupation: row.elderly?.profile_data?.occupation || row.elderly?.occupation || null,
				education: row.elderly?.profile_data?.education || row.elderly?.education || null,
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
			.select(`*, youth:users!youth_id(*), elderly:users!elderly_id(*)`)
			.eq('id', applicationId)
			.maybeSingle();

		if (error) throw error;
		if (!data) return null;

		// Helper to calculate age from date_of_birth
		const calculateAge = (dob: string | null): number => {
			if (!dob) return 0;
			const dobDate = new Date(dob);
			const now = new Date();
			let age = now.getFullYear() - dobDate.getFullYear();
			if (now.getMonth() < dobDate.getMonth() || (now.getMonth() === dobDate.getMonth() && now.getDate() < dobDate.getDate())) age--;
			return age;
		};

		return {
			id: data.id,
			youth: {
				id: data.youth?.id,
				full_name: data.youth?.full_name,
				age: data.youth?.age || calculateAge(data.youth?.date_of_birth),
				// FIXED: Get avatar_url from profile_data.avatar_url (custom avatar storage location)
				avatar_url: data.youth?.profile_data?.avatar_url || data.youth?.profile_photo_url || null,
				age_verified: data.youth?.profile_data?.age_verified ?? data.youth?.age_verified ?? false,
				occupation: data.youth?.profile_data?.occupation || data.youth?.occupation || null,
				education: data.youth?.profile_data?.education || data.youth?.education || null,
				location: data.youth?.location,
				created_at: data.youth?.created_at,
			},
			elderly: {
				id: data.elderly?.id,
				full_name: data.elderly?.full_name,
				age: data.elderly?.age || calculateAge(data.elderly?.date_of_birth),
				// FIXED: Get avatar_url from profile_data.avatar_url (custom avatar storage location)
				avatar_url: data.elderly?.profile_data?.avatar_url || data.elderly?.profile_photo_url || null,
				age_verified: data.elderly?.profile_data?.age_verified ?? data.elderly?.age_verified ?? false,
				occupation: data.elderly?.profile_data?.occupation || data.elderly?.occupation || null,
				education: data.elderly?.profile_data?.education || data.elderly?.education || null,
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
			supabase.from('applications').select('id', { count: 'exact' }).eq('status', 'pending_review'),
			supabase.from('applications').select('id', { count: 'exact' }).neq('locked_by', null),
			supabase
				.from('applications')
				.select('id', { count: 'exact' })
				.eq('status', 'approved')
				.gte('approved_at', new Date().toISOString().slice(0, 10)),
			supabase.rpc('avg_waiting_time_hours') // optional: a custom Postgres function; fallback handled below
		]).catch(() => [{ data: null }, { data: null }, { data: null }, { data: null }]);

		// Initialize variables
		let pendingCount = 0;
		let lockedCount = 0;
		let approvedTodayCount = 0;
		let avgWaitingHours = 0;

		try {
			const [pendingResult, lockedResult, approvedResult, applicationsResult] = await Promise.all([
				supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
				supabase.from('applications').select('*', { count: 'exact', head: true }).not('locked_by', 'is', null),
				supabase
					.from('applications')
					.select('*', { count: 'exact', head: true })
					.eq('status', 'approved'),
				// Fetch all applications to calculate average waiting time
				supabase.from('applications').select('applied_at').in('status', ['pending_review', 'info_requested']),
			]);

			pendingCount = pendingResult.count || 0;
			lockedCount = lockedResult.count || 0;
			approvedTodayCount = approvedResult.count || 0;

			// Calculate average waiting time from applications data
			const applications = applicationsResult.data || [];
			if (applications.length > 0) {
				const now = new Date();
				let totalWaitingHours = 0;

				for (const app of applications) {
					const appliedAt = new Date(app.applied_at);
					const hoursWaiting = Math.floor((now.getTime() - appliedAt.getTime()) / (1000 * 60 * 60));
					totalWaitingHours += hoursWaiting;
				}

				avgWaitingHours = Math.round(totalWaitingHours / applications.length);
			}
		} catch (error) {
			console.error('Error fetching application stats:', error);
		}

		return {
			pendingReview: pendingCount,
			lockedByOthers: lockedCount,
			approvedToday: approvedTodayCount,
			avgWaitingTimeHours: avgWaitingHours,
		};
	},

	async approveApplication(applicationId: string, adminId: string, notes?: string): Promise<void> {
		// Use correct field names matching the database schema:
		// status options: 'pending_interest', 'pre_chat_active', 'pending_review', 'info_requested', 'approved', 'both_accepted', 'rejected', 'withdrawn'

		// UUID validation regex
		const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(adminId);

		const updates: any = {
			status: 'approved',
			reviewed_at: new Date().toISOString()
		};

		// Only set ngo_reviewer_id if adminId is a valid UUID
		if (isValidUUID) {
			updates.ngo_reviewer_id = adminId;
		} else {
			console.warn('[adminRepository] adminId is not a valid UUID, skipping ngo_reviewer_id:', adminId);
		}

		if (notes) updates.ngo_notes = notes;
		const { error } = await supabase.from('applications').update(updates).eq('id', applicationId);
		if (error) throw error;
	},

	async rejectApplication(applicationId: string, _adminId: string, reason: string, notes: string, youthId?: string): Promise<void> {
		// Only update status - store reason in ngo_notes
		const combinedNotes = `Rejection Reason: ${reason}${notes ? '\nNotes: ' + notes : ''}`;
		const { error } = await supabase
			.from('applications')
			.update({ status: 'rejected', ngo_notes: combinedNotes })
			.eq('id', applicationId);
		if (error) throw error;

		// Send notification to youth applicant if youthId provided
		if (youthId) {
			try {
				await supabase.from('notifications').insert({
					user_id: youthId,
					type: 'application_update',
					title: 'Application Rejected',
					message: `Your adoption application has been rejected. Reason: ${reason}`,
					is_read: false,
				});
			} catch (notifError) {
				console.error('Failed to send notification:', notifError);
			}
		}
	},

	async requestMoreInfo(applicationId: string, _adminId: string, infoRequested: string, notes: string, youthId?: string): Promise<void> {
		// Only update status - store request in ngo_notes
		const combinedNotes = `Info Requested: ${infoRequested}${notes ? '\nNotes: ' + notes : ''}`;
		const { error } = await supabase
			.from('applications')
			.update({ status: 'info_requested', ngo_notes: combinedNotes })
			.eq('id', applicationId);
		if (error) throw error;

		// Send notification to youth applicant if youthId provided
		if (youthId) {
			try {
				await supabase.from('notifications').insert({
					user_id: youthId,
					type: 'application_update',
					title: 'Additional Information Required',
					message: `More information is needed for your application: ${infoRequested}`,
					is_read: false,
				});
			} catch (notifError) {
				console.error('Failed to send notification:', notifError);
			}
		}
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
		// Only query safety_reports table (safety_incidents table was removed)
		let reportsQuery = supabase
			.from('safety_reports')
			.select(`*`)
			.order('created_at', { ascending: sortBy === 'oldest' });

		if (severity) {
			const severityRepMap: Record<string, string> = {
				'critical': 'Critical',
				'high': 'High',
				'medium': 'Medium',
				'low': 'Low'
			};
			reportsQuery = reportsQuery.eq('severity_level', severityRepMap[severity.toLowerCase()] || severity);
		}

		if (status) {
			const statusRepMap: Record<string, string> = {
				'new': 'Pending',
				'Pending Review': 'Pending',
				'under_review': 'In Review',
				'Under Review': 'In Review',
				'resolved': 'Resolved',
				'Resolved': 'Resolved'
			};
			const reportStatus = statusRepMap[status] || statusRepMap[status.toLowerCase()] || status;
			reportsQuery = reportsQuery.eq('status', reportStatus);
		}
		if (limit) reportsQuery = reportsQuery.range(offset, offset + limit - 1);

		const { data: reportsData, error } = await reportsQuery;
		if (error) throw error;

		// Manually fetch reporters and partners for reports
		const manualReports = reportsData || [];
		if (manualReports.length > 0) {
			const reporterIds = [...new Set(manualReports.map((r: any) => r.user_id))];

			// Fetch reporters, relationships, and partners in parallel
			const [reportersRes, relationshipsRes] = await Promise.all([
				supabase.from('users').select('*').in('id', reporterIds),
				supabase.from('relationships').select('*, youth:youth_id(*), elderly:elderly_id(*)').or(`youth_id.in.(${reporterIds.join(',')}),elderly_id.in.(${reporterIds.join(',')})`).eq('status', 'active')
			]);

			const reporterMap = (reportersRes.data || []).reduce((acc: any, u: any) => { acc[u.id] = u; return acc; }, {});
			const relMap = (relationshipsRes.data || []).reduce((acc: any, r: any) => {
				acc[r.youth_id] = r;
				acc[r.elderly_id] = r;
				return acc;
			}, {});

			manualReports.forEach((r: any) => {
				r.reporter = reporterMap[r.user_id];
				const rel = relMap[r.user_id];
				if (rel) {
					r.relationship = rel;
					r.reported_user = rel.youth_id === r.user_id ? rel.elderly : rel.youth;
				}
			});
		}

		return manualReports.map((row: any) => {
			const alert = mapRowToSafetyAlert(row, 'manual_report');
			if (row.reported_user) alert.reported_user = row.reported_user;
			if (row.relationship) {
				alert.relationship_id = row.relationship.id;
				alert.relationship_stage = row.relationship.current_stage;
				const now = new Date();
				const days = Math.floor((now.getTime() - new Date(row.relationship.created_at).getTime()) / (1000 * 60 * 60 * 24));
				alert.relationship_duration = `${days} days`;
			}
			return alert;
		});
	},

	async getSafetyAlertById(alertId: string): Promise<SafetyAlertWithProfiles | null> {
		// Only query safety_reports table
		const { data: report, error: reportError } = await supabase
			.from('safety_reports')
			.select(`*`)
			.eq('id', alertId)
			.maybeSingle();

		if (reportError) throw reportError;
		if (!report) return null;

		const [reporterRes, relationshipRes] = await Promise.all([
			supabase.from('users').select('*').eq('id', report.user_id).maybeSingle(),
			supabase.from('relationships').select('*, youth:youth_id(*), elderly:elderly_id(*)').or(`youth_id.eq.${report.user_id},elderly_id.eq.${report.user_id}`).eq('status', 'active').maybeSingle()
		]);

		report.reporter = reporterRes.data;
		const alert = mapRowToSafetyAlert(report, 'manual_report');

		if (relationshipRes.data) {
			const rel = relationshipRes.data;
			alert.reported_user = rel.youth_id === report.user_id ? rel.elderly : rel.youth;
			alert.relationship_id = rel.id;
			alert.relationship_stage = rel.current_stage;
			const now = new Date();
			const days = Math.floor((now.getTime() - new Date(rel.created_at).getTime()) / (1000 * 60 * 60 * 24));
			alert.relationship_duration = `${days} days`;
		}

		return alert;
	},

	async getSafetyAlertStats(): Promise<SafetyAlertStats> {
		// Query safety_reports table
		const [
			{ count: critRep }, { count: highRep }, { count: medRep }, { count: lowRep }, { count: pendingRep },
			{ data: pendingReports }
		] = await Promise.all([
			supabase.from('safety_reports').select('*', { count: 'exact', head: true }).eq('severity_level', 'Critical').eq('status', 'Pending'),
			supabase.from('safety_reports').select('*', { count: 'exact', head: true }).eq('severity_level', 'High').eq('status', 'Pending'),
			supabase.from('safety_reports').select('*', { count: 'exact', head: true }).eq('severity_level', 'Medium').eq('status', 'Pending'),
			supabase.from('safety_reports').select('*', { count: 'exact', head: true }).eq('severity_level', 'Low').eq('status', 'Pending'),
			supabase.from('safety_reports').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
			// Get pending reports to calculate average waiting time
			supabase.from('safety_reports').select('created_at').eq('status', 'Pending').limit(100)
		]);

		// Calculate average waiting time for pending reports
		let avgWaitingTime = 0;
		if (pendingReports && pendingReports.length > 0) {
			const now = new Date().getTime();
			const totalMinutes = pendingReports.reduce((acc: number, report: any) => {
				const created = new Date(report.created_at).getTime();
				return acc + Math.round((now - created) / 1000 / 60);
			}, 0);
			avgWaitingTime = Math.round(totalMinutes / pendingReports.length);
		}

		return {
			critical: critRep || 0,
			high: highRep || 0,
			medium: medRep || 0,
			low: lowRep || 0,
			pending: pendingRep || 0,
			avgResponseTimeMinutes: avgWaitingTime
		};
	},

	async issueWarning(alertId: string, adminId: string, notes: string): Promise<void> {
		console.log('[adminRepository] issueWarning called:', { alertId, adminId, notes: notes?.substring(0, 50) });
		let userId: string | null = null;

		// Query safety_reports only
		const { data: report, error: repFetchErr } = await supabase.from('safety_reports').select('id, user_id').eq('id', alertId).maybeSingle();
		console.log('[adminRepository] issueWarning report fetch:', { report, error: repFetchErr });
		if (repFetchErr) throw repFetchErr;

		if (!report) {
			throw new Error(`Could not find alert with ID: ${alertId}`);
		}

		// Find partner (reported user)
		const { data: rel } = await supabase
			.from('relationships')
			.select('youth_id, elderly_id')
			.or(`youth_id.eq.${report.user_id},elderly_id.eq.${report.user_id}`)
			.eq('status', 'active')
			.maybeSingle();

		if (rel) {
			userId = rel.youth_id === report.user_id ? rel.elderly_id : rel.youth_id;
		}

		// Update report status
		const { error, count } = await supabase
			.from('safety_reports')
			.update({ status: 'Resolved', updated_at: new Date().toISOString() }, { count: 'exact' })
			.eq('id', alertId);

		console.log('[adminRepository] issueWarning report update:', { error, count });
		if (error) throw error;
		if (!count || count === 0) {
			throw new Error(`Could not update alert with ID: ${alertId}`);
		}

		// Perform user updates if we found the user
		if (userId) {
			const { data: userData } = await supabase.from('users').select('warning_count').eq('id', userId).maybeSingle();
			const currentCount = userData?.warning_count || 0;
			const { error: userUpdateErr } = await supabase.from('users').update({ warning_count: currentCount + 1 }).eq('id', userId);
			if (userUpdateErr) console.error('[adminRepository] User warning update failed:', userUpdateErr);

			const { error: notifErr } = await supabase.from('notifications').insert({
				user_id: userId,
				type: 'safety_alert',
				title: 'Safety Warning Issued',
				message: 'An administrator has issued a warning regarding your recent activity. Please review our safety guidelines.',
				is_read: false
			});
			if (notifErr) console.error('[adminRepository] Warning notification failed:', notifErr);
		}
	},

	async suspendUser(alertId: string, userId: string, adminId: string, notes: string): Promise<void> {
		console.log('[adminRepository] suspendUser called:', { alertId, userId, adminId });

		// Query safety_reports only
		const { data: report, error: repFetchErr } = await supabase.from('safety_reports').select('id').eq('id', alertId).maybeSingle();
		console.log('[adminRepository] suspendUser report fetch:', { report, error: repFetchErr });
		if (repFetchErr) throw repFetchErr;

		if (!report) {
			throw new Error(`Could not find alert with ID: ${alertId}`);
		}

		// Update report status
		const { error, count } = await supabase.from('safety_reports').update({ status: 'Resolved', updated_at: new Date().toISOString() }, { count: 'exact' }).eq('id', alertId);
		console.log('[adminRepository] suspendUser report update:', { error, count });
		if (error) throw error;
		if (!count || count === 0) {
			throw new Error(`Could not update alert with ID: ${alertId}`);
		}

		// Actually suspend the user
		const { error: userError } = await supabase.from('users').update({ is_active: false }).eq('id', userId);
		if (userError) throw userError;

		// Send notification
		const { error: notifError } = await supabase.from('notifications').insert({
			user_id: userId,
			type: 'safety_alert',
			title: 'Account Suspended',
			message: 'Your account has been suspended due to a violation of safety policies. Please contact support for more information.',
			is_read: false
		});
		if (notifError) console.error('[adminRepository] Suspension notification failed:', notifError);
	},

	async dismissReport(alertId: string, adminId: string, reason: string): Promise<void> {
		// Consolidate with deleteAlert as requested: dismiss is same as delete
		return this.deleteAlert(alertId);
	},

	async deleteAlert(alertId: string): Promise<void> {
		console.log('[adminRepository] deleteAlert called:', { alertId });

		// Query safety_reports only
		const { data: report, error: repFetchErr } = await supabase.from('safety_reports').select('id').eq('id', alertId).maybeSingle();
		console.log('[adminRepository] deleteAlert report fetch:', { report, error: repFetchErr });
		if (repFetchErr) throw repFetchErr;

		if (!report) {
			throw new Error(`Could not find alert with ID: ${alertId}`);
		}

		const { error, count } = await supabase.from('safety_reports').delete({ count: 'exact' }).eq('id', alertId);
		console.log('[adminRepository] deleteAlert report delete:', { error, count });
		if (error) throw error;
		if (!count || count === 0) {
			throw new Error(`Could not delete alert with ID: ${alertId}`);
		}
	},

	async assignAlert(alertId: string, adminId: string): Promise<void> {
		// Query safety_reports only
		const { error, count } = await supabase
			.from('safety_reports')
			.update({ status: 'In Review', updated_at: new Date().toISOString() }, { count: 'exact' })
			.eq('id', alertId);

		if (error) throw error;
		if (!count || count === 0) {
			throw new Error(`Could not find or update alert with ID: ${alertId}`);
		}
	},
};

// ============================================
// SAFETY ALERT TYPES
// ============================================

export type SafetyAlertWithProfiles = {
	id: string;
	reporter: { id: string; full_name: string; age: number; location: string | null; user_type: 'youth' | 'elderly'; account_created: string; previous_reports: number; avatar_url: string | null; phone_number: string | null; };
	reported_user?: { id: string; full_name: string; age: number; occupation: string | null; user_type: 'youth' | 'elderly'; account_status: 'active' | 'suspended' | 'banned'; previous_warnings: number; avatar_url: string | null; phone_number: string | null; };
	relationship_id?: string;
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
function mapRowToSafetyAlert(row: any, source: 'incident' | 'manual_report' = 'incident'): SafetyAlertWithProfiles {
	const detectedAtDate = new Date(row.detected_at || row.created_at);
	const now = new Date();
	const waitingTimeMinutes = Math.round((now.getTime() - detectedAtDate.getTime()) / (1000 * 60));

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

	if (source === 'manual_report') {
		const severityMap: Record<string, any> = { 'Low': 'low', 'Medium': 'medium', 'High': 'high', 'Critical': 'critical' };
		const statusMap: Record<string, any> = { 'Pending': 'new', 'In Review': 'under_review', 'Resolved': 'resolved' };

		return {
			id: row.id,
			reporter: {
				id: row.reporter?.id || '',
				full_name: row.reporter?.full_name || 'Anonymous User',
				age: calculateAge(row.reporter?.date_of_birth),
				location: row.reporter?.location || 'Unknown',
				user_type: row.reporter?.user_type || 'elderly',
				account_created: row.reporter?.created_at || '',
				previous_reports: 0,
				avatar_url: row.reporter?.profile_photo_url || null,
				phone_number: row.reporter?.phone || 'N/A'
			},
			incident_type: 'manual_report',
			severity: severityMap[row.severity_level] || 'low',
			status: statusMap[row.status] || 'new',
			description: row.description || '',
			subject: row.subject || 'Manual Safety Report',
			evidence: (row.evidence_urls || []).map((url: string) => ({ name: 'Evidence', type: 'image', size: 'Unknown', url })),
			detected_keywords: [],
			ai_analysis: null,
			relationship_stage: 'N/A',
			relationship_duration: 'N/A',
			detected_at: row.created_at,
			waiting_time_minutes: waitingTimeMinutes,
			assigned_admin_id: null,
			admin_notes: null,
			admin_action_taken: null,
			resolved_at: row.updated_at !== row.created_at ? row.updated_at : null
		};
	}

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
			previous_reports: 0,
			avatar_url: row.reporter?.profile_photo_url || row.reporter?.avatar_url || null,
			phone_number: row.reporter?.phone || 'N/A'
		},
		reported_user: {
			id: row.reported_user?.id || '',
			full_name: row.reported_user?.full_name || 'Unknown',
			age: calculateAge(row.reported_user?.date_of_birth),
			occupation: row.reported_user?.profile_data?.occupation || null,
			user_type: row.reported_user?.user_type || 'youth',
			account_status: row.reported_user?.is_active ? 'active' : 'suspended',
			previous_warnings: row.reported_user?.warning_count || 0,
			avatar_url: row.reported_user?.profile_photo_url || row.reported_user?.avatar_url || null,
			phone_number: row.reported_user?.phone || 'N/A'
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
	requesterAvatarUrl: string | null;
	partnerId: string;
	partnerName: string;
	partnerAge: number;
	partnerAvatarUrl: string | null;
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

		// For 'all' view, exclude completed and dismissed - they should only show when filtered explicitly
		if (status && status !== 'all') {
			query = query.eq('status', status);
		} else {
			// 'all' shows only active requests (pending, assigned, in_progress)
			query = query.in('status', ['pending_assignment', 'assigned', 'in_progress']);
		}
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

		// TODO: Uncomment when notification system is fixed
		// Create notification for the requester (UC504: user notification on advisor assignment)
		// try {
		// 	const { data: request, error: reqError } = await supabase
		// 		.from('consultation_requests')
		// 		.select('requester_id')
		// 		.eq('id', consultationId)
		// 		.single();
		// 
		// 	if (reqError) {
		// 		console.error('Failed to fetch requester:', reqError);
		// 		return;
		// 	}
		// 
		// 	const { data: advisor } = await supabase
		// 		.from('advisors')
		// 		.select('name')
		// 		.eq('id', advisorId)
		// 		.single();
		// 
		// 	if (request?.requester_id) {
		// 		const advisorName = advisor?.name || 'a Family Advisor';
		// 		const { error: insertError } = await supabase.from('notifications').insert({
		// 			user_id: request.requester_id,
		// 			type: 'admin_notice',
		// 			title: 'Advisor Assigned! 🎉',
		// 			message: `${advisorName} has been assigned to your consultation request. They will contact you soon.`,
		// 			reference_id: consultationId,
		// 			reference_table: 'consultation_requests',
		// 			is_read: false
		// 		});
		// 
		// 		if (insertError) {
		// 			console.error('Failed to insert notification:', insertError);
		// 		} else {
		// 			console.log('✅ Notification created for user:', request.requester_id);
		// 		}
		// 	}
		// } catch (notifError) {
		// 	console.error('Failed to create user notification:', notifError);
		// }
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
	},

	async submitConsultationRequest(
		requesterId: string,
		partnerId: string,
		relationshipId: string | null,
		consultationType: string,
		concernDescription: string,
		urgency: 'normal' | 'high' = 'normal',
		preferredMethod: 'video_call' | 'phone' | 'chat' = 'video_call',
		preferredDateTime: string = ''
	): Promise<string> {
		// Append preferred datetime to description if provided (since DB expects TIMESTAMPTZ)
		const fullDescription = preferredDateTime
			? `${concernDescription}\n\nPreferred time: ${preferredDateTime}`
			: concernDescription;

		const { data, error } = await supabase
			.from('consultation_requests')
			.insert({
				requester_id: requesterId,
				partner_id: partnerId,
				relationship_id: relationshipId,
				consultation_type: consultationType,
				concern_description: fullDescription,
				urgency: urgency,
				preferred_method: preferredMethod,
				status: 'pending_assignment',
				submitted_at: new Date().toISOString()
			})
			.select('id')
			.single();
		if (error) throw error;
		return data.id;
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

	// Parse preferred time from description (since we append it there due to TIMESTAMPTZ constraint)
	let concernDescription = row.concern_description || '';
	let preferredDateTime = row.preferred_datetime || '';

	// Check if preferred time is embedded in description
	const preferredTimeMatch = concernDescription.match(/\n\nPreferred time: (.+)$/);
	if (preferredTimeMatch) {
		preferredDateTime = preferredTimeMatch[1];
		concernDescription = concernDescription.replace(/\n\nPreferred time: .+$/, '');
	}

	return {
		id: row.id,
		requesterId: row.requester_id,
		requesterName: row.requester?.full_name || 'Unknown',
		requesterType: row.requester?.user_type || 'elderly',
		requesterAge: calculateAge(row.requester?.date_of_birth),
		requesterAvatarUrl: row.requester?.profile_photo_url || row.requester?.avatar_url || null,
		partnerId: row.partner_id,
		partnerName: row.partner?.full_name || 'Unknown',
		partnerAge: calculateAge(row.partner?.date_of_birth),
		partnerAvatarUrl: row.partner?.profile_photo_url || row.partner?.avatar_url || null,
		consultationType: row.consultation_type,
		preferredMethod: row.preferred_method || 'video_call',
		preferredDateTime: preferredDateTime,
		concernDescription: concernDescription,
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