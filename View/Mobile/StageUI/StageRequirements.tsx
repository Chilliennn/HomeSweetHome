import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { stageViewModel } from '../../../ViewModel/StageViewModel';

export const StageRequirementsScreen = observer(() => {
  const router = useRouter();
  const vm = stageViewModel;

  const getRequirementIcon = (isCompleted: boolean) => {
    if (isCompleted) return '✅';
    return '⏱️';
  };

  const getRequirementStatus = (requirement: any) => {
    if (requirement.is_completed) {
      return `Completed: ${requirement.completed_at || 'Done'}`;
    }
    if (requirement.current_value !== undefined && requirement.required_value !== undefined) {
      return `${requirement.current_value} more ${requirement.current_value === 1 ? 'day' : 'days'} needed`;
    }
    return 'Not started';
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
          <Text style={styles.headerTitle}>Stage Requirements</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stageTitle}>
            Stage {vm.stages.find(s => s.is_current)?.order}: {vm.stages.find(s => s.is_current)?.display_name}
          </Text>

          {vm.requirements.some(r => !r.is_completed) && (
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                Some requirements are still incomplete. See checklist for details.
              </Text>
            </View>
          )}

          <View style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>Requirements Checklist</Text>

            {vm.requirements.map((requirement) => (
              <View key={requirement.id} style={styles.requirementItem}>
                <Text style={styles.requirementIcon}>
                  {getRequirementIcon(requirement.is_completed)}
                </Text>
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementTitle}>{requirement.title}</Text>
                  <Text style={styles.requirementStatus}>
                    {getRequirementStatus(requirement)}
                  </Text>
                </View>
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
  stageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  warningBox: {
    backgroundColor: '#FADE9F',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  requirementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  requirementContent: {
    flex: 1,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requirementStatus: {
    fontSize: 14,
    color: '#666',
  },
});