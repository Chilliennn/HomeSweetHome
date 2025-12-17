import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { CreateEventScreen } from '@/FamilyViewUI';

export default function CreateEventRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <CreateEventScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
