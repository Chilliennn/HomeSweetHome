import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { EventDetailScreen } from '@/FamilyViewUI';

export default function EventDetailRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <EventDetailScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
