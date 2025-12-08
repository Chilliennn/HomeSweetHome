import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { stageViewModel } from '../../../ViewModel/StageViewModel';
import { FeatureLockModal } from '../components/ui/FeatureLockModal';

export const AvailableFeaturesScreen = observer(() => {
  const router = useRouter();
  const vm = stageViewModel;

  useEffect(() => {
    vm.loadAllFeatures();
  }, [vm]);

  const getFeatureIcon = (featureKey: string): string => {
    const icons: Record<string, string> = {
      text: '💬',
      video_call: '📹',
      photo_share: '📷',
      diary: '📓',
      scheduling: '📅',
      home_visits: '🏠'
    };
    return icons[featureKey] || '✨';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Available Features</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Unlocked Features */}
          {vm.unlockedFeatures.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.checkIcon}>✅</Text>
                <Text style={styles.sectionTitle}>Unlocked Features</Text>
              </View>

              <View style={styles.card}>
                {vm.unlockedFeatures.map((feature, index) => (
                  <View
                    key={feature.key}
                    style={[
                      styles.featureItem,
                      index < vm.unlockedFeatures.length - 1 && styles.featureItemBorder
                    ]}
                  >
                    <Text style={styles.featureIcon}>{getFeatureIcon(feature.key)}</Text>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureName}>{feature.name}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Locked Features */}
          {vm.lockedFeatures.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.sectionTitle}>Locked Features</Text>
              </View>

              <View style={styles.card}>
                {vm.lockedFeatures.map((feature, index) => (
                  <TouchableOpacity
                    key={feature.key}
                    style={[
                      styles.featureItem,
                      index < vm.lockedFeatures.length - 1 && styles.featureItemBorder
                    ]}
                    onPress={() => vm.handleFeatureClick(feature)}
                  >
                    <Text style={styles.featureIcon}>{getFeatureIcon(feature.key)}</Text>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureName}>{feature.name}</Text>
                      <Text style={styles.unlockMessage}>{feature.unlock_message}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <FeatureLockModal
          visible={vm.showFeatureLockModal}
          featureName={vm.selectedFeature?.name || ''}
          unlockMessage={vm.selectedFeature?.unlock_message || ''}
          unlockStage={vm.selectedFeature?.unlock_stage ? 
            vm.stages.find(s => s.stage === vm.selectedFeature?.unlock_stage)?.display_name || '' 
            : ''}
          onClose={() => vm.closeFeatureLockModal()}
          onViewRequirements={() => {
            vm.closeFeatureLockModal();
            router.push('/(main)/stageRequirements');
          }}
        />
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9DE2D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  lockIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  featureItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  unlockMessage: {
    fontSize: 13,
    color: '#EB8F80',
    fontStyle: 'italic',
  },
});