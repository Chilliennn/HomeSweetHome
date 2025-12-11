import { makeAutoObservable, runInAction } from "mobx";
import { stageService } from "../../Model/Service/CoreService/stage";
import { userRepository } from "../../Model/Repository/UserRepository/userRepository";
import type {
  Feature,
  LockedStageDetail,
  RelationshipStage,
  StageInfo,
  StageRequirement,
} from "../../Model/types/index";
import { supabase } from "../../Model/Service/APIService/supabase";

export class StageViewModel {
  // Observable state
  userId: string = "";
  relationshipId: string = "";
  stages: StageInfo[] = [];
  currentStage: RelationshipStage | null = null;
  metrics: any = null;
  requirements: StageRequirement[] = [];
  availableFeatures: any[] = [];
  unreadNotificationCount: number = 0;
  lockedStageDetails: LockedStageDetail | null = null;
  allFeatures: Feature[] = [];
  selectedLockedStage: RelationshipStage | null = null;
  showLockedStageDetail: boolean = false;
  selectedFeature: Feature | null = null;
  showFeatureLockModal: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;
  showWithdrawModal: boolean = false;
  withdrawalReason: string = "";
  showStageCompleted: boolean = false;

  // Milestone observables
  milestoneReached: number | null = null;
  milestoneDaysTogether: number = 0;
  milestoneVideoCallCount: number = 0;
  milestoneAchievements: string[] = [];

  // Cooling period observables
  isInCoolingPeriod: boolean = false;
  coolingPeriodEndsAt: Date | null = null;
  coolingRemainingSeconds: number = 0;
  coolingProgressFrozenAt: number = 0;
  coolingStageDisplayName: string = "";
  private coolingIntervalId: ReturnType<typeof setInterval> | null = null;

  // Stage completion observables
  stageJustCompleted: RelationshipStage | null = null;
  stageJustCompletedName: string = "";
  currentStageDisplayName: string = "";
  newlyUnlockedFeatures: string[] = [];
  completedStageOrder: number = 1;

  // Navigation triggers
  shouldNavigateToStageCompleted: boolean = false;
  shouldNavigateToMilestone: boolean = false;
  shouldNavigateToJourneyPause: boolean = false;

  // Tracking state for realtime detection
  private previousStage: RelationshipStage | null = null;
  private shownMilestones: number[] = [];

  private relationshipSubscription: any = null;
  private activitiesSubscription: any = null;

  constructor() {
    makeAutoObservable(this);
  }
  private setupRealtimeSubscription(relationshipId: string) {
    this.cleanupSubscriptions();

    console.log(
      "[StageViewModel] Setting up realtime subscriptions for:",
      relationshipId
    );

    // Subscribe to relationship changes 
    this.relationshipSubscription = supabase
      .channel(`relationship:${relationshipId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events 
          schema: "public",
          table: "relationships",
          filter: `id=eq.${relationshipId}`,
        },
        (payload) => {
          console.log("[Realtime] Relationship changed:", payload);
          this.handleRealtimeRelationshipChange(payload);
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Relationship subscription status:", status);
        if (status === "CHANNEL_ERROR") {
          console.warn(
            "[Realtime] Relationship channel error. Attempting to resubscribe..."
          );
        }
      });

    // Subscribe to activities changes 
    this.activitiesSubscription = supabase
      .channel(`activities:${relationshipId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activities",
          filter: `relationship_id=eq.${relationshipId}`,
        },
        (payload) => {
          console.log("[Realtime] Activity changed:", payload);

          // Reload requirements when activities change
          this.loadCurrentStageRequirements();
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Activities subscription status:", status);
      });
  }

  private async evaluateJourneyPauseIfNeeded(
    relationshipId: string,
    payloadNew: any
  ) {
    try {
      const cooling = await stageService.getCoolingPeriodInfo(this.userId);

      const active = !!(
        cooling &&
        cooling.isInCoolingPeriod &&
        typeof cooling.remainingSeconds === "number" &&
        cooling.remainingSeconds > 0
      );

      runInAction(() => {
        if (active) {
          this.shouldNavigateToJourneyPause = true;
        } else {
          this.shouldNavigateToJourneyPause = false;
        }
      });
    } catch (err) {
      console.error("[StageViewModel] evaluateJourneyPauseIfNeeded error", err);
    }
  }

