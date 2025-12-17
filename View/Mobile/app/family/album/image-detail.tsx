import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { ImageDetailScreen } from '@/FamilyViewUI';

export default function ImageDetailRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <ImageDetailScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
