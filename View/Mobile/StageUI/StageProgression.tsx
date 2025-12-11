import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { stageViewModel } from "../../../ViewModel/StageViewModel";
import { StageCircle } from "../components/ui/StageCircle";
import { NotificationBell } from "../components/ui/NotificationBell";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Button, Card } from "../components/ui"; // Added
import { Colors } from "@/constants/theme"; // Added for theme colors

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

    const handleStagePress = async (stage: any) => {
      await vm.handleStageClick(stage);
    };

    const handleNotificationPress = () => {
      vm.markNotificationsRead();
      router.push("/(main)/notification");
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
                  {index < vm.stages.length - 1 && <View style={styles.connector} />}
                </React.Fragment>
              ))}
            </View>

            {/* Inline locked-stage preview OR current stage card */}
            {vm.showLockedStageDetail && vm.lockedStageDetails ? (
              <View style={styles.lockedDetailContainer}>
                <View style={styles.lockIconWrapper}>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>

                <Text style={styles.lockedTitle}>
                  Stage {vm.lockedStageDetails.stage_order}: {vm.lockedStageDetails.title}
                </Text>
                <Text style={styles.lockedDescription}>
                  {vm.lockedStageDetails.unlock_message}
                </Text>

                <View style={styles.previewCard}>
                  <Text style={styles.previewHeading}>
                    What&apos;s Next in Stage {vm.lockedStageDetails.stage_order}:
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
            ) : (
              <View style={styles.currentStageCard}>
                <Text style={styles.cardTitle}>
                  Current Stage: {vm.stages.find((s) => s.is_current)?.display_name}
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
                  {vm.daysTogether} days together • {vm.progressPercentage}% complete
                </Text>

                <Text style={styles.goalsTitle}>Stage Goals:</Text>
                {vm.requirements.slice(0, 3).map((req) => (
                  <Text key={req.id} style={styles.goalItem}>
                    • {req.title}
                  </Text>
                ))}
              </View>
            )}
            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => router.push("/(main)/stageRequirements")}
            >
              <Text style={styles.actionButtonText}>View All Requirements</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => router.push("/(main)/availableFeatures")}
            >
              <Text
                style={[styles.actionButtonText, styles.secondaryButtonText]}
              >
                View Available Features
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Bottom Navigation */}
          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navButton} onPress={() => { }}>
              <Text style={styles.navIcon}>🏠</Text>
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

          {/* Withdraw Modal - Inlined */}
          <Modal
            visible={vm.showWithdrawModal}
            transparent
            animationType="fade"
            onRequestClose={() => vm.closeWithdrawModal()}
          >
            <View style={styles.modalOverlay}>
              <Card style={styles.modalCard} padding={24}>
                <Text style={styles.modalIcon}>⚠️</Text>
                <Text style={styles.modalTitle}>Withdraw from Match?</Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to withdraw from this match? This action cannot be undone.
                </Text>

                <View style={styles.warningBox}>
                  <Text style={styles.warningIcon}>⏱️</Text>
                  <Text style={styles.warningText}>
                    A 24-hour cooling period will begin after withdrawal.
                  </Text>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Please provide a reason (optional)"
                  placeholderTextColor="#A0A0A0"
                  value={vm.withdrawalReason}
                  onChangeText={(text) => vm.setWithdrawalReason(text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <View style={styles.buttonRow}>
                  <Button
                    title="Cancel"
                    onPress={() => vm.closeWithdrawModal()}
                    variant="secondary"
                    disabled={vm.isLoading}
                    style={{ flex: 1 }}
                  />

                  <Button
                    title={vm.isLoading ? 'Processing...' : 'Withdraw'}
                    onPress={() => vm.submitWithdrawal()}
                    variant="destructive"
                    loading={vm.isLoading}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
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
    width: '100%',
  },
  stageScrollView: {
    marginBottom: 32,
  },
  stageScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  connector: {
    width: 28,
    height: 3,
    backgroundColor: '#DDEDE6',
    marginHorizontal: 6,
    alignSelf: 'center',
    borderRadius: 1.5,
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


  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
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
  previewHeading: { fontWeight: "700", marginBottom: 12, color: "#333", fontSize: 16 },
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
  },
  modalIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.light.textLight,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: Colors.light.warning,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
  },
  input: {
    backgroundColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 20,
    minHeight: 80,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
