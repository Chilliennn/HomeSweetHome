import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { familyViewModel } from '@home-sweet-home/viewmodel';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Header } from '@/components/ui/Header';

/**
 * AIRecommendationsScreen - View and use AI activity suggestions
 * 
 * UC-303: AI Activity Recommendation
 * Displays AI-generated activity suggestions
 * Allows accepting suggestions to pre-fill event creation
 * Shows up to 3 recommendations
 * 
 */
export const AIRecommendationsScreen = observer(() => {
  const router = useRouter();
  const { aiRecommendations, currentRelationship, isGeneratingRecommendations, errorMessage, successMessage } = familyViewModel;

  useEffect(() => {
    // Load AI recommendations on mount
    if (currentRelationship) {
      familyViewModel.loadAIRecommendations(currentRelationship.id);
    }
  }, [currentRelationship?.id]);

  const handleRefreshRecommendations = async () => {
    if (!currentRelationship) return;
    await familyViewModel.generateNewRecommendations(
      currentRelationship.id,
      'neutral',
      'Current Location'
    );
  };

  const handleUseRecommendation = (suggestionId: string) => {
    if (!currentRelationship) return;

    // Use recommendation to create event
    const suggestion = aiRecommendations.find(s => s.id === suggestionId);
    if (!suggestion) return;

    // Create event with recommendation details
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ✅ MVVM: Use familyViewModel.currentUserId (synced from Layout)
    const userId = familyViewModel.currentUserId;
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    familyViewModel.useAIRecommendation(
      suggestionId,
      currentRelationship.id,
      userId,
      tomorrow.toISOString().split('T')[0],
      '14:00'
    );
  };

  const handleDismissRecommation = async (suggestionId: string) => {
    if (!currentRelationship) return;
    
    // Mark suggestion as dismissed (using the same backend method as "used")
    await familyViewModel.dismissAIRecommendation(suggestionId);
  };

  return (
    <View style={styles.container}>
      <Header
        title="AI Activity Suggestions"
        showBackButton={true}
      />

      {errorMessage && (
        <AlertBanner
          type="error"
          message={errorMessage}
          onDismiss={() => familyViewModel.clearError()}
        />
      )}

      {successMessage && (
        <AlertBanner
          type="success"
          message={successMessage}
          onDismiss={() => familyViewModel.clearSuccessMessage()}
        />
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Section */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.description}>
            Based on your relationship stage and preferences, here are some activity suggestions to strengthen your bond.
          </ThemedText>
        </View>

        {/* Refresh Button */}
        <View style={styles.actionSection}>
          <Button
            title={isGeneratingRecommendations ? 'Generating...' : 'Generate New Suggestions'}
            onPress={handleRefreshRecommendations}
            loading={isGeneratingRecommendations}
            variant="outline"
          />
        </View>

        {/* Recommendations List */}
        {isGeneratingRecommendations && aiRecommendations.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9DE2D0" />
            <ThemedText style={styles.loadingText}>
              Generating personalized recommendations...
            </ThemedText>
          </View>
        ) : aiRecommendations.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>🤔</ThemedText>
            <ThemedText style={styles.emptyText}>
              No suggestions yet. Try generating new recommendations!
            </ThemedText>
          </View>
        ) : (
          <View style={styles.recommendationsContainer}>
            <ThemedText style={styles.recommendationsTitle}>
              {aiRecommendations.length} Suggestions
            </ThemedText>

            {aiRecommendations.map((suggestion, index) => (
              <View key={suggestion.id} style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <ThemedText style={styles.recommendationNumber}>
                    {index + 1}
                  </ThemedText>
                  <View style={styles.recommendationTitleSection}>
                    <ThemedText style={styles.recommendationTitle}>
                      {suggestion.activity_title}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.recommendationDescription}>
                  {suggestion.activity_description}
                </ThemedText>

                <View style={styles.recommendationDetails}>
                  {suggestion.activity_description && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Details:</ThemedText>
                      <ThemedText style={styles.detailValue} numberOfLines={2}>
                        {suggestion.activity_description}
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.recommendationActions}>
                  <Button
                    title="Use Activity"
                    onPress={() => handleUseRecommendation(suggestion.id)}
                    variant="primary"
                  />
                  <Button
                    title="Not Now"
                    onPress={() => handleDismissRecommation(suggestion.id)}
                    variant="outline"
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <ThemedText style={styles.tipsTitle}>💡 Tips</ThemedText>
          <ThemedText style={styles.tipItem}>
            • These suggestions are personalized based on your relationship stage
          </ThemedText>
          <ThemedText style={styles.tipItem}>
            • Activities are designed for intergenerational bonding
          </ThemedText>
          <ThemedText style={styles.tipItem}>
            • Your feedback helps improve future recommendations
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    backgroundColor: '#F0F8F6',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#9DE2D0',
    padding: 12,
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#11181C',
    lineHeight: 20,
  },
  actionSection: {
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    color: '#687076',
    fontSize: 14,
  },
  recommendationsContainer: {
    marginBottom: 32,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#9DE2D0',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9DE2D0',
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: '600',
    marginRight: 12,
  },
  recommendationTitleSection: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#687076',
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationDetails: {
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 12,
    color: '#687076',
    lineHeight: 18,
  },
  recommendationActions: {
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#687076',
    fontSize: 16,
  },
  tipsSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FADE9F',
    padding: 12,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 13,
    color: '#687076',
    lineHeight: 18,
    marginBottom: 6,
  },
});
