import { userRepository } from "../../Repository/UserRepository/userRepository";
import type {
  Feature,
  LockedStageDetail,
  RelationshipStage,
  StageInfo,
  StageRequirement,
} from "../../types";

export class StageService {
  async getStageProgression(userId: string): Promise<{
    stages: StageInfo[];
    currentStage: RelationshipStage;
    relationshipId: string;
    metrics: any;
  }> {
    const relationship = await userRepository.getRelationshipStage(userId);

    if (!relationship) {
      throw new Error("No active relationship found");
    }

    const stageOrder: RelationshipStage[] = [
      "getting_to_know",
      "trial_period",
      "official_ceremony",
      "family_life",
    ];

    const stageNames = {
      getting_to_know: "Getting Acquainted",
      trial_period: "Building Trust",
      official_ceremony: "Family    Bond",
      family_life: "Full Adoption",
    };

    const currentStageIndex = stageOrder.indexOf(relationship.current_stage);

    const stages: StageInfo[] = stageOrder.map((stage, index) => ({
      stage,
      display_name: stageNames[stage],
      order: index + 1,
      is_current: stage === relationship.current_stage,
      is_completed: index < currentStageIndex,
    }));

    return {
      stages,
      currentStage: relationship.current_stage,
      relationshipId: relationship.id,
      metrics: relationship.stage_metrics,
    };
  }

  async getCurrentStageRequirements(
    relationshipId: string,
    stage: RelationshipStage
  ): Promise<StageRequirement[]> {
    return await userRepository.getStageRequirements(relationshipId, stage);
  }

  async getRequirementsForUserByEmail(
    userEmail: string,
    stage: RelationshipStage
  ): Promise<StageRequirement[]> {
    const user = await userRepository.getByEmail(userEmail);
    if (!user) return [];
    // getActiveRelationship returns the active relationship row (includes id)
    const relationship = await userRepository.getActiveRelationship(user.id);
    if (!relationship) return [];
    return await this.getCurrentStageRequirements(relationship.id, stage);
  }

  async getLockedStageDetails(
    targetStage: RelationshipStage
  ): Promise<LockedStageDetail | null> {
    const details = await userRepository.getLockedStageDetails(targetStage);
    if (!details) return null;

    // Map stage enum to order number for display
    const stageOrderMap: Record<RelationshipStage, number> = {
      getting_to_know: 1,
      trial_period: 2,
      official_ceremony: 3,
      family_life: 4,
    };

    return {
      ...details,
      stage_order: stageOrderMap[targetStage] || 1, // Add numeric order
    };
  }

  async getAllFeaturesForStage(
    currentStage: RelationshipStage
  ): Promise<Feature[]> {
    return await userRepository.getAllFeatures(currentStage);
  }

  /**
   * Get next stage requirements preview
   */
  async getNextStagePreview(
    currentStage: RelationshipStage
  ): Promise<string[]> {
    const stageOrder: RelationshipStage[] = [
      "getting_to_know",
      "trial_period",
      "official_ceremony",
      "family_life",
    ];
    const currentIndex = stageOrder.indexOf(currentStage);

    if (currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      const details = await this.getLockedStageDetails(nextStage);
      return details?.preview_requirements || [];
    }

    return [];
  }

  async getStageFeatures(stage: RelationshipStage) {
    const features = await userRepository.getStageFeatures(stage);

    const featureList = [
      {
        key: "text",
        name: "Text Messaging",
        description: "Unlimited messages",
      },
      {
        key: "video_call",
        name: "Video Calls",
        description: "Up to 2 hours daily",
      },
      {
        key: "photo_share",
        name: "Photo Sharing",
        description: "Share memories",
      },
      {
        key: "diary",
        name: "Shared Diary",
        description: "Document your journey",
      },
      {
        key: "scheduling",
        name: "Calendar Events",
        description: "Plan activities together",
      },
    ];

    return featureList.map((f) => ({
      ...f,
      is_unlocked: features[f.key as keyof typeof features] || false,
    }));
  }

  async requestWithdrawal(
    relationshipId: string,
    userId: string,
    reason: string
  ) {
    await userRepository.requestWithdrawal(relationshipId, userId, reason);
  }

