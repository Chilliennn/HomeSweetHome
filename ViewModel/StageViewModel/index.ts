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

    // Subscribe to relationship changes (stage transitions, metrics updates)
    this.relationshipSubscription = supabase
      .channel(`relationship:${relationshipId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "relationships",
          filter: `id=eq.${relationshipId}`,
        },
        (payload) => {
          console.log("[Realtime] Relationship changed:", payload);

          // Reload stage progression when relationship changes
          if (this.userId) {
            this.loadStageProgression(this.userId);
          }
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Relationship subscription status:", status);
      });

    // Subscribe to activities changes (completion, new activities)
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
      await this.loadStageProgression(userId);

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
   */
  async loadStageProgression(p0: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const data = await stageService.getStageProgression(this.userId);

      runInAction(() => {
        this.stages = data.stages;
        this.currentStage = data.currentStage;
        this.relationshipId = data.relationshipId;
        this.metrics = data.metrics;
        this.isLoading = false;
      });

      if (this.relationshipId) {
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
        this.isLoading = false;
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
  async handleStageClick(targetStage: RelationshipStage) {
    if (!this.currentStage) return;

    const targetStageInfo = this.stages.find((s) => s.stage === targetStage);

    if (targetStageInfo?.is_current && this.showLockedStageDetail) {
      this.closeLockedStageDetail();
      return;
    }

    if (targetStageInfo?.is_current || targetStageInfo?.is_completed) {
      return; // Allow navigation or do nothing
    }

    // Locked stage - load details page
    this.selectedLockedStage = targetStage;
    await this.loadLockedStageDetails(targetStage);
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
    this.showLockedStageDetail = false;
    this.selectedLockedStage = null;
    this.lockedStageDetails = null;
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
  async submitWithdrawal() {
    if (!this.withdrawalReason.trim()) {
      this.error = "Please provide a reason for withdrawal";
      return;
    }

    this.isLoading = true;

    try {
      await stageService.requestWithdrawal(
        this.relationshipId,
        this.userId,
        this.withdrawalReason
      );

      runInAction(() => {
        this.showWithdrawModal = false;
        this.withdrawalReason = "";
        this.isLoading = false;
      });

      // Could navigate or show success message
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message;
        this.isLoading = false;
      });
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
}

// Singleton instance
export const stageViewModel = new StageViewModel();
