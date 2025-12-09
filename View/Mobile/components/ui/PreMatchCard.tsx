import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { IconCircle, ProgressBar, Chip, Card, Button } from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================
interface PreMatchStats {
  /** Current day of pre-match (1-14) */
  currentDay: number;
  /** Total allowed days (usually 14) */
  totalDays: number;
  /** Number of messages exchanged */
  messagesExchanged: number;
  /** Number of voice calls made */
  voiceCalls: number;
  /** Days until can apply (0 means ready) */
  daysUntilCanApply: number;
  /** Days remaining in pre-match period */
  daysRemaining: number;
  /** Whether minimum 7-day requirement is met */
  canApply: boolean;
}

interface PreMatchCardProps {
  /** Profile ID for this pre-match */
  id: string;
  /** Name of the elderly/youth */
  name: string;
  /** Avatar emoji */
  avatarEmoji?: string;
  /** Avatar background color */
  avatarColor?: string;
  /** Whether the user is online */
  isOnline?: boolean;
  /** Pre-match statistics */
  stats: PreMatchStats;
  /** Called when "Chat" button is pressed */
  onChat?: () => void;
  /** Called when "View Details" button is pressed (only shown when canApply) */
  onViewDetails?: () => void;
  /** Called when "End" button is pressed */
  onEnd?: () => void;
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// STAT ROW COMPONENT
// ============================================================================
const StatRow: React.FC<{ label: string; value: string | number; valueColor?: string }> = ({
  label,
  value,
  valueColor = '#333',
}) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
  </View>
);

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * PreMatchCard - Card showing pre-match status and stats with a partner
 * 
 * Features:
 * - Avatar with name and day badge
 * - Online indicator
 * - Progress bar showing day progress
 * - Stats: Messages Exchanged, Voice Calls, Days Until Can Apply, Days Remaining
 * - Success banner when 7-day minimum met
 * - Chat and View Details/End buttons
 * 
 * ViewModel bindings needed:
 * - preMatchData: from CommunicationViewModel.preMatches[]
 * - onChat: (preMatchId) => void
 * - onViewDetails: (preMatchId) => void
 * - onEnd: (preMatchId) => void
 * 
 * Usage:
 * ```tsx
 * <PreMatchCard
 *   id="123"
 *   name="Ah Ma Mei"
 *   avatarEmoji="👵"
 *   avatarColor="#D4E5AE"
 *   isOnline={true}
 *   stats={{
 *     currentDay: 8,
 *     totalDays: 14,
 *     messagesExchanged: 23,
 *     voiceCalls: 2,
 *     daysUntilCanApply: 0,
 *     daysRemaining: 6,
 *     canApply: true,
 *   }}
 *   onChat={() => navigateToChat()}
 *   onViewDetails={() => navigateToDetails()}
 * />
 * ```
 */
export const PreMatchCard: React.FC<PreMatchCardProps> = ({
  id,
  name,
  avatarEmoji = '👵',
  avatarColor = '#D4E5AE',
  isOnline = false,
  stats,
  onChat,
  onViewDetails,
  onEnd,
  style,
}) => {
  const progressPercent = (stats.currentDay / stats.totalDays) * 100;

  return (
    <View style={style}>
      <Card style={styles.container}>
      {/* Header: Avatar, Name, Day Badge, Online */}
      <View style={styles.header}>
        <IconCircle
          icon={avatarEmoji}
          size={56}
          backgroundColor={avatarColor}
          contentScale={0.65}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.badgeRow}>
            <Chip
              label={`Day ${stats.currentDay} of ${stats.totalDays}`}
              color="#D4E5AE"
              size="small"
            />
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar
        progress={progressPercent}
        height={8}
        fillColor="#9DE2D0"
        style={styles.progressBar}
      />

      {/* Divider */}
      <View style={styles.divider} />

      {/* Stats */}
      <View style={styles.statsContainer}>
        <StatRow label="Messages Exchanged" value={stats.messagesExchanged} />
        <StatRow label="Voice Calls" value={stats.voiceCalls} />
        <StatRow
          label="Days Until Can Apply"
          value={stats.canApply ? '✓ Ready!' : `${stats.daysUntilCanApply} days`}
          valueColor={stats.canApply ? '#4CAF50' : '#EB8F80'}
        />
        <StatRow label="Days Remaining" value={`${stats.daysRemaining} days`} />
      </View>

      {/* Success Banner (when canApply) */}
      {stats.canApply && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>
            ✅ You've completed the 7-day minimum! You can now submit a formal application.
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={onChat}
          activeOpacity={0.8}
        >
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>

        {stats.canApply ? (
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={onViewDetails}
            activeOpacity={0.8}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.endButton}
            onPress={onEnd}
            activeOpacity={0.8}
          >
            <Text style={styles.endButtonText}>End</Text>
          </TouchableOpacity>
        )}
      </View>
      </Card>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  progressBar: {
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  statsContainer: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: '#9DE2D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chatButton: {
    flex: 1,
    backgroundColor: '#9DE2D0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  viewDetailsButton: {
    flex: 1,
    backgroundColor: '#EB8F80',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  endButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EB8F80',
    alignItems: 'center',
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EB8F80',
  },
});

export default PreMatchCard;
