import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { vm } from "../../../ViewModel/StageViewModel";
import { Colors } from "@/constants/theme";
import { Button } from "../components/ui/Button";
import { Ionicons } from "@expo/vector-icons";

export const JourneyCompletedScreen = observer(() => {
  const router = useRouter();

  useEffect(() => {
    vm.loadJourneyStats();
  }, []);

  const handleContinue = () => {
    router.replace("/(main)/stage" as any); 
  };

  const StatItem = ({
    value,
    label,
    color,
  }: {
    value: string | number;
    label: string;
    color: string;
  }) => (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.celebrationRow}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.emoji}>🏆</Text>
            <Text style={styles.emoji}>🎉</Text>
          </View>
          <Text style={styles.title}>Journey Complete!</Text>
          <Text style={styles.subtitle}>
            Congratulations! You have completed the{"\n"}Family Life stage and
            the full adoption{"\n"}journey.
          </Text>
        </View>

        {/* Official Family Card */}
        <View style={styles.familyCard}>
          <Text style={styles.familyTitle}>Official Family</Text>
          <Text style={styles.familySubtitle}>You are now family!</Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Ionicons
              name="stats-chart"
              size={24}
              color={Colors.light.primary}
            />
            <Text style={styles.statsTitle}>Your Journey Stats</Text>
          </View>

          <View style={styles.statsGrid}>
            <StatItem
              value={vm.journeyStats?.daysTogether ?? "-"}
              label="Days Together"
              color="#EE8B8B"
            />
            <StatItem
              value={vm.journeyStats?.videoCalls ?? "-"}
              label="Video Calls"
              color="#EE8B8B"
            />
            <StatItem
              value={vm.journeyStats?.homeVisits ?? "-"}
              label="Home Visits"
              color="#EE8B8B"
            />
            <StatItem
              value={
                vm.journeyStats?.memories ? `${vm.journeyStats.memories}+` : "-"
              }
              label="Memories"
              color="#EE8B8B"
            />
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.footer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            style={styles.continueButton}
            textStyle={styles.continueButtonText}
            variant="primary" // Using primary variant which should be teal based on theme
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFDF7", // Cream background from screenshot
  },
  scrollContent: {
    padding: 24,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  celebrationRow: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 8,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4CAF50", // Green title
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  familyCard: {
    backgroundColor: "#D4E5AE", // Light green background
    width: "100%",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
  },
  familyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  familySubtitle: {
    fontSize: 14,
    color: "#666",
  },
  statsCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 32,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "space-between",
  },
  statItem: {
    width: "45%", // Two columns
    alignItems: "center",
    marginBottom: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  footer: {
    width: "100%",
    marginTop: "auto",
  },
  continueButton: {
    backgroundColor: "#9DE2D0", // Teal color
    borderRadius: 16,
    height: 56,
  },
  continueButtonText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
  },
});
