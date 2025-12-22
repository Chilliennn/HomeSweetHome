import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "mobx-react-lite";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { stageViewModel } from "../../../ViewModel/StageViewModel";
import { StageCircle } from "../components/ui/StageCircle";
import { NotificationBell } from "../components/ui/NotificationBell";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { BottomTabBar, DEFAULT_TABS } from "../components/ui/BottomTabBar";
import { RelationshipStage } from "@home-sweet-home/model/types";
import { runInAction } from "mobx";

interface StageProgressionScreenProps {
  userId: string;
  initialOpenStage?: string;
}

export const StageProgressionScreen: React.FC<StageProgressionScreenProps> =
  observer(({ userId, initialOpenStage }) => {
    const router = useRouter();
    const vm = stageViewModel;

    useEffect(() => {
      let mounted = true;
      const init = async () => {
        if (!userId) return;
        try {
          await vm.initialize(userId);

          if (!mounted) return;

          if (vm.showStageCompleted) vm.closeStageCompleted();
          if (vm.showLockedStageDetail) vm.closeLockedStageDetail();

          try {
            runInAction(() => {
              vm.showStageCompleted = false;
              vm.showLockedStageDetail = false;
              vm.shouldNavigateToStageCompleted = false;
              vm.shouldNavigateToJourneyCompleted = false;
              vm.shouldNavigateToMilestone = false;
              vm.shouldNavigateToJourneyPause = false;
            });
          } catch (e) {
            console.warn(
              "[StageProgression] Failed to reset VM navigation flags",
              e
            );
          }

          setTimeout(() => {
            if (!mounted) return;
            if (vm.showStageCompleted) vm.closeStageCompleted();
            if (vm.showLockedStageDetail) vm.closeLockedStageDetail();
          }, 100);
        } catch (e) {
          console.error("[StageProgression] init error:", e);
        }
      };

      init();

      return () => {
        mounted = false;
        vm.dispose();
      };
    }, [userId, vm]);

    useEffect(() => {
      if (!initialOpenStage) return;
      if (vm.showStageCompleted) vm.closeStageCompleted();
      if (vm.showLockedStageDetail) vm.closeLockedStageDetail();
      vm.handleStageClick(initialOpenStage as any, { forceOpen: true }).catch(
        (e) => console.error("Failed to open initial stage:", e)
      );
    }, [initialOpenStage, vm]);

    // Watch for auto-navigation to Stage Completed page
    useEffect(() => {
      if (vm.consumeStageCompletionNavigation()) {
        (async () => {
          console.log(
            "[StageProgression] Stage completion detected, loading info ->",
            {
              stageJustCompleted: vm.stageJustCompleted,
              stageJustCompletedName: vm.stageJustCompletedName,
              userId,
            }
          );

          try {
            // Ensure VM has the latest completion info
            await vm.loadStageCompletionInfo(
              vm.stageJustCompleted ?? undefined
            );

            const completedStage = vm.stageJustCompleted;
            if (completedStage === ("family_life" as any)) {
              console.log(
                "[StageProgression] Completed stage is family_life -> navigate to journey-completed"
              );
              router.push({
                pathname: "/(main)/journey-completed",
                params: { userId },
              });
            } else {
              router.push({
                pathname: "/(main)/stage-completed",
                params: { userId, stage: completedStage ?? "" },
              });
            }
          } catch (err) {
            console.error("Failed to handle stage completion navigation:", err);
          }
        })();
      }
    }, [vm, vm.shouldNavigateToStageCompleted, router, userId]);

    // Watch for auto-navigation to Milestone page
    useEffect(() => {
      if (vm.consumeMilestoneNavigation()) {
        router.push({ pathname: "/(main)/milestone", params: { userId } });
      }
    }, [vm.shouldNavigateToMilestone, router, userId, vm]);

    // Watch for auto-navigation to Journey Pause page
    useEffect(() => {
      if (vm.consumeJourneyPauseNavigation()) {
        router.push({ pathname: "/journey-pause", params: { userId } });
      }
    }, [vm.shouldNavigateToJourneyPause, router, userId, vm]);

    // Watch for auto-navigation to Journey Completed page (final stage fully completed)
    useEffect(() => {
      if (vm.consumeJourneyCompletedNavigation()) {
        (async () => {
          try {
            // Ensure completion info loaded
            await vm.loadStageCompletionInfo(vm.currentStage ?? undefined);
            router.push({
              pathname: "/(main)/journey-completed",
              params: { userId },
            });
          } catch (err) {
            console.error("Failed to navigate to journey-completed:", err);
          }
        })();
      }
    }, [vm.shouldNavigateToJourneyCompleted, router, userId, vm]);

    const handleStagePress = async (targetStage: RelationshipStage) => {
      try {
        // Close any open modals before navigating
        if (vm.showStageCompleted) vm.closeStageCompleted();
        if (vm.showLockedStageDetail) vm.closeLockedStageDetail();

        // If clicking current stage, just close modals to show current stage card
        const currentStageInfo = vm.stages.find((s) => s.is_current);
        if (currentStageInfo?.stage === targetStage) {
          // Modals already closed above, current stage card will show
          return;
        }

        await vm.handleStageClick(targetStage, { forceOpen: true });
      } catch (err) {
        console.error("[StageProgression] handleStagePress error:", err);
      }
    };

    const collapseSpaces = (text?: string) => {
      if (!text) return "";
      return text.replace(/\s+/g, " ").trim();
    };

    const progressPct = vm.progressPercentage ?? 0;
    const progressWidthPct = progressPct > 0 ? Math.max(progressPct, 2) : 0;

    const handleNotificationPress = () => {
      vm.markNotificationsRead();
      router.push("/(main)/notification");
    };

    const handleRefresh = async () => {
      try {
        await vm.refresh();
      } catch (e) {
        console.error("[StageProgression] refresh error:", e);
      } finally {
        runInAction(() => {
          vm.showStageCompleted = false;
          vm.showLockedStageDetail = false;
          vm.shouldNavigateToStageCompleted = false;
          vm.shouldNavigateToJourneyCompleted = false;
          vm.shouldNavigateToMilestone = false;
          vm.shouldNavigateToJourneyPause = false;
        });
        if (vm.showStageCompleted) vm.closeStageCompleted();
        if (vm.showLockedStageDetail) vm.closeLockedStageDetail();
      }
    };

    const handleTabPress = (key: string) => {
      switch (key) {
        case "matching":
          break;
        case "diary":
          router.push("/(main)/diary");
          break;
        case "memory":
          router.push("/(main)/album");
          break;
        case "chat":
          router.push("/(main)/chat");
          break;
        case "settings":
          router.push("/(main)/settings");
          break;
      }
    };

    if (
      (vm.isLoading || !vm.hasInitialized) &&
      !vm.stages.length &&
      !vm.error
    ) {
      return <LoadingSpinner />;
    }

    // Navigation Guard: If we are about to navigate to a completion/milestone/pause screen,
    // don't render the rest of the UI to avoid flickering the "next" stage state.
    if (
      vm.shouldNavigateToStageCompleted ||
      vm.shouldNavigateToJourneyCompleted ||
      vm.shouldNavigateToMilestone ||
      vm.shouldNavigateToJourneyPause
    ) {
      return <LoadingSpinner />;
    }

    const isJourneyCompleted = !!vm.stages.find(
      (s) => s.stage === "family_life"
    )?.is_completed;

    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <NotificationBell
              count={vm.unreadNotificationCount}
              onPress={handleNotificationPress}
            />

            <TouchableOpacity
              style={styles.withdrawButtonHeader}
              onPress={() => vm.openWithdrawModal()}
            >
              <Text style={styles.withdrawIcon}>⚠️</Text>
              <Text style={styles.withdrawText}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={vm.isLoading}
                onRefresh={handleRefresh}
                colors={["#EB8F80"]}
                tintColor={"#EB8F80"}
              />
            }
          >
            {/* Title */}
            <Text style={styles.title}>Your Journey Together</Text>

            {/* Stage Progress */}
            <View style={styles.stageRow}>
              {vm.stages.map((stage, index) => (
                <React.Fragment key={stage.stage}>
                  <StageCircle
                    order={stage.order}
                    displayName={stage.display_name}
                    isCurrent={stage.is_current}
                    isCompleted={stage.is_completed}
                    onPress={() => handleStagePress(stage.stage)}
                  />
                  {index < vm.stages.length - 1 && (
                    <View style={styles.connector} />
                  )}
                </React.Fragment>
              ))}
            </View>

            {isJourneyCompleted && (
              <>
                <View style={styles.aiBanner}>
                  <Text style={{ fontSize: 20 }}>🤖</Text>
                  <Text style={styles.aiBannerText}>
                    Based on your diaries and interests!
                  </Text>
                </View>

                {vm.aiSuggestions.map((suggestion, index) => (
                  <View
                    key={suggestion.id}
                    style={[
                      styles.aiCard,
                      {
                        backgroundColor:
                          index % 2 === 0 ? "#9DE2D0" : "#D4E5AE",
                      },
                    ]}
                  >
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>✨ AI Recommended</Text>
                    </View>
                    <Text style={styles.aiCardTitle}>
                      {suggestion.activity_title}
                    </Text>
                    <Text style={styles.aiCardDescription}>
                      {suggestion.activity_description}
                    </Text>
                    <TouchableOpacity
                      style={styles.useIdeaButton}
                      onPress={() => vm.useAISuggestion(suggestion)}
                    >
                      <Text style={styles.useIdeaText}>Use This Idea</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={() => vm.generateNewIdeas()}
                  disabled={vm.isLoading}
                >
                  <Text style={styles.generateButtonText}>
                    {vm.isLoading ? "Generating..." : "Generate New Activities"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Error Display */}
            {vm.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {vm.error}</Text>
                <TouchableOpacity
                  onPress={handleRefresh}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Inline locked-stage preview OR current stage card */}
            {vm.showLockedStageDetail ? (
              vm.lockedStageDetails ? (
                <View style={styles.lockedDetailContainer}>
                  <View style={styles.lockIconWrapper}>
                    <Text style={styles.lockIcon}>🔒</Text>
                  </View>

                  <Text style={styles.lockedTitle}>
                    Stage {vm.lockedStageDetails.stage_order}:{" "}
                    {vm.lockedStageDetails.title}
                  </Text>
                  <Text style={styles.lockedDescription}>
                    {vm.lockedStageDetails.unlock_message}
                  </Text>

                  <View style={styles.previewCard}>
                    <Text style={styles.previewHeading}>
                      What&apos;s Next in Stage{" "}
                      {vm.lockedStageDetails.stage_order}:
                    </Text>
                    {vm.lockedStageDetails.preview_requirements.map(
                      (req: string, i: number) => (
                        <View key={i} style={styles.previewRow}>
                          <View style={styles.previewBulletWrapper}>
                            <Text style={styles.previewBullet}>○</Text>
                          </View>
                          <Text style={styles.previewText}>{req}</Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              ) : (
                // Loading state for locked details (prevents fallback to current stage card)
                <View
                  style={[
                    styles.lockedDetailContainer,
                    { minHeight: 200, justifyContent: "center" },
                  ]}
                >
                  <ActivityIndicator color="#EB8F80" size="large" />
                </View>
              )
            ) : vm.showStageCompleted ? (
              <View style={styles.lockedDetailContainer}>
                {/* Inline completion card */}
                <View style={styles.lockIconWrapper}>
                  <Text style={styles.lockIcon}>🎉</Text>
                </View>

                {/* show completed stage number */}
                <Text style={styles.lockedTitle}>
                  {(() => {
                    const completedOrder = vm.completedStageOrder ?? 0;
                    const completedStage = vm.stages[completedOrder];
                    const completedNumber = completedOrder + 1;
                    const completedName = collapseSpaces(
                      completedStage?.display_name || ""
                    );
                    return `Stage ${completedNumber}: ${completedName}`;
                  })()}
                </Text>

                <Text style={styles.lockedDescription}>
                  {(() => {
                    const completedOrder = vm.completedStageOrder ?? 0;
                    const completedStage = vm.stages[completedOrder];
                    const nextStage = vm.stages[completedOrder + 1];
                    const completedName = collapseSpaces(
                      completedStage?.display_name || ""
                    );
                    const nextNumber = completedOrder + 2;
                    const nextName = collapseSpaces(
                      nextStage?.display_name || ""
                    );
                    return `Congratulations! You've successfully completed "${completedName}" and moved to Stage ${nextNumber}: ${nextName}.`;
                  })()}
                </Text>

                <View style={styles.previewCard}>
                  <Text style={styles.previewHeading}>
                    New features unlocked:
                  </Text>
                  {vm.newlyUnlockedFeatures.length === 0 ? (
                    <Text style={styles.previewText}>No new features</Text>
                  ) : (
                    vm.newlyUnlockedFeatures.map((f: string, i: number) => (
                      <View key={i} style={styles.previewRow}>
                        <View style={styles.previewBulletWrapper}>
                          <Text style={styles.previewBullet}>✓</Text>
                        </View>
                        <Text style={styles.previewText}>{f}</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            ) : null}

            {!isJourneyCompleted &&
              !vm.showLockedStageDetail &&
              !vm.showStageCompleted && (
                <View style={styles.currentStageCard}>
                  <Text style={styles.cardTitle}>
                    Current Stage:{" "}
                    {collapseSpaces(
                      vm.stages.find((s) => s.is_current)?.display_name
                    )}
                  </Text>

                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressWidthPct}%` },
                      ]}
                    />
                  </View>

                  <Text style={styles.progressText}>
                    {vm.daysTogether} days together • {vm.progressPercentage}%
                    complete
                  </Text>

                  <Text style={styles.goalsTitle}>Stage Goals:</Text>
                  {vm.requirements.slice(0, 3).map((req) => (
                    <Text key={req.id} style={styles.goalItem}>
                      • {req.title}
                    </Text>
                  ))}
                </View>
              )}

            {!vm.showLockedStageDetail &&
              !vm.showStageCompleted &&
              vm.stages.some((s) => s.is_current) && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={() => router.push("/(main)/stageRequirements")}
                  >
                    <Text style={styles.actionButtonText}>
                      View All Requirements
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => router.push("/(main)/availableFeatures")}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        styles.secondaryButtonText,
                      ]}
                    >
                      View Available Features
                    </Text>
                  </TouchableOpacity>
                </>
              )}
          </ScrollView>

          {/* Bottom Navigation */}
          <BottomTabBar
            tabs={DEFAULT_TABS}
            activeTab="matching"
            onTabPress={handleTabPress}
          />

          {/* Withdraw Modal */}
          <Modal
            visible={vm.showWithdrawModal}
            transparent
            animationType="fade"
            onRequestClose={() => vm.closeWithdrawModal()}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Ionicons
                  name="warning"
                  size={48}
                  color="#FFC107"
                  style={{ marginBottom: 16 }}
                />

                <Text style={styles.modalTitle}>Withdraw from Match?</Text>
                <Text style={styles.modalDescription}>
                  Are you sure you want to withdraw from this match? This action
                  cannot be undone.
                </Text>

                <View style={styles.warningBox}>
                  <Ionicons
                    name="alarm-outline"
                    size={20}
                    color="#D32F2F"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.warningText}>
                    A 24-hour cooling period will begin after withdrawal.
                  </Text>
                </View>

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    onPress={() => vm.closeWithdrawModal()}
                    style={styles.modalCancelButton}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={async () => {
                      await vm.submitWithdrawal();
                    }}
                    style={styles.modalWithdrawButton}
                    disabled={vm.isLoading}
                  >
                    {vm.isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalWithdrawText}>Withdraw</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    );
  });

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  withdrawButtonHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#EB8F80",
  },
  withdrawIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  withdrawText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EB8F80",
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 32,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
    width: "100%",
  },
  stageScrollView: {
    marginBottom: 32,
  },
  stageScrollContent: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  connector: {
    width: 28,
    height: 3,
    backgroundColor: "#DDEDE6",
    marginHorizontal: 6,
    alignSelf: "center",
    borderRadius: 1.5,
    marginTop: -25,
  },
  currentStageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#9DE2D0",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  goalsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  goalItem: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#EB8F80",
  },
  secondaryButton: {
    backgroundColor: "#9DE2D0",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#333",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingBottom: 20,
    paddingTop: 12,
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 28,
  },

  lockedDetailContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lockIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F4F6F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  lockIcon: { fontSize: 36 },
  lockedTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  lockedDescription: {
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  previewCard: {
    width: "100%",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  previewHeading: {
    fontWeight: "700",
    marginBottom: 12,
    color: "#333",
    fontSize: 16,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  previewBullet: {
    fontSize: 18,
    color: "#9DE2D0",
    fontWeight: "600",
  },
  previewBulletWrapper: {
    width: 20,
    alignItems: "center",
  },
  previewText: {
    color: "#666",
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  tapToCloseHint: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tapToCloseText: {
    color: "#999",
    fontSize: 13,
    fontStyle: "italic",
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#D32F2F",
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: "#FFCDD2",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryText: {
    color: "#B71C1C",
    fontWeight: "600",
  },
  actionButtonsRow: {
    marginTop: 16,
    paddingHorizontal: 20,
    flexDirection: "column",
    gap: 12,
  },
  viewRequirementsButton: {
    backgroundColor: "#EA8A7F",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  viewRequirementsText: {
    color: "#fff",
    fontWeight: "700",
  },
  viewFeaturesButton: {
    backgroundColor: "#9DE2D0",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  viewFeaturesText: {
    color: "#1d2b24",
    fontWeight: "700",
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    marginTop: 8,
    marginBottom: 12,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: "#FFE082",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
  },
  warningText: {
    flex: 1,
    color: "#333",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modalCancelText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "700",
  },
  modalWithdrawButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#EB8F80",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#EB8F80",
  },
  modalWithdrawText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  aiBanner: {
    backgroundColor: "#C8ADD6",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  aiBannerText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  aiCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    width: "100%",
  },
  aiBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },
  aiCardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  aiCardDescription: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    marginBottom: 20,
  },
  useIdeaButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
  },
  useIdeaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  generateButton: {
    borderWidth: 2,
    borderColor: "#EA8A7F",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  generateButtonText: {
    color: "#EA8A7F",
    fontSize: 16,
    fontWeight: "700",
  },
});

