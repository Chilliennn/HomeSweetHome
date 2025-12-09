import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { AIRecommendationsScreen } from '@/FamilyViewUI';

export default function AIRecommendationsRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <AIRecommendationsScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
