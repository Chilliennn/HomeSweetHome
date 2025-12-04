import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

/**
 * Bonding Screen (Route: /(main)/bonding)
 * 
 * Displays bonding features for users with active relationships.
 * Users can manage their relationship, communicate, and track progress.
 * 
 * TODO: Move UI to FamilyViewUI/BondingScreen.tsx and re-export here
 * TODO: Connect to FamilyViewModel for state management
 */
export default function BondingScreen() {
  const router = useRouter();
  const { userName } = useLocalSearchParams();

  const handleLogout = () => {
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hi, {userName}!</Text>
      <Text style={styles.subtitle}>You&apos;re in an active relationship.</Text>
      <Text style={styles.description}>
        Continue building your bond through shared activities and memories.
      </Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  logoutButton: {
    backgroundColor: '#E89B8E',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});