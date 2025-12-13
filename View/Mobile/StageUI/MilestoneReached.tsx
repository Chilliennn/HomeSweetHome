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

interface MilestoneReachedScreenProps {
  userId: string;
}

export const MilestoneReachedScreen: React.FC<MilestoneReachedScreenProps> =
  observer(({ userId }) => {
    const router = useRouter();
    const vm = stageViewModel;

    useEffect(() => {
      if (userId) {
        vm.userId = userId;
        vm.loadMilestoneInfo();
      }
    }, [userId, vm]);

    const handleNotificationPress = () => {
      vm.markNotificationsRead();
      router.push("/(main)/notification");
    };

    const handleContinue = () => {
      router.push("/(main)/bonding");
    };

    if (vm.isLoading) {
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
            <View style={styles.statusBadge}>
              <Text style={styles.statusIcon}>✓</Text>
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Milestone Banner */}
            <View style={styles.milestoneBanner}>
              <View style={styles.celebrationIconWrapper}>
                <Text style={styles.celebrationIcon}>🎉</Text>
              </View>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Milestone Reached!</Text>
                <Text style={styles.bannerMessage}>{vm.milestoneMessage}</Text>
              </View>
            </View>

            {/* Achievements Section */}
            <View style={styles.achievementsCard}>
              <View style={styles.achievementsHeader}>
                <Text style={styles.trophyIcon}>🏆</Text>
                <Text style={styles.achievementsTitle}>Your Achievements</Text>
              </View>
              <View style={styles.achievementsList}>
                {vm.milestoneAchievements.map((achievement, index) => (
                  <View
                    key={index}
                    style={[
                      styles.achievementBadge,
                      index % 3 === 0 && styles.achievementBadgeCoral,
                      index % 3 === 1 && styles.achievementBadgePurple,
                      index % 3 === 2 && styles.achievementBadgeGreen,
                    ]}
                  >
                    <Text
                      style={[
                        styles.achievementText,
                        index % 3 === 0 && styles.achievementTextCoral,
                        index % 3 === 1 && styles.achievementTextPurple,
                        index % 3 === 2 && styles.achievementTextGreen,
                      ]}
                    >
                      {achievement}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={styles.statIconWrapper}>
                  <Text style={styles.statIcon}>📅</Text>
                </View>
                <Text style={styles.statLabel}>Days Together</Text>
                <Text style={styles.statValue}>
                  {vm.milestoneDaysTogether} Days
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconWrapperPurple}>
                  <Text style={styles.statIcon}>📹</Text>
                </View>
                <Text style={styles.statLabel}>Video Calls</Text>
                <Text style={styles.statValuePurple}>
                  {vm.milestoneVideoCallCount} Calls
                </Text>
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continue Journey</Text>
            </TouchableOpacity>
          </ScrollView>
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#E8F8F4",
    borderRadius: 16,
  },
  statusIcon: {
    color: "#9DE2D0",
    marginRight: 4,
    fontWeight: "600",
  },
  statusText: {
    color: "#6B9B8F",
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  milestoneBanner: {
    backgroundColor: "#9DE2D0",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  celebrationIconWrapper: {
    width: 50,
    height: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  celebrationIcon: {
    fontSize: 24,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  bannerMessage: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  achievementsCard: {
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
  achievementsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  trophyIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  achievementsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  achievementBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  achievementBadgeCoral: {
    borderColor: "#EB8F80",
    backgroundColor: "#FFF5F3",
  },
  achievementBadgePurple: {
    borderColor: "#C8ADD6",
    backgroundColor: "#F9F5FC",
  },
  achievementBadgeGreen: {
    borderColor: "#9DE2D0",
    backgroundColor: "#F0FBF8",
  },
  achievementText: {
    fontSize: 14,
    fontWeight: "600",
  },
  achievementTextCoral: {
    color: "#EB8F80",
  },
  achievementTextPurple: {
    color: "#C8ADD6",
  },
  achievementTextGreen: {
    color: "#6B9B8F",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    backgroundColor: "#D4E5AE",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statIconWrapperPurple: {
    width: 48,
    height: 48,
    backgroundColor: "#C8ADD6",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 22,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9DE2D0",
  },
  statValuePurple: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C8ADD6",
  },
  continueButton: {
    backgroundColor: "#9DE2D0",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
