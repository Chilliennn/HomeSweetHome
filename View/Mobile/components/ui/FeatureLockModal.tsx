import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

interface FeatureLockModalProps {
  visible: boolean;
  featureName: string;
  unlockMessage: string;
  unlockStage: string;
  onClose: () => void;
  onViewRequirements: () => void;
}

export const FeatureLockModal: React.FC<FeatureLockModalProps> = ({
  visible,
  featureName,
  unlockMessage,
  unlockStage,
  onClose,
  onViewRequirements,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.icon}>🔒</Text>
          <Text style={styles.title}>Feature Locked</Text>
          <Text style={styles.message}>
            {featureName} unlocks at: <Text style={styles.highlight}>{unlockStage}</Text>
          </Text>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {unlockMessage}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onViewRequirements}
          >
            <Text style={styles.primaryButtonText}>View Requirements</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onClose}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  highlight: {
    fontWeight: '700',
    color: '#9DE2D0',
  },
  infoBox: {
    backgroundColor: '#FADE9F',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  infoText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#EB8F80',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});