import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertBanner } from '../components/ui';

// ============================================================================
// PROPS INTERFACE
// ============================================================================
interface VerifyingLoaderProps {
  /** Title text displayed during verification */
  title?: string;
  /** Main message explaining the verification process */
  message?: string;
  /** Current status text shown below the loader box */
  statusText?: string;
  /** Security notice message */
  securityMessage?: string;
  /** 
   * Verification status - controlled by ViewModel 
   * Can be used to show different states (connecting, verifying, etc.)
   */
  status?: 'connecting' | 'verifying' | 'processing';
}

// ============================================================================
// CONSTANTS
// ============================================================================
const STATUS_MESSAGES = {
  connecting: 'Connecting to MyDigital ID...',
  verifying: 'Verifying your identity...',
  processing: 'Processing your information...',
};

const DEFAULT_TITLE = 'Verifying...';
const DEFAULT_MESSAGE = 'Please wait while we verify your identity with MyDigital ID. This usually takes a few seconds.';
const DEFAULT_SECURITY_MESSAGE = 'Your data is encrypted and secure. We only retrieve your age for verification.';

// ============================================================================
// COMPONENT
// ============================================================================
export const VerifyingLoader: React.FC<VerifyingLoaderProps> = ({
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
  statusText,
  securityMessage = DEFAULT_SECURITY_MESSAGE,
  status = 'connecting',
}) => {
  // Use provided statusText or default based on status
  const displayStatusText = statusText || STATUS_MESSAGES[status];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Main Loader Box */}
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>

        {/* Status Indicator */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusIcon}>🪪</Text>
          <Text style={styles.statusText}>{displayStatusText}</Text>
        </View>

        {/* Security Notice */}
        <AlertBanner
          type="info"
          message={securityMessage}
          icon="🔒"
          style={styles.alert}
        />
      </View>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loaderBox: {
    backgroundColor: '#7ECEC5',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    width: '80%',
    marginBottom: 32,
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.9,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  alert: {
    width: '100%',
  },
});

export default VerifyingLoader;