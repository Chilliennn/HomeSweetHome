import { makeAutoObservable, runInAction } from "mobx";
import { stageService } from "../../Model/Service/CoreService/stage";
import { familyService } from "../../Model/Service/CoreService/familyService";
import { familyAIService } from "../../Model/Service/CoreService/familyAIService";
import { notificationService } from "../../Model/Service/CoreService/notificationService";
import type {
  Feature,
  LockedStageDetail,
  RelationshipStage,
  StageInfo,
  StageRequirement,
  JourneyStats,
  AISuggestion,
} from "../../Model/types/index";

export class StageViewModel {
  // Observable state
  userId: string = "";
  relationshipId: string = "";
  userRole: 'youth' | 'elderly' | null = null;
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
  hasInitialized: boolean = false;
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
  shouldNavigateToJourneyCompleted: boolean = false;
  shouldNavigateToJourneyPause: boolean = false;
  isRefreshing: boolean = false;
  journeyStats: JourneyStats | null = null;

  // Manual sign-off observables
  showManualSignOffModal: boolean = false;
  selectedActivity: StageRequirement | null = null;
  aiSuggestions: AISuggestion[] = [];

  // Tracking state for realtime detection
  private previousStage: RelationshipStage | null = null;
  private shownMilestones: number[] = [];

  private relationshipSubscription: any = null;
  private activitiesSubscription: any = null;
  private notificationSubscription: any = null;
  currentUserId: any;

  private lastStageCompletionTriggerAt: number | null = null;
  private lastStageCompletionTriggerStage: RelationshipStage | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  private setupRealtimeSubscription(relationshipId: string) {
    if (this.relationshipSubscription || this.activitiesSubscription) {
      console.log(
        "[StageViewModel] Realtime subscriptions already active, skipping setup."
      );
      return;
    }

    this.cleanupSubscriptions();

    console.log(
      "[StageViewModel] Setting up realtime subscriptions for:",
      relationshipId
    );

    // Delegate subscription setup to the service layer
    const subscriptions = stageService.setupRealtimeSubscriptions(
      relationshipId,
      {
        onRelationshipChange: (payload: any) => {
          console.log(
            "[StageViewModel] onRelationshipChange callback invoked in VM"
          );
          this.handleRealtimeRelationshipChange(payload);
        },
        onActivityChange: (payload: any) => {
          console.log(
            "[StageViewModel] onActivityChange callback invoked in VM"
          );
          this.handleRealtimeActivityChange(payload);
        },
      }
    );

    this.relationshipSubscription = subscriptions.relationshipSubscription;
    this.activitiesSubscription = subscriptions.activitiesSubscription;

    console.log("[StageViewModel] Realtime subscriptions setup complete:", {
      hasRelationshipSub: !!this.relationshipSubscription,
      hasActivitiesSub: !!this.activitiesSubscription,
    });
  }

