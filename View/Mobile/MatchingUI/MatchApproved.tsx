import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageSourcePropType } from 'react-native';
import {
  Header,
  Button,
  Card,
  IconCircle,
  Chip,
} from '../components/ui';

// ============================================================================
// TYPES
// ============================================================================
interface MatchApprovedProps {
  /** Elderly's display name */
  elderlyName?: string;
  /** Elderly's age */
  elderlyAge?: number;
  /** Elderly's location */
  elderlyLocation?: string;
  /** Elderly's avatar image */
  elderlyAvatarSource?: ImageSourcePropType;
  /** Elderly's avatar emoji (fallback) */
  elderlyAvatarEmoji?: string;
  /** Elderly's interests */
  elderlyInterests?: Array<{ label: string; color?: string }>;
  /** Callback when back is pressed */
  onBack?: () => void;
  /** Callback when Confirm Match is pressed */
  onConfirmMatch?: () => void;
  /** Callback when Need More Time is pressed */
  onNeedMoreTime?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * MatchApproved - Screen shown when elderly approves the formal application
 * 
 * Displays elderly info and asks youth to confirm the match.
 * Lists what happens after confirmation.
 * 
 * ViewModel bindings needed:
 * - elderlyProfile: ElderlyProfile (from MatchingViewModel.approvedMatch.elderly)
 * - onBack: () => void (navigation back)
 * - onConfirmMatch: () => void (calls MatchingViewModel.confirmMatch)
 * - onNeedMoreTime: () => void (calls MatchingViewModel.requestMoreTime)
 * - isConfirming: boolean (from MatchingViewModel.isConfirming)
 */
export const MatchApproved: React.FC<MatchApprovedProps> = ({
  elderlyName = 'Ah Ma Mei',
  elderlyAge = 68,
  elderlyLocation = 'Penang',
  elderlyAvatarSource,
  elderlyAvatarEmoji = '👵',
  elderlyInterests = [
    { label: 'Cooking', color: '#9DE2D0' },
    { label: 'Gardening', color: '#D4E5AE' },
  ],
  onBack,
  onConfirmMatch,
  onNeedMoreTime,
}) => {
  // TODO: Replace with ViewModel bindings
  // const { approvedMatch, isConfirming } = matchingViewModel;

  const afterConfirmationItems = [
    'Real identities will be revealed',
    'Stage 1: Getting to Know begins',
    'More features will unlock',
    'A Family Advisor will be assigned',
  ];

  return (
    <View style={styles.container}>
      <Header title="" onBack={onBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Match Icon */}
        <View style={styles.iconContainer}>
          <IconCircle
            icon="🤝"
            size={100}
            backgroundColor="#9DE2D0"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Match Approved!</Text>

        {/* Description */}
        <Text style={styles.description}>
          <Text style={styles.boldText}>{elderlyName}</Text> has approved your
          application! Please confirm to officially begin your companionship
          journey.
        </Text>

        {/* Elderly Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <IconCircle
              icon={elderlyAvatarSource ? undefined : elderlyAvatarEmoji}
              imageSource={elderlyAvatarSource}
              size={64}
              backgroundColor="#C8ADD6"
              contentScale={0.65}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{elderlyName}</Text>
              <Text style={styles.profileDetails}>
                {elderlyAge} years • {elderlyLocation}
              </Text>
              <View style={styles.interestsRow}>
                {elderlyInterests.map((interest, index) => (
                  <Chip
                    key={index}
                    label={interest.label}
                    color={interest.color}
                    size="small"
                    style={styles.chip}
                  />
                ))}
              </View>
            </View>
          </View>
        </Card>

        {/* After Confirmation Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 After Confirmation</Text>
          {afterConfirmationItems.map((item, index) => (
            <Text key={index} style={styles.infoItem}>
              • {item}
            </Text>
          ))}
        </Card>

        {/* Action Buttons */}
        <Button
          title="Confirm Match"
          onPress={onConfirmMatch || (() => {})}
          style={styles.confirmButton}
          // TODO: loading={isConfirming}
        />

        <Button
          title="Need More Time"
          variant="outline"
          onPress={onNeedMoreTime || (() => {})}
          style={styles.moreTimeButton}
          // TODO: disabled={isConfirming}
        />
      </ScrollView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  boldText: {
    fontWeight: '700',
    color: '#333',
  },
  profileCard: {
    width: '100%',
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#9DE2D0',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    marginRight: 4,
  },
  infoCard: {
    width: '100%',
    padding: 20,
    marginBottom: 24,
    backgroundColor: '#FADE9F',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#555',
    lineHeight: 24,
    marginLeft: 4,
  },
  confirmButton: {
    width: '100%',
    marginBottom: 12,
  },
  moreTimeButton: {
    width: '100%',
  },
});

export default MatchApproved;
