import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, SuccessIcon, AlertBanner } from '../ui';

interface VerifiedSuccessProps {
  verifiedAge: number;
  userType: 'youth' | 'elderly';
  onContinue: () => void;
}

export const VerifiedSuccess: React.FC<VerifiedSuccessProps> = ({
  verifiedAge,
  userType,
  onContinue,
}) => {
  const userTypeLabel = userType === 'youth' ? 'Youth User' : 'Elderly User';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SuccessIcon size={120} style={styles.icon} />

      <Text style={styles.title}>Verified! </Text>
      <Text style={styles. subtitle}>
        Your age has been successfully verified. You can now continue with your profile setup.
      </Text>

      <Card style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <View style={styles.resultIndicator} />
          <Text style={styles.resultTitle}>✓ Age Verification Complete</Text>
        </View>
        <Text style={styles.resultText}>
          Verified age: <Text style={styles. bold}>{verifiedAge} years old</Text>
        </Text>
        <Text style={styles.resultText}>
          Category: <Text style={styles.bold}>{userTypeLabel}</Text>
        </Text>
      </Card>

      <AlertBanner
        type="success"
        message="Your IC information has been securely processed and will not be stored.  Only your verified age status is saved."
        icon="🔒"
        style={styles.alert}
      />

      <Button
        title="Continue to Profile"
        onPress={onContinue}
        variant="primary"
        style={styles.button}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  icon: {
    marginTop: 60,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  resultCard: {
    width: '100%',
    marginBottom: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultIndicator: {
    width: 4,
    height: 40,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
    marginRight: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  resultText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 16,
    marginTop: 4,
  },
  bold: {
    fontWeight: '700',
  },
  alert: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#D4EDDA',
  },
  button: {
    width: '100%',
  },
});

export default VerifiedSuccess;