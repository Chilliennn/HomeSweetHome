import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { DiaryScreen } from '@/FamilyViewUI';

export default function FamilyDiaryRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <DiaryScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
