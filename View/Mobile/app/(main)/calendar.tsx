import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { CalendarScreen } from '@/FamilyViewUI';

export default function FamilyCalendarPage() {
  return (
    <SafeAreaView style={styles.container}>
      <CalendarScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
