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
interface StageProgressionScreenProps {
  userId: string;
  initialOpenStage?: string;
}

export const StageProgressionScreen: React.FC<StageProgressionScreenProps> =
  observer(({ userId, initialOpenStage }) => {
    const router = useRouter();
    const vm = stageViewModel;

    useEffect(() => {
      if (userId) {
        vm.initialize(userId);
      }
      return () => {
        vm.dispose();
      };
    }, [userId, vm]);

    useEffect(() => {
      if (!initialOpenStage) return;
      // close any inline previews before opening target
      if (vm.showStageCompleted) vm.closeStageCompleted();
      if (vm.showLockedStageDetail) vm.closeLockedStageDetail();
      vm.handleStageClick(initialOpenStage as any, { forceOpen: true }).catch(
        (e) => console.error("Failed to open initial stage:", e)
      );
    }, [initialOpenStage, vm]);

    // Watch for auto-navigation to Stage Completed page
    useEffect(() => {
      if (!vm.shouldNavigateToStageCompleted) return;
      vm.shouldNavigateToStageCompleted = false;

      vm.loadStageCompletionInfo(vm.stageJustCompleted ?? undefined).catch(
        (err) => console.error("Failed to load stage completion info:", err)
      );
    }, [vm, vm.shouldNavigateToStageCompleted]);

    // Watch for auto-navigation to Milestone page
    useEffect(() => {
      if (vm.consumeMilestoneNavigation()) {
        router.push({ pathname: "/(main)/milestone", params: { userId } });
      }
    }, [vm.shouldNavigateToMilestone, router, userId, vm]);

    // Watch for auto-navigation to Journey Pause page
    useEffect(() => {
      if (vm.shouldNavigateToJourneyPause) {
        vm.shouldNavigateToJourneyPause = false;
        router.push({ pathname: "/(main)/journey-pause", params: { userId } });
      }
    }, [vm.shouldNavigateToJourneyPause, router, userId, vm]);

    const handleStagePress = async (stage: any) => {
      // Don't pre-emptively close previous view, let toggle logic handle it
      await vm.handleStageClick(stage);
    };

    const handleNotificationPress = () => {
      vm.markNotificationsRead();
      router.push("/(main)/notification");
    };

    const handleRefresh = async () => {
      await vm.refresh();
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

    if (vm.isLoading && !vm.stages.length) {
      return <LoadingSpinner />;
    }

    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
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
                      (req, i) => (
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
                  Stage {vm.completedStageOrder + 1}:{" "}
                  {vm.stageJustCompletedName}
                </Text>

                <Text style={styles.lockedDescription}>
                  {vm.stageCompletionMessage}
                </Text>

                <View style={styles.previewCard}>
                  <Text style={styles.previewHeading}>
                    New features unlocked:
                  </Text>
                  {vm.newlyUnlockedFeatures.length === 0 ? (
                    <Text style={styles.previewText}>No new features</Text>
                  ) : (
                    vm.newlyUnlockedFeatures.map((f, i) => (
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
            ) : (
              <View style={styles.currentStageCard}>
                <Text style={styles.cardTitle}>
                  Current Stage:{" "}
                  {vm.stages.find((s) => s.is_current)?.display_name}
                </Text>

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${vm.progressPercentage}%` },
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
                      const success = await vm.submitWithdrawal();
                      if (success) {
                        router.push({
                          pathname: "/(main)/journey-pause",
                          params: { userId },
                        });
                      }
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
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
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
});
