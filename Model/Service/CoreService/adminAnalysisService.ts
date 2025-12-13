import { adminRepository } from '../../Repository/AdminRepository';
import type { ApplicationWithProfiles, ApplicationStats } from '../../Repository/AdminRepository';

type QueueAnalysis = {
  total: number;
  byStatus: Record<string, number>;
  avgWaitingHours: number;
  waitingBuckets: { '0-24': number; '24-72': number; '72+': number };
  ageVerificationFailures: { youth: number; elderly: number };
  lockedCount: number;
  stats?: ApplicationStats;
};

function hoursSince(dateStr: string): number {
  const applied = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.round((now - applied) / (1000 * 60 * 60));
}

export const adminAnalysisService = {
  async analyzeQueue(status?: string): Promise<QueueAnalysis> {
    const apps: ApplicationWithProfiles[] = await adminRepository.getApplications(status, 'oldest', 1000, 0);

    const byStatus: Record<string, number> = {};
    let totalWaiting = 0;
    const buckets = { '0-24': 0, '24-72': 0, '72+': 0 };
    let youthAgeFail = 0;
    let elderlyAgeFail = 0;
    let lockedCount = 0;

    for (const a of apps) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      const hours = hoursSince(a.applied_at);
      totalWaiting += hours;
      if (hours < 24) buckets['0-24'] += 1;
      else if (hours < 72) buckets['24-72'] += 1;
      else buckets['72+'] += 1;

      if (!a.youth.age_verified) youthAgeFail += 1;
      if (!a.elderly.age_verified) elderlyAgeFail += 1;
      if (a.locked_by) lockedCount += 1;
    }

    const avg = apps.length ? Math.round(totalWaiting / apps.length) : 0;

    let stats: ApplicationStats | undefined = undefined;
    try {
      stats = await adminRepository.getApplicationStats();
    } catch {
      stats = undefined;
    }

    return {
      total: apps.length,
      byStatus,
      avgWaitingHours: avg,
      waitingBuckets: buckets,
      ageVerificationFailures: { youth: youthAgeFail, elderly: elderlyAgeFail },
      lockedCount,
      stats,
    };
  },
};

export default adminAnalysisService;
