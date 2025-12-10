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

    if (limit) {query = query.range(offset, offset + limit - 1);}

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
		]).catch(() => [ { data: null }, { data: null }, { data: null }, { data: null }]);

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
};

export default adminRepository;