import React from 'react';
import { View, Text, StyleSheet } from 'react-native'
import { AlertBanner, LoadingSpinner} from '../ui';

interface VerifyingLoaderProps {
  message?: string;
}

export const VerifyingLoader: React.FC<VerifyingLoaderProps> = ({
  message = 'Please wait while we verify your identity with MyDigital ID.  This usually takes a few seconds.',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.loaderBox}>
        <LoadingSpinner size="large" color="#FFFFFF" />
        <Text style={styles. title}>Verifying... </Text>
        <Text style={styles. message}>{message}</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusIcon}>🪪</Text>
        <Text style={styles.statusText}>Connecting to MyDigital ID...</Text>
      </View>

      <AlertBanner
        type="info"
        message="Your data is encrypted and secure.  We only retrieve your age for verification."
        icon="🔒"
        style={styles.alert}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
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
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
  },
  message: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.9,
    lineHeight: 20,
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