import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { AlbumScreen } from '@/FamilyViewUI';

export default function FamilyAlbumRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <AlbumScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
