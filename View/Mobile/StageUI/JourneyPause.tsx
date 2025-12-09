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

interface JourneyPauseScreenProps {
  userId: string;
}

const stageOrder = [
  { stage: "getting_to_know", displayName: "Getting Acquainted" },
  { stage: "trial_period", displayName: "Building Trust" },
  { stage: "official_ceremony", displayName: "Family Bond" },
  { stage: "family_life", displayName: "Full Adoption" },
];

export const JourneyPauseScreen: React.FC<JourneyPauseScreenProps> = observer(
  ({ userId }) => {
    const router = useRouter();
    const vm = stageViewModel;

    useEffect(() => {
      if (userId) {
        vm.userId = userId;
        vm.loadCoolingPeriodInfo();
      }

      return () => {
        vm.stopCoolingCountdown();
      };
    }, [userId, vm]);

    const handleNotificationPress = () => {
      vm.markNotificationsRead();
      router.push("/(main)/notification");
    };

    const handleFamilyAdvisor = () => {
      router.push("/(main)/chat");
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
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.familyAdvisorButton}
                onPress={handleFamilyAdvisor}
              >
                <Text style={styles.advisorIcon}>💬</Text>
                <Text style={styles.familyAdvisorText}>Family Advisor</Text>
              </TouchableOpacity>
              <View style={styles.frozenBadge}>
                <Text style={styles.frozenIcon}>❄️</Text>
                <Text style={styles.frozenText}>Frozen</Text>
              </View>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={styles.title}>Journey Paused</Text>

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

            {/* Frozen Stage Card */}
            <View style={styles.frozenStageCard}>
              <View style={styles.frozenCardHeader}>
                <Text style={styles.frozenCardTitle}>
                  Stage {currentStageIndex + 1}: {vm.coolingStageDisplayName}
                </Text>
                <Text style={styles.snowflake}>❄️</Text>
              </View>
              <Text style={styles.frozenDescription}>
                Progress frozen at {vm.coolingProgressFrozenAt}%
              </Text>
              <View style={styles.frozenProgressBar}>
                <View
                  style={[
                    styles.frozenProgressFill,
                    { width: `${vm.coolingProgressFrozenAt}%` },
                  ]}
                />
              </View>
            </View>

            {/* Cooling Period Timer */}
            <View style={styles.timerCard}>
              <Text style={styles.timerLabel}>Cooling Period</Text>
              <Text style={styles.timerValue}>{vm.formattedCoolingTime}</Text>
            </View>

            {/* Info Text */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                During the cooling period, you can only chat with the Family
                Advisor. Your journey will resume after the 24-hour reflection
                period.
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }
);

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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  familyAdvisorButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#9DE2D0",
    backgroundColor: "#FFFFFF",
  },
  advisorIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  familyAdvisorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B9B8F",
  },
  frozenBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#D4E5AE",
  },
  frozenIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  frozenText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B8B5E",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 24,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
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
  frozenStageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  frozenCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  frozenCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  snowflake: {
    fontSize: 20,
  },
  frozenDescription: {
    fontSize: 14,
    color: "#888",
    marginBottom: 12,
  },
  frozenProgressBar: {
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  frozenProgressFill: {
    height: "100%",
    backgroundColor: "#C8ADD6",
    borderRadius: 4,
  },
  timerCard: {
    backgroundColor: "#FADE9F",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#7A6B4A",
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: "700",
    color: "#333",
    fontVariant: ["tabular-nums"],
  },
  infoContainer: {
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    textAlign: "center",
  },
});
