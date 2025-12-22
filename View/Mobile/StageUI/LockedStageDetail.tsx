import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { stageViewModel } from '../../../ViewModel/StageViewModel';

export const LockedStageDetailScreen = observer(() => {
  const router = useRouter();
  const vm = stageViewModel;

  if (!vm.lockedStageDetails) {
    return null;
  }

  const { title, description, unlock_message, preview_requirements } = vm.lockedStageDetails;
  const stageNumber = vm.stages.find(s => s.stage === vm.selectedLockedStage)?.order || 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top','bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              vm.closeLockedStageDetail();
              router.back();
            }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Stage Indicator */}
          <View style={styles.stageRow}>
            {vm.stages.map((stage, index) => (
              <React.Fragment key={stage.stage}>
                <View
                  style={[
                    styles.stageDot,
                    stage.is_completed && styles.stageDotCompleted,
                    stage.is_current && styles.stageDotCurrent,
                    stage.stage === vm.selectedLockedStage && styles.stageDotSelected
                  ]}
                >
                  {stage.is_completed ? (
                    <Text style={styles.stageDotText}>✓</Text>
                  ) : (
                    <Text style={[
                      styles.stageDotNumber,
                      (stage.is_current || stage.stage === vm.selectedLockedStage) && styles.stageDotNumberActive
                    ]}>
                      {stage.order}
                    </Text>
                  )}
                </View>
                {index < vm.stages.length - 1 && <View style={styles.stageConnector} />}
              </React.Fragment>
            ))}
          </View>

          <View style={styles.stageLabelRow}>
            {vm.stages.map((stage) => (
              <Text 
                key={stage.stage} 
                style={[
                  styles.stageLabel,
                  stage.stage === vm.selectedLockedStage && styles.stageLabelActive
                ]}
                numberOfLines={2}
              >
                {stage.display_name}
              </Text>
            ))}
          </View>

          {/* Lock Icon */}
          <View style={styles.lockIconContainer}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Stage {stageNumber}: {title}</Text>

          {/* Description */}
          <Text style={styles.description}>{description}</Text>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{unlock_message}</Text>
          </View>

          {/* Preview Section */}
          <Text style={styles.previewTitle}>What&apos;s Next in Stage {stageNumber}:</Text>
          
          <View style={styles.previewList}>
            {preview_requirements.map((item, index) => (
              <View key={index} style={styles.previewItem}>
                <View style={styles.previewDot} />
                <Text style={styles.previewText}>{item}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
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
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stageDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageDotCompleted: {
    backgroundColor: '#9DE2D0',
  },
  stageDotCurrent: {
    backgroundColor: '#9DE2D0',
  },
  stageDotSelected: {
    backgroundColor: '#C8ADD6',
  },
  stageDotText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  stageDotNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  stageDotNumberActive: {
    color: '#FFFFFF',
  },
  stageConnector: {
    width: 30,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  stageLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  stageLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: 2,
  },
  stageLabelActive: {
    fontWeight: '600',
    color: '#333',
  },
  lockIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  lockIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#FADE9F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  previewList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9DE2D0',
    marginRight: 12,
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});