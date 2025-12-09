import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  IconCircle,
  Card,
  Button,
} from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================
interface InterestSentProps {
  /** Name of the elderly person interest was sent to */
  elderlyName: string;
  /** Called when "Browse More Profiles" button is pressed */
  onBrowseMore?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * InterestSent - Confirmation screen shown after expressing interest
 * 
 * Features:
 * - Success icon (heart icon)
 * - Confirmation message with elderly name
 * - "What's Next?" info card explaining next steps
 * - "Browse More Profiles" button
 * 
 * Usage:
 * ```tsx
 * <InterestSent
 *   elderlyName="Ah Ma Mei"
 *   onBrowseMore={() => navigateToBrowse()}
 * />
 * ```
 */
export const InterestSent: React.FC<InterestSentProps> = ({
  elderlyName,
  onBrowseMore,
}) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconSection}>
          <IconCircle
            icon="💕"
            size={100}
            backgroundColor="#EB8F80"
            contentScale={0.5}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Interest Sent!</Text>

        {/* Message */}
        <Text style={styles.message}>
          Your interest has been send to{' '}
          <Text style={styles.nameHighlight}>{elderlyName}</Text>. They will
          review your profile and respond within 24 hours
        </Text>

        {/* What's Next Card */}
        <Card style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.clockIcon}>⏰</Text>
            <Text style={styles.cardTitle}>What's Next?</Text>
          </View>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                {elderlyName} will receive your interest notification
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                They can view your profile and decide
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                You'll be notified of their response
              </Text>
            </View>
          </View>
        </Card>

        {/* Browse More Button */}
        <Button
          title="Browse More Profiles"
          onPress={onBrowseMore ?? (() => {})}
          variant="primary"
          style={styles.browseButton}
        />
      </View>
    </SafeAreaView>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  nameHighlight: {
    fontWeight: '700',
    color: '#333',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#FADE9F',
    padding: 20,
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clockIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  browseButton: {
    width: '100%',
    backgroundColor: '#9DE2D0',
  },
});

export default InterestSent;
