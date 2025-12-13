import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Image,
} from 'react-native';
import { VoiceBubble } from './VoiceBubble';
import type { VoicePlayback } from '@/hooks/useAudioPlayer';

// ============================================================================
// TYPES
// ============================================================================
type MessageType = 'text' | 'voice';
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

interface ChatBubbleProps {
  /** Type of message */
  type?: MessageType;
  /** Message content (for text messages) */
  content?: string;
  /** Voice playback state (for voice messages) */
  voicePlayback?: VoicePlayback;
  /** Whether this message is from the current user */
  isOwn: boolean;
  /** Timestamp string (e.g., "10:30 AM") */
  timestamp: string;
  /** Message delivery status (only shown for own messages) */
  status?: MessageStatus;
  /** Whether the message has been read by receiver */
  isRead?: boolean;
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const getStatusIcon = (status: MessageStatus, isRead: boolean): { text: string; color: string } => {
  if (status === 'sending') {
    return { text: '○', color: '#999' };
  }
  if (status === 'sent') {
    return { text: '✓', color: '#999' };
  }
  if (isRead) {
    // Double check, blue for read
    return { text: '✓✓', color: '#34B7F1' };
  }
  // Delivered but not read
  return { text: '✓✓', color: '#999' };
};

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * ChatBubble - A chat message bubble supporting text and voice messages
 * 
 * Features:
 * - Text messages with left/right alignment
 * - Voice note messages with VoiceBubble component
 * - Timestamp display
 * - Delivery status with read receipts (✓✓ blue when read)
 * 
 * ViewModel bindings needed:
 * - message: from CommunicationViewModel.messages[]
 * - voicePlayback: from useAudioPlayer.getPlaybackForMessage()
 * 
 * Usage:
 * ```tsx
 * // Text message
 * <ChatBubble
 *   type="text"
 *   content="Hello!"
 *   isOwn={true}
 *   timestamp="10:30 AM"
 *   status="read"
 *   isRead={true}
 * />
 * 
 * // Voice message
 * <ChatBubble
 *   type="voice"
 *   voicePlayback={playback}
 *   isOwn={true}
 *   timestamp="10:40 AM"
 *   status="delivered"
 *   isRead={false}
 * />
 * ```
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({
  type = 'text',
  content,
  voicePlayback,
  isOwn,
  timestamp,
  status,
  isRead = false,
  style,
}) => {
  const bubbleStyle = [
    styles.bubble,
    isOwn ? styles.ownBubble : styles.otherBubble,
    style,
  ];

  const renderContent = () => {
    if (type === 'voice' && voicePlayback) {
      return <VoiceBubble playback={voicePlayback} isOwn={isOwn} />;
    }

    return (
      <Text style={[styles.content, isOwn && styles.ownContent]}>
        {content}
      </Text>
    );
  };

  const statusInfo = status ? getStatusIcon(status, isRead) : null;

  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      <View style={bubbleStyle}>
        {renderContent()}
      </View>

      <View style={[styles.metaRow, isOwn && styles.ownMetaRow]}>
        <Text style={styles.timestamp}>{timestamp}</Text>
        {isOwn && statusInfo && (
          <>
            <Text style={styles.metaDot}> </Text>
            <Text style={[styles.status, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    marginVertical: 4,
    alignSelf: 'flex-start',
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: '#9DE2D0',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 4,
  },
  content: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  ownContent: {
    color: '#333',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ownMetaRow: {
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  metaDot: {
    fontSize: 11,
    color: '#999',
  },
  status: {
    fontSize: 11,
  },
});

export default ChatBubble;
