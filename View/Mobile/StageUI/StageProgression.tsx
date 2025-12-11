import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { stageViewModel } from "../../../ViewModel/StageViewModel";
import { StageCircle } from "../components/ui/StageCircle";
import { NotificationBell } from "../components/ui/NotificationBell";
import { WithdrawButton } from "../components/ui/WithdrawButton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { BottomTabBar, DEFAULT_TABS } from "../components/ui/BottomTabBar";
interface StageProgressionScreenProps {
  userId: string;
}

export const StageProgressionScreen: React.FC<StageProgressionScreenProps> =
  observer(({ userId }) => {
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
      if (vm.shouldNavigateToMilestone) {
        vm.shouldNavigateToMilestone = false;
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
      if (vm.showStageCompleted) {
        vm.closeStageCompleted();
      }
      if (vm.showLockedStageDetail) {
        vm.closeLockedStageDetail();
      }
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
              style={styles.withdrawButton}
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
            {vm.showLockedStageDetail && vm.lockedStageDetails ? (
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
                  {vm.lockedStageDetails.preview_requirements.map((req, i) => (
                    <View key={i} style={styles.previewRow}>
                      <View style={styles.previewBulletWrapper}>
                        <Text style={styles.previewBullet}>○</Text>
                      </View>
                      <Text style={styles.previewText}>{req}</Text>
                    </View>
                  ))}
                </View>
              </View>
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

          <WithdrawButton
            visible={vm.showWithdrawModal}
            reason={vm.withdrawalReason}
            onReasonChange={(text) => vm.setWithdrawalReason(text)}
            onCancel={() => vm.closeWithdrawModal()}
            onConfirm={async () => {
              const success = await vm.submitWithdrawal();
              if (success) {
                router.push({
                  pathname: "/(main)/journey-pause",
                  params: { userId },
                });
              }
            }}
            isLoading={vm.isLoading}
          />
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
  withdrawButton: {
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
});