  private async handleRealtimeActivityChange(payload: any) {
    console.log(
      "[StageViewModel] handleRealtimeActivityChange called with payload:",
      payload
    );
    try {
      if (!this.userId) {
        console.log(
          "[StageViewModel] handleRealtimeActivityChange - no userId, returning"
        );
        return;
      }

      console.log(
        "[StageViewModel] Reloading progression and requirements after activity change..."
      );

      await this.loadStageProgression(this.userId, true);
      await this.loadCurrentStageRequirements();
      await this.loadMilestoneInfo();
      this.checkMilestoneReached();

      const stageOrder: RelationshipStage[] = [
        "getting_to_know",
        "trial_period",
        "official_ceremony",
        "family_life",
      ];

      console.log(
        "[StageViewModel] Current stage:",
        this.currentStage,
        "Final stage:",
        stageOrder[stageOrder.length - 1]
      );

      if (this.currentStage === stageOrder[stageOrder.length - 1]) {
        console.log(
          "[StageViewModel] On final stage! Checking requirements...",
          {
            requirementsCount: this.requirements?.length || 0,
            requirements: this.requirements,
          }
        );

        if (this.previousStage !== this.currentStage) {
          console.log(
            "[StageViewModel] Skipping journey completion check - still transitioning from:",
            this.previousStage,
            "to:",
            this.currentStage
          );
          return;
        }

        if (this.requirements && this.requirements.length > 0) {
          const allDone = this.requirements.every((r) => !!r.is_completed);
          console.log("[StageViewModel] All requirements completed?", allDone);

          if (allDone) {
            const now = Date.now();
            if (
              this.lastStageCompletionTriggerStage === this.currentStage &&
              this.lastStageCompletionTriggerAt &&
              now - this.lastStageCompletionTriggerAt < 5000
            ) {
              console.log(
                "[StageViewModel] Duplicate final-stage-complete event ignored for:",
                this.currentStage
              );
              return;
            }

            const completedStage = this.currentStage as RelationshipStage;

            console.log(
              "[StageViewModel] All requirements completed — completedStage:",
              completedStage,
              "currentStage:",
              this.currentStage
            );

            runInAction(() => {
              if (completedStage === "family_life") {
                // If we are already about to navigate to a stage completed page,
                // don't trigger journey completed yet. This prevents "jumping" pages.
                if (!this.shouldNavigateToStageCompleted) {
                  this.stageJustCompleted = completedStage;
                  this.stageJustCompletedName =
                    this.stages.find((s) => s.stage === completedStage)
                      ?.display_name || "";
                  this.shouldNavigateToJourneyCompleted = true;
                  this.lastStageCompletionTriggerStage = completedStage;
                  this.lastStageCompletionTriggerAt = now;
                } else {
                  console.log(
                    "[StageViewModel] Suppressing journey-completed because stage-completed is pending"
                  );
                }
              } else {
                // For non-final stages, prioritize navigation if not already pending
                if (!this.shouldNavigateToStageCompleted) {
                  this.stageJustCompleted = completedStage;
                  this.stageJustCompletedName =
                    this.stages.find((s) => s.stage === completedStage)
                      ?.display_name || "";
                  this.shouldNavigateToStageCompleted = true;
                  this.shouldNavigateToJourneyCompleted = false;
                  this.lastStageCompletionTriggerStage = completedStage;
                  this.lastStageCompletionTriggerAt = now;
                }
              }
            });
          }
        }
      }
    } catch (err) {
      console.error("[StageViewModel] handleRealtimeActivityChange error", err);
    }
  }

