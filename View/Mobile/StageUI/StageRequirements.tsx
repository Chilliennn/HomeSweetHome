import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { stageViewModel } from "../../../ViewModel/StageViewModel";

export const StageRequirementsScreen = observer(() => {
  const router = useRouter();
  const vm = stageViewModel;

  const getRequirementIcon = (isCompleted: boolean) => {
    if (isCompleted) return "✅";
    return "⏱️";
  };

  const getRequirementStatus = (requirement: any) => {
    if (requirement.is_completed) {
      return `Completed: ${formatDate(requirement.completed_at)}`;
    }
    if (
      requirement.current_value !== undefined &&
      requirement.required_value !== undefined
    ) {
      return `${requirement.current_value} more ${requirement.current_value === 1 ? "day" : "days"
        } needed`;
    }
    return "Not started";
  };

  /**
   * Get signing status for manual activities
   * Returns status text based on who has signed
   */
  const getSigningStatus = (requirement: any) => {
    if (requirement.completion_mode !== "manual" || requirement.is_completed) {
      return null;
    }

    const userRole = vm.userRole;
    const currentUserSigned =
      userRole === "youth" ? requirement.youth_signed : requirement.elderly_signed;
    const partnerSigned =
      userRole === "youth" ? requirement.elderly_signed : requirement.youth_signed;

    if (currentUserSigned && partnerSigned) {
      // Both signed - should be completed, but just in case
      return null;
    } else if (currentUserSigned && !partnerSigned) {
      return { text: "✓ You signed - waiting for partner", type: "waiting" };
    } else if (!currentUserSigned && partnerSigned) {
      return { text: "Partner signed - your turn!", type: "action" };
    }
    return null;
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "Done";
    const d = new Date(iso);
    // short user-friendly format, uses device locale
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const collapseSpaces = (text?: string) => {
    if (!text) return "";
    return text.replace(/\s+/g, " ").trim();
  };
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Stage Requirements</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stageTitle}>
            Stage {vm.stages.find((s) => s.is_current)?.order}:{" "}
            {collapseSpaces(vm.stages.find((s) => s.is_current)?.display_name)}
          </Text>

          {vm.requirements.some((r) => !r.is_completed) && (
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                Some requirements are still incomplete. See checklist for
                details.
              </Text>
            </View>
          )}

          <View style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>Requirements Checklist</Text>

            {/* "Did you know?" Hint Box */}
            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>Did you know?</Text>
              <Text style={styles.hintText}>
                Some activities can be self-verified. Tap a task with the{" "}
                <Text style={styles.hintEmoji}>👋</Text> icon to sign off.
              </Text>
            </View>

            {vm.requirements.map((requirement) => {
              const signingStatus = getSigningStatus(requirement);
              const userRole = vm.userRole;
              const currentUserSigned =
                userRole === "youth" ? requirement.youth_signed : requirement.elderly_signed;

              return (
                <View key={requirement.id} style={styles.requirementItem}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.requirementIcon}>
                      {getRequirementIcon(requirement.is_completed)}
                    </Text>
                    {/* Show wave icon for manual tasks even when completed */}
                    {requirement.completion_mode === "manual" && (
                      <Text style={styles.miniWaveIcon}>👋</Text>
                    )}
                  </View>
                  <View style={styles.requirementContent}>
                    <View style={styles.requirementTitleRow}>
                      <Text style={styles.requirementTitle}>
                        {requirement.title}
                      </Text>
                      {requirement.completion_mode === "manual" &&
                        !requirement.is_completed && (
                          <TouchableOpacity
                            style={[
                              styles.manualBadge,
                              currentUserSigned && styles.manualBadgeSigned,
                            ]}
                            onPress={() => vm.openManualSignOff(requirement)}
                            disabled={currentUserSigned}
                          >
                            <Text
                              style={[
                                styles.manualBadgeText,
                                currentUserSigned && styles.manualBadgeTextSigned,
                              ]}
                            >
                              {currentUserSigned ? "✓ Signed" : "Sign"}
                            </Text>
                          </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.requirementStatus}>
                      {getRequirementStatus(requirement)}
                    </Text>
                    {/* Signing status indicator */}
                    {signingStatus && (
                      <View
                        style={[
                          styles.signingStatusContainer,
                          signingStatus.type === "action"
                            ? styles.signingStatusAction
                            : styles.signingStatusWaiting,
                        ]}
                      >
                        <Text
                          style={[
                            styles.signingStatusText,
                            signingStatus.type === "action"
                              ? styles.signingStatusTextAction
                              : styles.signingStatusTextWaiting,
                          ]}
                        >
                          {signingStatus.text}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Manual Sign-off Modal */}
        <Modal
          visible={vm.showManualSignOffModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => vm.closeManualSignOff()}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <View style={styles.modalIconCircle}>
                  <Text style={styles.modalIconText}>📋</Text>
                </View>
              </View>

              <Text style={styles.modalTitle}>Manual Sign-off</Text>
              <Text style={styles.modalDescription}>
                Are you sure you want to manually mark this activity as
                complete?
              </Text>

              <View style={styles.honestyBox}>
                <Text style={styles.honestyIcon}>🤝</Text>
                <Text style={styles.honestyText}>
                  This action relies on the honesty policy. Confirm only if you
                  have truly met the requirements offline.
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => vm.closeManualSignOff()}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={() => vm.confirmManualSignOff()}
                  disabled={vm.isLoading}
                >
                  <Text style={styles.confirmButtonText}>
                    {vm.isLoading ? "Confirming..." : "Confirm"}
                  </Text>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#9DE2D0",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 24,
    color: "#333",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  stageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 20,
  },
  warningBox: {
    backgroundColor: "#FADE9F",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  checklistCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 20,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  iconContainer: {
    position: "relative",
    marginRight: 12,
  },
  requirementIcon: {
    fontSize: 24,
  },
  miniWaveIcon: {
    position: "absolute",
    bottom: -4,
    right: -4,
    fontSize: 14,
  },
  requirementContent: {
    flex: 1,
  },
  requirementTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  requirementStatus: {
    fontSize: 14,
    color: "#666",
  },
  hintBox: {
    backgroundColor: "#F8F0FA", // Very light purple
    borderWidth: 1,
    borderColor: "#C8ADD6", // Purple border
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  hintText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  hintEmoji: {
    fontSize: 16,
  },
  manualBadge: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginLeft: 8,
  },
  manualBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#C8ADD6", // Theme purple
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.8,
  },
  modalIconText: {
    fontSize: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
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
  honestyBox: {
    backgroundColor: "#FADE9F",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  honestyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  honestyText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: 12,
  },
  confirmButton: {
    backgroundColor: "#9DE2D0", // Theme green/teal
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  // Signed badge state
  manualBadgeSigned: {
    backgroundColor: "#D4E5AE",
    borderColor: "#9DE2D0",
  },
  manualBadgeTextSigned: {
    color: "#2E7D32",
  },
  // Signing status indicators
  signingStatusContainer: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  signingStatusWaiting: {
    backgroundColor: "#F0F0F0",
  },
  signingStatusAction: {
    backgroundColor: "#FADE9F",
  },
  signingStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  signingStatusTextWaiting: {
    color: "#666",
  },
  signingStatusTextAction: {
    color: "#5D4037",
  },
});