  private cleanupSubscriptions() {
    if (this.relationshipSubscription) {
      supabase.removeChannel(this.relationshipSubscription);
      this.relationshipSubscription = null;
    }
    if (this.activitiesSubscription) {
      supabase.removeChannel(this.activitiesSubscription);
      this.activitiesSubscription = null;
    }
  }

  /**
   * Handle realtime relationship changes 
   */
  private async handleRealtimeRelationshipChange(payload: any) {
    const newData = payload.new;

    const stageOrder: RelationshipStage[] = [
      "getting_to_know",
      "trial_period",
      "official_ceremony",
      "family_life",
    ];

    // Detect stage completion
    if (this.previousStage && newData.current_stage !== this.previousStage) {
      const prevIndex = stageOrder.indexOf(this.previousStage);
      const newIndex = stageOrder.indexOf(newData.current_stage);

      if (prevIndex !== -1 && newIndex !== -1 && newIndex > prevIndex) {
        console.log(
          `[Realtime] Stage completed: ${this.previousStage} → ${newData.current_stage}`
        );
        runInAction(() => {
          this.shouldNavigateToStageCompleted = true;
        });

        // Also load full stage completion info
        this.loadStageCompletionInfo();
      } else if (prevIndex !== -1 && newIndex !== -1 && newIndex < prevIndex) {
        console.log(
          "[Realtime] Stage moved backward - skipping completion page"
        );
      }

      this.previousStage = newData.current_stage;
    }

    // Detect cooling period 
    if (
      newData.status === "paused" &&
      newData.end_request_status === "pending_cooldown"
    ) {
      console.log("[Realtime] Cooling period detected");
      await this.evaluateJourneyPauseIfNeeded(newData.id, newData);
    }

    // Reload data without showing loading spinner
    if (this.userId) {
      this.loadStageProgression(this.userId, true);
      this.loadMilestoneInfo();
      this.checkMilestoneReached();
    }
  }

  /**
   * Check if a milestone has been reached and trigger navigation
   */
  private checkMilestoneReached() {
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    const days = this.milestoneDaysTogether;

    if (milestones.includes(days) && !this.shownMilestones.includes(days)) {
      console.log("[Realtime] Milestone reached:", days);
      runInAction(() => {
        this.shouldNavigateToMilestone = true;
        this.shownMilestones.push(days);
      });
    } else {
      // Debug log 
      if (milestones.includes(days) && this.shownMilestones.includes(days)) {
        console.log(`[Realtime] Milestone ${days} already shown, skipping.`);
      } else if (!milestones.includes(days)) {
      }
    }
  }

