import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';

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
  /** Voice note duration in seconds (for voice messages) */
  voiceDuration?: number;
  /** Whether this message is from the current user */
  isOwn: boolean;
  /** Timestamp string (e.g., "10:30 AM") */
  timestamp: string;
  /** Message delivery status (only shown for own messages) */
  status?: MessageStatus;
  /** Called when voice play button is pressed */
  onPlayVoice?: () => void;
  /** Whether voice is currently playing */
  isVoicePlaying?: boolean;
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}.${secs.toString().padStart(2, '0')}`;
};

const getStatusText = (status: MessageStatus): string => {
  switch (status) {
    case 'sending':
      return 'Sending...';
    case 'sent':
      return 'Sent';
    case 'delivered':
      return 'Delivered';
    case 'read':
      return 'Read';
    default:
      return '';
  }
};

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * ChatBubble - A chat message bubble supporting text and voice messages
 * 
 * Features:
 * - Text messages with left/right alignment
 * - Voice note messages with play button and waveform
 * - Timestamp display
 * - Delivery status for own messages
 * 
 * ViewModel bindings needed:
 * - message: from CommunicationViewModel.messages[]
 * - onPlayVoice: () => void (triggers voice playback)
 * 
 * Usage:
 * ```tsx
 * // Text message from other user
 * <ChatBubble
 *   type="text"
 *   content="Hello! How are you?"
 *   isOwn={false}
 *   timestamp="10:30 AM"
 * />
 * 
 * // Voice message from current user
 * <ChatBubble
 *   type="voice"
 *   voiceDuration={83}
 *   isOwn={true}
 *   timestamp="10:40 AM"
 *   status="delivered"
 *   onPlayVoice={() => playVoiceNote()}
 * />
 * ```
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({
  type = 'text',
  content,
  voiceDuration = 0,
  isOwn,
  timestamp,
  status,
  onPlayVoice,
  isVoicePlaying = false,
  style,
}) => {
  const bubbleStyle = [
    styles.bubble,
    isOwn ? styles.ownBubble : styles.otherBubble,
    style,
  ];

  const renderContent = () => {
    if (type === 'voice') {
      return (
        <View style={styles.voiceContainer}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={onPlayVoice}
            activeOpacity={0.7}
          >
            <Text style={styles.playIcon}>{isVoicePlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          
          {/* Voice Waveform Placeholder */}
          <View style={styles.waveformContainer}>
            {Array.from({ length: 20 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.waveformBar,
                  { height: 8 + Math.random() * 16 },
                ]}
              />
            ))}
          </View>
          
          <Text style={[styles.duration, isOwn && styles.ownDuration]}>
            {formatDuration(voiceDuration)}
          </Text>
        </View>
      );
    }

    return (
      <Text style={[styles.content, isOwn && styles.ownContent]}>
        {content}
      </Text>
    );
  };

  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      <View style={bubbleStyle}>
        {renderContent()}
      </View>
      
      <View style={[styles.metaRow, isOwn && styles.ownMetaRow]}>
        <Text style={styles.timestamp}>{timestamp}</Text>
        {isOwn && status && (
          <>
            <Text style={styles.metaDot}> • </Text>
            <Text style={styles.status}>{getStatusText(status)}</Text>
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
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playIcon: {
    fontSize: 14,
    color: '#333',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    gap: 2,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#333',
    borderRadius: 1.5,
    opacity: 0.5,
  },
  duration: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  ownDuration: {
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
    color: '#9DE2D0',
  },
});

export default ChatBubble;
