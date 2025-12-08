import { supabase } from '../../Service/APIService/supabase';
import type { 
  User, 
  Relationship, 
  RelationshipStage, 
  StageMetrics, 
  StageFeatureFlags, 
  StageRequirement,
  LockedStageDetail,
  Feature
} from '../../types';
export const userRepository = {
  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getActiveRelationship(userId: string): Promise<Relationship | null> {
    const { data, error } = await supabase
      .from('relationships')
      .select('*')
      .or(`youth_id.eq.${userId},elderly_id.eq.${userId}`)
      .eq('status', 'active')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getRelationshipStage(userId: string) {
    const { data, error } = await supabase
      .from('relationships')
      .select('id, current_stage, stage_start_date, stage_metrics, feature_flags, status')
      .or(`youth_id.eq.${userId},elderly_id.eq.${userId}`)
      .eq('status', 'active')
      .single();

    if (error) throw error;
    return data;
  },

  async getStageRequirements(relationshipId: string, stage: RelationshipStage): Promise<StageRequirement[]> {
    // map internal stage keys to the activities.stage values stored in DB
    const stageMap: Record<RelationshipStage, string> = {
      getting_to_know: 'getting_acquainted',
      trial_period: 'building_trust',
      official_ceremony: 'family_bond',
      family_life: 'full_adoption',
    };

    const dbStage = stageMap[stage] || (stage as unknown as string);

    const { data: activities, error } = await supabase
      .from('activities')
      .select('id, title, description, is_completed, created_at, completed_at')
      .eq('relationship_id', relationshipId)
      .eq('stage', dbStage)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return activities || [];
  },

async getStageFeatures(stage: RelationshipStage): Promise<StageFeatureFlags> {
    const { data, error } = await supabase
      .from('stage_features')
      .select('feature_flags')
      .eq('stage', stage)
      .single();

    if (error) throw error;
    return data?.feature_flags as StageFeatureFlags;
  },

  async requestWithdrawal(relationshipId: string, userId: string, reason: string) {
    const { error } = await supabase
      .from('relationships')
      .update({
        end_request_status: 'pending_cooldown',
        end_request_by: userId,
        end_request_reason: reason,
        end_request_at: new Date().toISOString(),
      })
      .eq('id', relationshipId);

    if (error) throw error;
  },

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

async markNotificationsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  async getLockedStageDetails(targetStage: RelationshipStage): Promise<LockedStageDetail | null> {
    // This would typically come from a stage_info table
    // For now, we'll construct it from stage_features
    const { data, error } = await supabase
      .from('stage_features')
      .select('stage, feature_flags')
      .eq('stage', targetStage)
      .single();

    if (error) throw error;
    
    const stageNames: Record<RelationshipStage, string> = {
      getting_to_know: 'Getting Acquainted',
      trial_period: 'Building Trust',
      official_ceremony: 'Family Bond',
      family_life: 'Full Adoption'
    };

    const stagePreviews: Record<RelationshipStage, string[]> = {
      getting_to_know: ['Send unlimited text messages', 'Share photos and memories', 'Schedule meetups'],
      trial_period: ['Weekly video calls', 'Shared diary entries', 'Complete trust exercises'],
      official_ceremony: ['One offline meetup (coffee/meal)', 'Weekly video call for 3 weeks', 'Help with simple weekly tasks'],
      family_life: ['Full family integration', 'Official ceremony', 'Certificate of adoption']
    };

    const stageOrders: Record<RelationshipStage, number> = {
      getting_to_know: 0,
      trial_period: 1,
      official_ceremony: 2,
      family_life: 3
    };

    return {
      stage: targetStage,
      title: stageNames[targetStage],
      description: `This stage unlocks after you complete all requirements in the previous stage.`,
      unlock_message: `Keep interacting to progress!`,
      preview_requirements: stagePreviews[targetStage],
      stage_order: stageOrders[targetStage]
    };
  },

  /**
   * Get all features with unlock status
   */
  async getAllFeatures(currentStage: RelationshipStage): Promise<Feature[]> {
    const { data: stageFeatures, error } = await supabase
      .from('stage_features')
      .select('stage, feature_flags')
      .order('stage');

    if (error) throw error;

    const featureDefinitions = [
      { key: 'text', name: 'Text Messaging', description: 'Unlimited message', unlockStage: 'getting_to_know' as RelationshipStage },
      { key: 'video_call', name: 'Video Calls', description: 'Up to 2 hours daily', unlockStage: 'trial_period' as RelationshipStage },
      { key: 'photo_share', name: 'Photo Sharing', description: 'Share Memories', unlockStage: 'getting_to_know' as RelationshipStage },
      { key: 'diary', name: 'Shared Diary', description: 'Document your journey', unlockStage: 'trial_period' as RelationshipStage },
      { key: 'scheduling', name: 'Calendar Events', description: 'Plan activities together', unlockStage: 'trial_period' as RelationshipStage },
      { key: 'home_visits', name: 'Home Visits', description: 'Visit each other at home', unlockStage: 'official_ceremony' as RelationshipStage }
    ];

    const stageOrder: RelationshipStage[] = ['getting_to_know', 'trial_period', 'official_ceremony', 'family_life'];
    const currentStageIndex = stageOrder.indexOf(currentStage);

    return featureDefinitions.map(feature => {
      const unlockStageIndex = stageOrder.indexOf(feature.unlockStage);
      const isUnlocked = unlockStageIndex <= currentStageIndex;
      
      return {
        key: feature.key,
        name: feature.name,
        description: feature.description,
        is_unlocked: isUnlocked,
        unlock_stage: feature.unlockStage,
        unlock_message: isUnlocked ? undefined : `Unlocks at ${this.getStageDisplayName(feature.unlockStage)} stage`
      };
    });
  },

  getStageDisplayName(stage: RelationshipStage): string {
    const names: Record<RelationshipStage, string> = {
      getting_to_know: 'Getting Acquainted',
      trial_period: 'Building Trust',
      official_ceremony: 'Family Bond',
      family_life: 'Full Adoption'
    };
    return names[stage];
  },

};