  computeDaysTogether(stageStartIso?: string | null): number {
    if (!stageStartIso) return 0;
    const start = new Date(stageStartIso).setHours(0, 0, 0, 0);
    const now = new Date().setHours(0, 0, 0, 0);
    const diffMs = now - start;
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  async computeProgressPercent(
    relationshipId: string,
    stage: RelationshipStage
  ): Promise<number> {
    const activities = await userRepository.getStageRequirements(
      relationshipId,
      stage
    );
    if (!activities || activities.length === 0) return 0;
    const completed = activities.filter((a) => !!a.is_completed).length;
    return Math.round((completed / activities.length) * 100);
  }

  getLockedStageMessage(
    targetStage: RelationshipStage,
    currentStage: RelationshipStage
  ): string {
    const messages = {
      getting_to_know: {
        trial_period:
          'Complete "Getting Acquainted" stage to unlock Building Trust.',
        official_ceremony: "Complete previous stages to unlock Family Bond.",
        family_life: "Complete all previous stages to unlock Full Adoption.",
      },
      trial_period: {
        official_ceremony:
          'Complete "Building Trust" stage to unlock Family Bond.',
        family_life: "Complete previous stages to unlock Full Adoption.",
      },
      official_ceremony: {
        family_life: 'Complete "Family Bond" stage to unlock Full Adoption.',
      },
      family_life: {},
    };

    return (
      messages[currentStage]?.[
        targetStage as keyof (typeof messages)[typeof currentStage]
      ] || "This stage is locked."
    );
  }

  /**
   * Get milestone info for a user - checks if days together matches milestone thresholds
   */
  async getMilestoneInfo(userId: string): Promise<{
    milestoneReached: number | null;
    daysTogether: number;
    videoCallCount: number;
    achievements: string[];
    currentStage: RelationshipStage;
  } | null> {
    const relationship = await userRepository.getActiveRelationship(userId);
    if (!relationship) return null;

    const getMilestoneDataFn = (userRepository as any).getMilestoneData;
    if (typeof getMilestoneDataFn !== "function") return null;
    const milestoneData = await getMilestoneDataFn.call(userRepository, relationship.id);
    if (!milestoneData) return null;

    const milestones = [7, 14, 30, 60, 90, 180, 365];
    const daysTogether = milestoneData.daysTogether;

    // Find the highest milestone reached
    let milestoneReached: number | null = null;
    for (const m of milestones) {
      if (daysTogether >= m) {
        milestoneReached = m;
      }
    }

    // Generate achievements based on milestones and activities
    const achievements: string[] = [];
    if (daysTogether >= 7) achievements.push("First Week");
    if (daysTogether >= 30) achievements.push("First Month");
    if (daysTogether >= 90) achievements.push("Quarterly Bond");
    if (daysTogether >= 365) achievements.push("Anniversary");
    if (milestoneData.videoCallCount >= 10) achievements.push("Video Pro");
    if (milestoneData.videoCallCount >= 5) achievements.push("Story Shared");

    return {
      milestoneReached,
      daysTogether,
      videoCallCount: milestoneData.videoCallCount,
      achievements,
      currentStage: milestoneData.currentStage,
    };
  }

  /**
   * Get cooling period info - calculates remaining time for 24-hour window
   */
  async getCoolingPeriodInfo(userId: string): Promise<{
    isInCoolingPeriod: boolean;
    coolingEndsAt: Date | null;
    remainingSeconds: number;
    progressFrozenAt: number;
    currentStage: RelationshipStage;
    stageDisplayName: string;
  } | null> {
    const relationship = await userRepository.getActiveRelationship(userId);
    if (!relationship) {
      // No active relationship found
      return null;
    }

    const relationshipId = relationship?.id;
    if (!relationshipId) return null;

    const coolingInfo = await (userRepository as any).getCoolingPeriodInfo(
      relationshipId
    );
    if (!coolingInfo) return null;

    let remainingSeconds = 0;
    if (coolingInfo.coolingEndsAt) {
      remainingSeconds = Math.max(
        0,
        Math.floor((coolingInfo.coolingEndsAt.getTime() - Date.now()) / 1000)
      );
    }

    const stageNames: Record<RelationshipStage, string> = {
      getting_to_know: "Getting Acquainted",
      trial_period: "Building Trust",
      official_ceremony: "Family Bond",
      family_life: "Full Adoption",
    };

    const currentStageKey = coolingInfo.currentStage as RelationshipStage;
    return {
      isInCoolingPeriod: coolingInfo.isInCoolingPeriod,
      coolingEndsAt: coolingInfo.coolingEndsAt,
      remainingSeconds,
      progressFrozenAt: coolingInfo.progressFrozenAt,
      currentStage: currentStageKey,
      stageDisplayName: stageNames[currentStageKey] || "",
    };
  }

  /**
   * Get stage completion info - returns details about the just-completed stage
   */
  async getStageCompletionInfo(userId: string): Promise<{
    completedStage: RelationshipStage | null;
    completedStageDisplayName: string;
    currentStage: RelationshipStage;
    currentStageDisplayName: string;
    newlyUnlockedFeatures: string[];
    stageOrder: number;
  } | null> {
    const relationship = await userRepository.getActiveRelationship(userId);
    if (!relationship) return null;

    const completionData = await (userRepository as any).getStageCompletionData(
      relationship.id
    );
    if (!completionData) return null;

    const stageNames: Record<RelationshipStage, string> = {
      getting_to_know: "Getting Acquainted",
      trial_period: "Building Trust",
      official_ceremony: "Family Bond",
      family_life: "Full Adoption",
    };

    const stageOrder: RelationshipStage[] = [
      "getting_to_know",
      "trial_period",
      "official_ceremony",
      "family_life",
    ];

    // cast completionData fields to typed locals to avoid implicit any when indexing
    const currentStage = completionData.currentStage as RelationshipStage;
    const previousStage = completionData.previousStage as RelationshipStage | null;

    const currentIndex = stageOrder.indexOf(currentStage);

    // Determine newly unlocked features based on current stage
    const featuresByStage: Record<RelationshipStage, string[]> = {
      getting_to_know: ["Text Messaging", "Photo Sharing"],
      trial_period: ["Video Calls", "Shared Diary", "Calendar Events"],
      official_ceremony: ["Home Visits", "Family Activities"],
      family_life: ["Full Family Access", "Official Certificate"],
    };

    const newlyUnlockedFeatures = featuresByStage[currentStage] || [];

    return {
      completedStage: previousStage,
      completedStageDisplayName: previousStage
        ? stageNames[previousStage]
        : "",
      currentStage: currentStage,
      currentStageDisplayName: stageNames[currentStage],
      newlyUnlockedFeatures,
      stageOrder: currentIndex + 1,
    };
  }
}

export const stageService = new StageService();
