import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { DiaryDetailScreen } from '@/FamilyViewUI';

export default function DiaryDetailRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <DiaryDetailScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
