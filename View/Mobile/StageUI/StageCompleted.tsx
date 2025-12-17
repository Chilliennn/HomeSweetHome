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
import { Ionicons } from "@expo/vector-icons";
import { stageViewModel } from "../../../ViewModel/StageViewModel";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

interface StageCompletedScreenProps {
  userId: string;
  stage?: string;
}

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

    const handleContinue = () => {
      // Navigate to bonding or back
      router.push({
        pathname: "/(main)/bonding",
        params: { userId },
      });
    };

    if (vm.isLoading) {
      return <LoadingSpinner />;
    }

    // Determine display names and numbers
    const currentName = vm.currentStageDisplayName || "Unknown Stage";

    // safe fallback
    const displayStageNumber =
      vm.completedStageOrder !== undefined ? vm.completedStageOrder + 2 : 1;

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Confetti Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.confettiIcon}>🎊</Text>
          </View>

          {/* Title and Subtitle */}
          <Text style={styles.title}>Stage Complete!</Text>
          <Text style={styles.subtitle}>
            You have progressed to:{" "}
            <Text style={styles.boldText}>{currentName}</Text>
          </Text>

          {/* Purple Stage Card */}
          <View style={styles.stageCard}>
            <Text style={styles.stageCardText}>
              Stage {displayStageNumber}: {currentName}
            </Text>
          </View>

          {/* Features Card */}
          <View style={styles.featuresCard}>
            <View style={styles.featuresHeaderRow}>
              <Text style={styles.featuresHeaderIcon}>✨</Text>
              <Text style={styles.featuresHeaderTitle}>
                New Features Unlocked
              </Text>
            </View>

            <View style={styles.featuresList}>
              {vm.newlyUnlockedFeatures.length > 0 ? (
                vm.newlyUnlockedFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color="#333"
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.featureText}>
                  No new features specified.
                </Text>
              )}
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
      </SafeAreaView>
    );
  });

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFCF0", // Cream background
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  confettiIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#EF8B7D", // Coral color
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  boldText: {
    fontWeight: "800",
    color: "#4A4A4A",
  },
  stageCard: {
    backgroundColor: "#CDB4DB", // Light purple
    width: "100%",
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  stageCardText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2C1E31",
  },
  featuresCard: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    borderRadius: 16,
    padding: 24,
    marginBottom: 40,
    // Soft shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  featuresHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  featuresHeaderIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  featuresHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureText: {
    fontSize: 16,
    color: "#444",
  },
  continueButton: {
    backgroundColor: "#EF8B7D", // Coral
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#EF8B7D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