  dispose() {
    this.cleanupSubscriptions();
  }
  /**
   * Initialize with user ID and load all data
   */
  async initialize(userId: string) {
    this.userId = userId;
    this.isLoading = true;
    this.error = null;

    try {
      this.shownMilestones = [];

      await this.loadStageProgression(userId, false, true);

      // Load supplementary streams
      await this.loadMilestoneInfo();
      await this.loadCoolingPeriodInfo();
      await this.loadStageCompletionInfo();

      if (this.relationshipId) {
        this.setupRealtimeSubscription(this.relationshipId);
      }
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }
  /**
   * Load stage progression data
   * @param userId - User ID
   * @param isRealtimeUpdate - If true, skip setting isLoading to prevent UI flash
   * @param keepLoading - If true, do not set isLoading to false (used during initialization)
   */
  async loadStageProgression(
    userId: string,
    isRealtimeUpdate = false,
    keepLoading = false
  ) {
    // Only show loading spinner on initial load, not realtime updates
    if (!isRealtimeUpdate) {
      this.isLoading = true;
    }
    this.error = null;

    try {
      const data = await stageService.getStageProgression(this.userId);

      runInAction(() => {
        this.stages = data.stages;
        this.currentStage = data.currentStage;
        this.relationshipId = data.relationshipId;
        this.metrics = data.metrics;
        // Track previous stage for transition detection
        if (!this.previousStage) {
          this.previousStage = data.currentStage;
        }
        if (!isRealtimeUpdate && !keepLoading) {
          this.isLoading = false;
        }
      });

      // Only setup subscription on initial load, not realtime updates
      if (!isRealtimeUpdate && this.relationshipId) {
        this.setupRealtimeSubscription(this.relationshipId);
      }

      try {
        if (this.relationshipId && this.currentStage) {
          const pct = await stageService.computeProgressPercent(
            this.relationshipId,
            this.currentStage
          );
          runInAction(() => {
            this.metrics = {
              ...(this.metrics || {}),
              progress_percentage: pct,
            };
          });
        }
      } catch (e) {
        console.error("Error computing initial progress percent", e);
      }

      // Load requirements for current stage
      await this.loadCurrentStageRequirements();
      await this.loadStageFeatures();
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message;
        if (!isRealtimeUpdate) {
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * Load requirements for current stage
   */
  async loadCurrentStageRequirements() {
    if (!this.currentStage || !this.relationshipId) return;

    try {
      const reqs = await stageService.getCurrentStageRequirements(
        this.relationshipId,
        this.currentStage
      );

      runInAction(() => {
        this.requirements = reqs;
      });

      try {
        const pct = await stageService.computeProgressPercent(
          this.relationshipId,
          this.currentStage
        );
        runInAction(() => {
          this.metrics = { ...(this.metrics || {}), progress_percentage: pct };
        });
      } catch (e) {
        console.error(
          "Error updating progress percent after requirements load",
          e
        );
      }
    } catch (err: any) {
      console.error("Error loading requirements:", err);
    }
  }

  /**
   * Load available features for current stage
   */
  async loadStageFeatures() {
    if (!this.currentStage) return;

    try {
      const features = await stageService.getStageFeatures(this.currentStage);

      runInAction(() => {
        this.availableFeatures = features;
      });
    } catch (err: any) {
      console.error("Error loading features:", err);
    }
  }

  /**
   * Load unread notification count
   */
  async loadUnreadNotifications() {
    try {
      const count = await userRepository.getUnreadNotificationCount(
        this.userId
      );

      runInAction(() => {
        this.unreadNotificationCount = count;
      });
    } catch (err: any) {
      console.error("Error loading notifications:", err);
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsRead() {
    try {
      await userRepository.markNotificationsRead(this.userId);

      runInAction(() => {
        this.unreadNotificationCount = 0;
      });
    } catch (err: any) {
      console.error("Error marking notifications read:", err);
    }
  }

  /**
   * Handle stage click
   */
  async handleStageClick(
    targetStage: RelationshipStage,
    options?: { forceOpen?: boolean }
  ) {
    if (!this.currentStage) return;

    const targetStageInfo = this.stages.find((s) => s.stage === targetStage);

    // If user taps the current stage while viewing a locked detail, close it
    if (targetStageInfo?.is_current && this.showLockedStageDetail) {
      this.closeLockedStageDetail();
      return;
    }

    // If tapping the current stage and not forcing open, do nothing
    if (targetStageInfo?.is_current && !options?.forceOpen) {
      return;
    }

    if (targetStageInfo?.is_completed) {
      await this.loadStageCompletionInfo(targetStage);
      runInAction(() => {
        this.stageJustCompleted = targetStage;
        this.stageJustCompletedName = targetStageInfo.display_name;
        this.showStageCompleted = true;
      });
      return;
    }

    this.selectedLockedStage = targetStage;
    await this.loadLockedStageDetails(targetStage);
    this.showLockedStageDetail = true;
  }

  async loadRequirementsByEmail(userEmail: string, stage: RelationshipStage) {
    try {
      this.isLoading = true;
      const reqs = await stageService.getRequirementsForUserByEmail(
        userEmail,
        stage
      );
      runInAction(() => {
        this.requirements = reqs;
        this.isLoading = false;
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message;
        this.isLoading = false;
      });
    }
  }

  /**
   * Load locked stage details
   */
  async loadLockedStageDetails(targetStage: RelationshipStage) {
    try {
      const details = await stageService.getLockedStageDetails(targetStage);

      runInAction(() => {
        this.lockedStageDetails = details;
        this.showLockedStageDetail = true;
      });
    } catch (err: any) {
      console.error("Error loading locked stage details:", err);
    }
  }

  /**
   * Close locked stage detail view
   */
  closeLockedStageDetail() {
    runInAction(() => {
      this.showLockedStageDetail = false;
      this.selectedLockedStage = null;
      this.lockedStageDetails = null;
    });
  }

  /**
   * Load all features for available features page
   */
  async loadAllFeatures() {
    if (!this.currentStage) return;

    try {
      const features = await stageService.getAllFeaturesForStage(
        this.currentStage
      );

      runInAction(() => {
        this.allFeatures = features;
      });
    } catch (err: any) {
      console.error("Error loading all features:", err);
    }
  }

  /**
   * Handle feature click
   */
  handleFeatureClick(feature: Feature) {
    if (!feature.is_unlocked) {
      this.selectedFeature = feature;
      this.showFeatureLockModal = true;
    }
  }

  /**
   * Close feature lock modal
   */
  closeFeatureLockModal() {
    this.showFeatureLockModal = false;
    this.selectedFeature = null;
  }

  /**
   * Get current stage requirements for display
   */
  get currentStageRequirements(): StageRequirement[] {
    return this.requirements;
  }

  /**
   * Get unlocked features
   */
  get unlockedFeatures(): Feature[] {
    return this.allFeatures.filter((f) => f.is_unlocked);
  }

  /**
   * Get locked features
   */
  get lockedFeatures(): Feature[] {
    return this.allFeatures.filter((f) => !f.is_unlocked);
  }

  /**
   * Show withdrawal modal
   */
  openWithdrawModal() {
    this.showWithdrawModal = true;
  }

  /**
   * Close withdrawal modal
   */
  closeWithdrawModal() {
    this.showWithdrawModal = false;
    this.withdrawalReason = "";
  }

  /**
   * Set withdrawal reason
   */
  setWithdrawalReason(reason: string) {
    this.withdrawalReason = reason;
  }

  /**
   * Submit withdrawal request
   */
  /**
   * Submit withdrawal request
   * Returns true if successful
   */
  async submitWithdrawal(): Promise<boolean> {
    this.isLoading = true;

    try {
      await stageService.requestWithdrawal(
        this.relationshipId,
        this.userId,
        this.withdrawalReason.trim() || "No reason provided"
      );

      runInAction(() => {
        this.showWithdrawModal = false;
        this.withdrawalReason = "";
        this.isLoading = false;
      });

      return true;
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message;
        this.isLoading = false;
      });
      return false;
    }
  }

  /**
   * Refresh all stage data
   */
  async refresh() {
    if (this.userId) {
      this.isLoading = true;
      try {
        await Promise.all([
          this.loadStageProgression(this.userId, true),
          this.loadMilestoneInfo().then(() => {
            this.checkMilestoneReached();
          }),
          this.loadCoolingPeriodInfo(),
          this.loadStageCompletionInfo(),
          this.loadUnreadNotifications(),
        ]);
      } catch (e) {
        console.error("Error refreshing stage data", e);
      } finally {
        runInAction(() => {
          this.isLoading = false;
        });
      }
    }
  }

  /**
   * Get progress percentage for display
   */
  get progressPercentage(): number {
    return this.metrics?.progress_percentage || 0;
  }

  /**
   * Get days together
   */
  get daysTogether(): number {
    return this.metrics?.active_days || 0;
  }

  // ============================================================================
  // MILESTONE METHODS
  // ============================================================================

  /**
   * Load milestone info for display on milestone reached page
   */
  async loadMilestoneInfo() {
    if (!this.userId) return;
    // Don't set isLoading = true here to prevent UI flash during realtime updates

    try {
      const info = await stageService.getMilestoneInfo(this.userId);

      runInAction(() => {
        if (info) {
          this.milestoneReached = info.milestoneReached;
          this.milestoneDaysTogether = info.daysTogether;
          this.milestoneVideoCallCount = info.videoCallCount;
          this.milestoneAchievements = info.achievements;
        }
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message;
      });
    }
  }

  /**
   * Get milestone display message based on days
   */
  get milestoneMessage(): string {
    const days = this.milestoneDaysTogether;
    if (days >= 365)
      return `Congratulations! You've completed ${days} days together. A full year of wonderful connection!`;
    if (days >= 180)
      return `Congratulations! You've completed ${days} days together. Half a year of beautiful memories!`;
    if (days >= 90)
      return `Congratulations! You've completed ${days} days together. Keep up the wonderful connection!`;
    if (days >= 60)
      return `Congratulations! You've completed ${days} days together. Two months of precious moments!`;
    if (days >= 30)
      return `Congratulations! You've completed ${days} days together. Keep up the wonderful connection!`;
    if (days >= 14)
      return `Congratulations! You've completed ${days} days together. Two weeks of bonding!`;
    if (days >= 7)
      return `Congratulations! You've completed ${days} days together. Your first week milestone!`;
    return `You've been together for ${days} days!`;
  }

  // ============================================================================
  // COOLING PERIOD METHODS
  // ============================================================================

  /**
   * Load cooling period info for journey pause page
   */
  async loadCoolingPeriodInfo() {
    if (!this.userId) return;
    this.isLoading = true;

    try {
      const info = await stageService.getCoolingPeriodInfo(this.userId);

      runInAction(() => {
        if (info) {
          this.isInCoolingPeriod = info.isInCoolingPeriod;
          this.coolingPeriodEndsAt = info.coolingEndsAt;
          this.coolingRemainingSeconds = info.remainingSeconds;
          this.coolingProgressFrozenAt = info.progressFrozenAt;
          this.currentStage = info.currentStage;
          this.coolingStageDisplayName = info.stageDisplayName;

          // Start countdown if in cooling period
          if (info.isInCoolingPeriod) {
            this.startCoolingCountdown();
          }
        }
        this.isLoading = false;
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message;
        this.isLoading = false;
      });
    }
  }

  /**
   * Start the real-time countdown timer for cooling period
   */
  startCoolingCountdown() {
    // Clear any existing interval
    this.stopCoolingCountdown();

    this.coolingIntervalId = setInterval(() => {
      runInAction(() => {
        if (this.coolingRemainingSeconds > 0) {
          this.coolingRemainingSeconds -= 1;
        } else {
          this.stopCoolingCountdown();
          this.isInCoolingPeriod = false;
        }
      });
    }, 1000);
  }

  /**
   * Stop the countdown timer
   */
  stopCoolingCountdown() {
    if (this.coolingIntervalId) {
      clearInterval(this.coolingIntervalId);
      this.coolingIntervalId = null;
    }
  }

  /**
   * Get formatted countdown time (HH:MM:SS)
   */
  get formattedCoolingTime(): string {
    const hours = Math.floor(this.coolingRemainingSeconds / 3600);
    const minutes = Math.floor((this.coolingRemainingSeconds % 3600) / 60);
    const seconds = this.coolingRemainingSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  // ============================================================================
  // STAGE COMPLETION METHODS
  // ============================================================================

  /**
   * Load stage completion info for completed page
   */
  async loadStageCompletionInfo(targetStage?: RelationshipStage) {
    if (!this.userId) return;
    this.isLoading = true;

    try {
      const info = await stageService.getStageCompletionInfo(
        this.userId,
        targetStage
      );

      runInAction(() => {
        if (info) {
          this.stageJustCompleted = info.completedStage;
          this.stageJustCompletedName = info.completedStageDisplayName;
          this.currentStage = info.currentStage;
          this.currentStageDisplayName = info.currentStageDisplayName;
          this.newlyUnlockedFeatures = info.newlyUnlockedFeatures;
          this.completedStageOrder = info.stageOrder - 1;
          this.showStageCompleted = true;
          this.showLockedStageDetail = false;
          this.selectedLockedStage = null;
          this.showStageCompleted = true;
        }
        this.isLoading = false;
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message;
        this.isLoading = false;
      });
    }
  }

  closeStageCompleted() {
    runInAction(() => {
      this.showStageCompleted = false;
      this.stageJustCompleted = null;
      this.stageJustCompletedName = "";
      this.newlyUnlockedFeatures = [];
    });
  }
  /**
   * Get completion message for stage
   */
  get stageCompletionMessage(): string {
    if (!this.stageJustCompletedName || !this.currentStageDisplayName) {
      return "Congratulations on your progress!";
    }
    return `Congratulations! You've successfully completed "${
      this.stageJustCompletedName
    }" and moved to Stage ${this.completedStageOrder + 1}: ${
      this.currentStageDisplayName
    }.`;
  }
}

// Singleton instance
export const stageViewModel = new StageViewModel();
