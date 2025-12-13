import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { stageViewModel } from "../../../ViewModel/StageViewModel";
import { NotificationBell } from "../components/ui/NotificationBell";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { StageCircle } from "../components/ui/StageCircle";
import { BottomTabBar, DEFAULT_TABS } from "../components/ui/BottomTabBar";

interface StageCompletedScreenProps {
  userId: string;
  stage?: string;
}

const stageOrder = [
  { stage: "getting_to_know", displayName: "Getting Acquainted" },
  { stage: "trial_period", displayName: "Building Trust" },
  { stage: "official_ceremony", displayName: "Family Bond" },
  { stage: "family_life", displayName: "Full Adoption" },
];

export const StageCompletedScreen: React.FC<StageCompletedScreenProps> =
  observer(({ userId, stage }) => {
    const router = useRouter();
    const vm = stageViewModel;

    useEffect(() => {
      if (userId) {
        vm.userId = userId;
        vm.loadStageCompletionInfo(stage as any);
      }
    }, [userId, stage, vm]);

    const handleNotificationPress = () => {
      vm.markNotificationsRead();
      router.push("/(main)/notification");
    };

    const handleWithdraw = () => {
      vm.openWithdrawModal();
    };

    const handleViewFeatures = () => {
      router.push("/(main)/availableFeatures");
    };

    const handleStageClick = async (targetStage: string) => {
      try {
        await vm.handleStageClick(targetStage as any, { forceOpen: true });
        router.push({
          pathname: "/(main)/bonding",
          params: { userId, openStage: targetStage },
        });
      } catch (err) {
        console.error("Error navigating to stage:", err);
        // Fallback to bonding screen
        router.replace("/(main)/bonding");
      }
    };

    const getCurrentStageIndex = () => {
      return stageOrder.findIndex((s) => s.stage === vm.currentStage);
    };

    if (vm.isLoading) {
      return <LoadingSpinner />;
    }

    const currentStageIndex = getCurrentStageIndex();

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
              onPress={handleWithdraw}
            >
              <Text style={styles.withdrawIcon}>⚠️</Text>
              <Text style={styles.withdrawText}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={styles.title}>Your Journey Together</Text>

            <View style={styles.stageRow}>
              {stageOrder.map((stage, index) => (
                <React.Fragment key={stage.stage}>
                  <StageCircle
                    order={index + 1}
                    displayName={stage.displayName}
                    isCurrent={index === currentStageIndex}
                    isCompleted={index < currentStageIndex}
                    onPress={() => handleStageClick(stage.stage)}
                  />
                  {index < stageOrder.length - 1 && (
                    <View style={styles.connector} />
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* Celebration Section */}
            <View style={styles.celebrationSection}>
              <StageCircle
                order={vm.completedStageOrder}
                displayName={""} 
                isCurrent={false}
                isCompleted={true}
                onPress={() => {}}
                size={100} 
              />
              <Text style={styles.completedTitle}>
                Stage {vm.completedStageOrder + 1} Complete!
              </Text>
              <Text style={styles.completedMessage}>
                {vm.stageCompletionMessage + 1}
              </Text>
            </View>

            {/* New Features Button */}
            <TouchableOpacity
              style={styles.newFeaturesButton}
              onPress={handleViewFeatures}
            >
              <Text style={styles.newFeaturesText}>
                ✨ New Features Unlocked
              </Text>
            </TouchableOpacity>

            {/* Feature List Preview */}
            <View style={styles.featureList}>
              {vm.newlyUnlockedFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureBullet}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Navigation */}
          <BottomTabBar
            tabs={DEFAULT_TABS}
            activeTab="bonding"
            onTabPress={(tabId) => {
              if (tabId === "bonding") {
                router.push({
                  pathname: "/(main)/bonding",
                  params: { userId },
                });
              } else if (tabId === "communication") {
                router.push({ pathname: "/(main)/chat", params: { userId } });
              } else if (tabId === "gallery") {
                router.push({ pathname: "/(main)/album", params: { userId } });
              } else if (tabId === "diary") {
                router.push({ pathname: "/(main)/diary", params: { userId } });
              } else if (tabId === "settings") {
                router.push({
                  pathname: "/(main)/settings",
                  params: { userId },
                });
              }
            }}
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
    paddingBottom: 100, // space for bottom nav
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 32,
  },

  stageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start", // align tops
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  connector: {
    width: 28,
    height: 6,
    backgroundColor: "#FADE9F",
    borderRadius: 3,
    marginHorizontal: 6,
    alignSelf: "center",
    marginTop: 20, 
  },
  celebrationSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  celebrationCircle: {
    width: 100,
    height: 100,
    backgroundColor: "#D4E5AE",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  celebrationEmoji: {
    fontSize: 48,
  },
  completedTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  completedMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  newFeaturesButton: {
    backgroundColor: "#FADE9F",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  newFeaturesText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  featureList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureBullet: {
    fontSize: 18,
    color: "#9DE2D0",
    marginRight: 12,
    fontWeight: "600",
  },
  featureText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  continueButton: {
    backgroundColor: "#EB8F80",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
