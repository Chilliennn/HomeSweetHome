import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { UploadImageScreen } from '@/FamilyViewUI';

export default function UploadRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <UploadImageScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
