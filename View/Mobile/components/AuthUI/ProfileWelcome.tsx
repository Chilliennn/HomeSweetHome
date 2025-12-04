import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { 
  Button, 
  Card, 
  StepIndicator, 
  ChecklistItem, 
  IconCircle 
} from '../ui';

interface ProfileWelcomeProps {
  onStart: () => void;
}

export const ProfileWelcome: React. FC<ProfileWelcomeProps> = ({ onStart }) => {
  return (
    <ScrollView style={styles. container} contentContainerStyle={styles.content}>
      <IconCircle
        imageSource={require('@/assets/images/logo.png')}
        size={100}
        backgroundColor="#B8E6E6"
        style={styles.logo}
      />

      <Text style={styles.title}>Welcome! </Text>
      <Text style={styles. subtitle}>
        Let's complete your profile to start connecting.  This should take about 5-10 minutes. 
      </Text>

      <StepIndicator totalSteps={4} currentStep={1} style={styles.steps} />

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📋</Text>
          <Text style={styles.cardTitle}>What You'll Need</Text>
        </View>

        <ChecklistItem
          number={1}
          title="Malaysian IC (MyKad)"
          description="For age verification"
        />
        <ChecklistItem
          number={2}
          title="A Recent Photo"
          description="Clear face photo"
        />
        <ChecklistItem
          number={3}
          title="5 Minutes of Your Time"
          description="To fill in your interests"
          showDivider={false}
        />
      </Card>

      <Button
        title="Let's Start!"
        onPress={onStart}
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
  logo: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  steps: {
    marginBottom: 32,
  },
  card: {
    width: '100%',
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  button: {
    width: '100%',
  },
});

export default ProfileWelcome;