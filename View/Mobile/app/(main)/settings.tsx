import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.content}>
        <Text style={styles.emoji}>⚙️</Text>
        <Text style={styles.placeholderTitle}>Settings</Text>
        <Text style={styles.placeholderText}>
          Manage your profile, privacy settings, notifications, and account preferences.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9DE2D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { fontSize: 24, color: '#333' },
  title: { fontSize: 18, fontWeight: '700', color: '#333' },
  placeholder: { width: 40 },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 40,
  },
  emoji: { fontSize: 64, marginBottom: 20 },
  placeholderTitle: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#333',
    marginBottom: 12,
  },
  placeholderText: { 
    fontSize: 16, 
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});