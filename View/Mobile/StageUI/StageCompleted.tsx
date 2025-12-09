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

interface StageCompletedScreenProps {
  userId: string;
}

const stageOrder = [
  { stage: "getting_to_know", displayName: "Getting Acquainted" },
  { stage: "trial_period", displayName: "Building Trust" },
  { stage: "official_ceremony", displayName: "Family Bond" },
  { stage: "family_life", displayName: "Full Adoption" },
];

export const StageCompletedScreen: React.FC<StageCompletedScreenProps> =
  observer(({ userId }) => {
    const router = useRouter();
    const vm = stageViewModel;

    useEffect(() => {
      if (userId) {
        vm.userId = userId;
        vm.loadStageCompletionInfo();
      }
    }, [userId, vm]);

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

            {/* Stage Progress Indicator */}
            <View style={styles.stageRow}>
              {stageOrder.map((stage, index) => (
                <React.Fragment key={stage.stage}>
                  <StageCircle
                    order={index + 1}
                    displayName={stage.displayName}
                    isCurrent={index === currentStageIndex}
                    isCompleted={index < currentStageIndex}
                    onPress={() => {}}
                  />
                  {index < stageOrder.length - 1 && (
                    <View style={styles.connector} />
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* Celebration Section */}
            <View style={styles.celebrationSection}>
              <View style={styles.celebrationCircle}>
                <Text style={styles.celebrationEmoji}>🎉</Text>
              </View>
              <Text style={styles.completedTitle}>
                Stage {vm.completedStageOrder} Complete!
              </Text>
              <Text style={styles.completedMessage}>
                {vm.stageCompletionMessage}
              </Text>
            </View>

            {/* New Features Button */}
            <TouchableOpacity
              style={styles.newFeaturesButton}
              onPress={handleViewFeatures}
            >
              <Text style={styles.newFeaturesText}>New Features Unlocked</Text>
            </TouchableOpacity>

            {/* Feature List Preview */}
            {vm.newlyUnlockedFeatures.length > 0 && (
              <View style={styles.featurePreview}>
                <Text style={styles.featurePreviewTitle}>Now Available:</Text>
                {vm.newlyUnlockedFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Text style={styles.featureBullet}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Bottom Navigation */}
          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push("/(main)/bonding")}
            >
              <Text style={[styles.navIcon, styles.navIconActive]}>👥</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push("/(main)/diary")}
            >
              <Text style={styles.navIcon}>📓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push("/(main)/album")}
            >
              <Text style={styles.navIcon}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push("/(main)/chat")}
            >
              <Text style={styles.navIcon}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push("/(main)/settings")}
            >
              <Text style={styles.navIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
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
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 24,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
    width: "100%",
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
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: "center",
    marginBottom: 24,
  },
  newFeaturesText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  featurePreview: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featurePreviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 16,
    color: "#9DE2D0",
    fontWeight: "600",
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    color: "#666",
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
  navIconActive: {
    backgroundColor: "#9DE2D0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: "hidden",
  },
});
