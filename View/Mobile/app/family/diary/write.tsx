import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { WriteDiaryScreen } from '@/FamilyViewUI';

export default function WriteDiaryRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <WriteDiaryScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