  private async evaluateJourneyPauseIfNeeded(
    relationshipId: string,
    payloadNew: any
  ) {
    try {
      await this.loadCoolingPeriodInfo();

      runInAction(() => {
        if (this.isInCoolingPeriod) {
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
    if (this.relationshipSubscription || this.activitiesSubscription) {
      stageService.cleanupRealtimeSubscriptions({
        relationshipSubscription: this.relationshipSubscription,
        activitiesSubscription: this.activitiesSubscription,
      });
      this.relationshipSubscription = null;
      this.activitiesSubscription = null;
    }
    // Cleanup notification subscription
    if (this.notificationSubscription) {
      notificationService.unsubscribe(this.notificationSubscription);
      this.notificationSubscription = null;
    }
  }

  /**
   * Setup notification realtime subscription
   */
  private setupNotificationSubscription(userId: string) {
    if (this.notificationSubscription) {
      console.log("[StageViewModel] Notification subscription already active");
      return;
    }

    console.log(
      "[StageViewModel] Setting up notification subscription for:",
      userId
    );
    this.notificationSubscription =
      notificationService.subscribeToNotifications(userId, (notification) => {
        console.log(
          "[StageViewModel] New notification received:",
          notification.type
        );
        // Reload notification count when new notification arrives
        runInAction(() => {
          this.unreadNotificationCount += 1;
        });
      });
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

        const completedStage = this.previousStage;
        const now = Date.now();

        if (
          this.lastStageCompletionTriggerStage === completedStage &&
          this.lastStageCompletionTriggerAt &&
          now - this.lastStageCompletionTriggerAt < 5000
        ) {
          console.log(
            "[Realtime] Duplicate stage-complete event ignored for:",
            completedStage
          );
          runInAction(() => {
            this.previousStage = newData.current_stage;
          });
          return;
        }

        runInAction(() => {
          this.stageJustCompleted = completedStage;
          this.stageJustCompletedName =
            this.stages.find((s) => s.stage === completedStage)?.display_name ||
            "";
          this.shouldNavigateToStageCompleted = true;
          this.lastStageCompletionTriggerStage = completedStage;
          this.lastStageCompletionTriggerAt = now;
        });
      } else if (prevIndex !== -1 && newIndex !== -1 && newIndex < prevIndex) {
        console.log(
          "[Realtime] Stage moved backward - skipping completion page"
        );
      }

      runInAction(() => {
        this.previousStage = newData.current_stage;
      });
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
      this.loadCoolingPeriodInfo();
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

  consumeMilestoneNavigation(): boolean {
    const pending = this.shouldNavigateToMilestone;
    if (pending) {
      runInAction(() => {
        this.shouldNavigateToMilestone = false;
      });
    }
    return pending;
  }

  consumeStageCompletionNavigation(): boolean {
    if (
      this.shouldNavigateToStageCompleted &&
      this.stageJustCompleted === "family_life"
    ) {
      runInAction(() => {
        this.shouldNavigateToStageCompleted = false;
        this.shouldNavigateToJourneyCompleted = true;
      });
      return false;
    }

    const pending = this.shouldNavigateToStageCompleted;
    if (pending) {
      runInAction(() => {
        this.shouldNavigateToStageCompleted = false;
      });
    }
    return pending;
  }

  consumeJourneyPauseNavigation(): boolean {
    const pending = this.shouldNavigateToJourneyPause;
    if (pending) {
      runInAction(() => {
        this.shouldNavigateToJourneyPause = false;
      });
    }
    return pending;
  }

  consumeJourneyCompletedNavigation(): boolean {
    const FINAL_STAGE: RelationshipStage = "family_life";
    if (
      this.shouldNavigateToJourneyCompleted &&
      this.stageJustCompleted === FINAL_STAGE
    ) {
      runInAction(() => {
        this.shouldNavigateToJourneyCompleted = false;
      });
      return true;
    }
    return false;
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
      await this.loadJourneyStats();
      await this.loadAISuggestions();

      if (this.relationshipId) {
        this.setupRealtimeSubscription(this.relationshipId);
      }

      runInAction(() => {
        // After everything is loaded, check if we need to be on pause screen
        if (this.isInCoolingPeriod) {
          this.shouldNavigateToJourneyPause = true;
        }
        this.hasInitialized = true;
      });

      // Setup notification realtime subscription
      this.setupNotificationSubscription(userId);

      // Load initial notification count
      await this.loadUnreadNotifications();
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
        // Determine user role from relationship data
        if (data.youthId && data.elderlyId && this.userId) {
          this.userRole = data.youthId === this.userId ? 'youth' : 'elderly';
        }
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

      // Check for auto-advancement condition
      if (this.userId) {
        void stageService.advanceStageIfEligible(this.userId);
      }

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

      // Run AI verification for topic-based activities
      try {
        const { runActivityVerificationCheck } = await import(
          "../../Model/Service/CoreService/ActivityVerificationService"
        );

        // Map stage to DB stage name
        const stageMap: Record<string, string> = {
          getting_to_know: "getting_acquainted",
          trial_period: "building_trust",
          official_ceremony: "family_bond",
          family_life: "full_adoption",
        };
        const dbStage = stageMap[this.currentStage] || this.currentStage;

        const verificationResult = await runActivityVerificationCheck(
          this.relationshipId,
          dbStage
        );

        if (verificationResult.completed > 0) {
          console.log(
            `[StageViewModel] AI verified ${verificationResult.completed} activities as complete!`
          );
          // Reload requirements to get updated completion status
          const updatedReqs = await stageService.getCurrentStageRequirements(
            this.relationshipId,
            this.currentStage
          );
          runInAction(() => {
            this.requirements = updatedReqs;
          });
        }
      } catch (verifyError) {
        console.warn(
          "[StageViewModel] AI verification error (non-fatal):",
          verifyError
        );
      }

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
      const count = await stageService.getUnreadNotificationCount(this.userId);

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
      await stageService.markNotificationsAsRead(this.userId);

      runInAction(() => {
        this.unreadNotificationCount = 0;
      });
    } catch (err: any) {
      console.error("Error marking notifications read:", err);
    }
  }

  async loadJourneyStats() {
    if (!this.userId) return;

    this.isLoading = true;
    try {
      if (this.relationshipId) {
        const stats = await stageService.getJourneyStats(this.relationshipId); // Assuming stageService has this method
        runInAction(() => {
          this.journeyStats = stats;
        });
      }
    } catch (error) {
      console.error("[StageViewModel] Failed to load journey stats", error);
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

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
      runInAction(() => {
        this.stageJustCompleted = targetStage;
        this.stageJustCompletedName = targetStageInfo.display_name;
        this.showStageCompleted = false;
        this.showLockedStageDetail = false;
        this.selectedLockedStage = null;
      });
      try {
        await this.loadStageCompletionInfo(targetStage);
        runInAction(() => {
          this.showStageCompleted = true;
        });
      } catch (e) {
        console.error("loadStageCompletionInfo failed", e);
        runInAction(() => {
          // keep showStageCompleted false on failure
          this.showStageCompleted = false;
        });
      }
      return;
    }

    runInAction(() => {
      this.selectedLockedStage = targetStage;
      this.lockedStageDetails = null;
      this.showLockedStageDetail = true;
      this.showStageCompleted = false;
    });
    void this.loadLockedStageDetails(targetStage).catch((e) =>
      console.error("loadLockedStageDetails failed", e)
    );
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

      await this.loadCoolingPeriodInfo();

      runInAction(() => {
        this.showWithdrawModal = false;
        this.withdrawalReason = "";
        this.isLoading = false;
        if (this.isInCoolingPeriod) {
          this.shouldNavigateToJourneyPause = true;
        }
      });

      return true;
    } catch (err: any) {
      console.error("[StageViewModel] submitWithdrawal error:", err);
      runInAction(() => {
        this.error = err.message;
        this.isLoading = false;
      });
      return false;
    }
  }

  // ===========================
  // AI SUGGESTIONS
  // ===========================

  async loadAISuggestions() {
    if (!this.relationshipId) return;
    try {
      const suggestions = await familyService.getActivityRecommendations(
        this.relationshipId
      );
      runInAction(() => {
        this.aiSuggestions = suggestions;
      });
    } catch (e) {
      console.error("Error loading AI suggestions", e);
    }
  }

  async useAISuggestion(suggestion: AISuggestion) {
    if (!this.relationshipId || !this.userId) return;
    this.isLoading = true;
    try {
      // 1. Create calendar event
      // Use tomorrow's date to ensure it passes the "future date" validation in familyService
      const tomorrow = new Date(Date.now() + 86400000);
      const dateString = tomorrow.toISOString().split("T")[0];

      await familyService.createCalendarEvent(
        this.relationshipId,
        this.userId,
        suggestion.activity_title || "New Activity",
        "activity",
        dateString,
        undefined,
        suggestion.activity_description || undefined
      );

      // 2. Mark suggestion as used
      await familyService.useSuggestion(suggestion.id);

      // 3. Reload suggestions
      await this.loadAISuggestions();
    } catch (e: any) {
      console.error("Error using AI suggestion", e);
      // alert the user that creation failed
      runInAction(() => {
        this.error = e.message || "Failed to add activity to calendar";
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async generateNewIdeas() {
    if (!this.relationshipId || !this.userId) return;
    this.isLoading = true;
    try {
      // Fetch stats to get context (using existing method)
      const stats = await stageService.getJourneyStats(this.relationshipId);

      // Need relationship object for generation
      // We'll add this to stageService or use a workaround if needed.
      // For now, let's assume we can get it from userRepository if we must,
      // but let's try to stay in service layer.
      const relationship = await stageService.getRelationshipById(
        this.relationshipId
      );
      if (relationship) {
        // Mood and location could be more dynamic, using defaults for now
        await familyAIService.generateAndSaveRecommendations(
          this.relationshipId,
          "neutral",
          "Singapore",
          relationship as any
        );
        await this.loadAISuggestions();
      }
    } catch (e) {
      console.error("Error generating new ideas", e);
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
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
      this.checkMilestoneReached();
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

          // Derive completedStageOrder from the VM stages array (more reliable)
          const derivedIndex = this.stages.findIndex(
            (s) => s.stage === info.completedStage
          );
          if (derivedIndex >= 0) {
            this.completedStageOrder = derivedIndex;
          } else {
            this.completedStageOrder =
              typeof info.stageOrder === "number" ? info.stageOrder - 1 : 0;
          }

          this.showLockedStageDetail = false;
          this.selectedLockedStage = null;
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
    return `Congratulations! You've successfully completed "${this.stageJustCompletedName
      }" and moved to Stage ${this.completedStageOrder + 1}: ${this.currentStageDisplayName
      }.`;
  }

  // ============================================================================
  // MANUAL SIGN-OFF METHODS
  // ============================================================================

  openManualSignOff(activity: StageRequirement) {
    runInAction(() => {
      this.selectedActivity = activity;
      this.showManualSignOffModal = true;
    });
  }

  closeManualSignOff() {
    runInAction(() => {
      this.showManualSignOffModal = false;
      this.selectedActivity = null;
    });
  }

  async confirmManualSignOff() {
    if (!this.selectedActivity || !this.userId) return;

    this.isLoading = true;
    try {
      await stageService.signOffActivity(this.selectedActivity.id, this.userId);
      await this.refresh();
      this.closeManualSignOff();
    } catch (err: any) {
      console.error("[StageViewModel] signOffActivity error", err);
      runInAction(() => {
        this.error = err.message;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }
}

// Singleton instance
export const stageViewModel = new StageViewModel();
export const vm = stageViewModel;
