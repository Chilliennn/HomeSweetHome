import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  Alert,
  Image,
  Keyboard,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { communicationViewModel } from '@home-sweet-home/viewmodel';
import { IconCircle, ChatBubble } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useVoiceUpload } from '@/hooks/useVoiceUpload';

/**
 * ChatScreen - UC104: Pre-match and relationship chat interface
 * 
 * Features (104_3 design):
 * - Video call and voice call buttons in header (stage-locked)
 * - Warning/report button in header
 * - Image and voice message buttons in input area (stage-locked photo sharing)
 * - Stage-based feature unlocks for relationship chats
 * 
 * Architecture:
 * - Observer component (reactive to ViewModel state)
 * - Uses reusable UI components from components/ui
 * - Follows MVVM pattern
 * - Supports both pre-match (applicationId) and relationship (relationshipId) contexts
 */
export const ChatScreen = observer(function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vm = communicationViewModel;

  const applicationId = params.applicationId as string | undefined;
  const relationshipId = params.relationshipId as string | undefined;
  const currentUserId = vm.currentUser;
  const currentUserType = vm.currentUserType;

  const [messageInput, setMessageInput] = useState('');
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  // Voice recording, playback, and upload hooks
  const { isRecording, duration: recordingDuration, startRecording, stopRecording, cancelRecording } = useVoiceRecording();
  const audioPlayer = useAudioPlayer();
  const { uploadVoiceMessage } = useVoiceUpload();

  // Load chat on mount (pre-match or relationship)
  useEffect(() => {
    if (!currentUserId) {
      Alert.alert('Error', 'User not logged in');
      router.back();
      return;
    }

    if (relationshipId) {
      // Load relationship chat
      vm.openRelationshipChat(relationshipId);
    } else if (applicationId) {
      // Load pre-match chat
      vm.openChat(applicationId);
    } else {
      Alert.alert('Error', 'No chat ID provided');
      router.back();
      return;
    }

    return () => {
      vm.closeChat();
    };
  }, [applicationId, relationshipId, currentUserId]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        Animated.timing(keyboardHeight, {
          toValue: e.endCoordinates.height,
          duration: Platform.OS === 'ios' ? e.duration : 250,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? e.duration : 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Auto-send when recording hits 2 minute limit (must be before early returns)
  useEffect(() => {
    const sendVoiceMessage = async () => {
      if (isRecording && recordingDuration >= 120) {
        await handleVoiceSend();
        Alert.alert(
          'Recording Limit',
          'Voice messages are limited to 2 minutes. Your message has been sent.',
          [{ text: 'OK' }]
        );
      }
    };
    sendVoiceMessage();
  }, [isRecording, recordingDuration]);

  // Show loading state
  if (vm.isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  // Show error state
  if ((!vm.currentChat && !vm.currentRelationship) || vm.errorMessage) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>💬</Text>
        <Text style={styles.errorTitle}>
          {vm.errorMessage || 'Chat not found'}
        </Text>
        <Text style={styles.errorSubtitle}>
          This chat may have ended or you don't have permission to view it.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get chat context (pre-match or relationship)
  const chat = vm.currentChat;
  const relationship = vm.currentRelationship;
  const isRelationshipChat = vm.currentChatContext === 'relationship';

  // Get partner based on context
  const partnerUser = isRelationshipChat
    ? (relationship?.youth_id === currentUserId ? relationship?.elderly : relationship?.youth)
    : chat?.partnerUser;

  const messages = vm.currentChatMessages;

  // Calculate day label or stage info
  let headerInfo = '';
  if (isRelationshipChat && relationship) {
    // Show relationship stage
    const stageNames = {
      getting_to_know: 'Stage 1: Getting Acquainted',
      trial_period: 'Stage 2: Building Trust',
      official_ceremony: 'Stage 3: Official Ceremony',
      family_life: 'Stage 4: Family Life',
    };
    headerInfo = stageNames[relationship.current_stage] || relationship.current_stage;
  } else if (chat) {
    // Show pre-match day count
    const applicationDate = new Date(chat.application.applied_at);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - applicationDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    headerInfo = `Day ${daysPassed} of 14`;
  }

  // ✅ Real stage-based feature unlocking
  const getFeatureUnlocks = (stage: string | null): Record<string, boolean> => {
    if (!stage) {
      // Pre-match: only text and voice messages, no calls or photo sharing
      return {
        voiceCall: false,
        videoCall: false,
        photoSharing: false,
      };
    }

    switch (stage) {
      case 'getting_to_know':
        // Stage 1: Voice Call unlocked
        return {
          voiceCall: true,
          videoCall: false,
          photoSharing: false,
        };
      case 'trial_period':
        // Stage 2: + Video Call
        return {
          voiceCall: true,
          videoCall: true,
          photoSharing: false,
        };
      case 'official_ceremony':
      case 'family_life':
        // Stage 3+: + Photo Sharing (All features)
        return {
          voiceCall: true,
          videoCall: true,
          photoSharing: true,
        };
      default:
        return {
          voiceCall: false,
          videoCall: false,
          photoSharing: false,
        };
    }
  };

  const features = getFeatureUnlocks(relationship?.current_stage || null);

  // Handler: Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentUserId || !partnerUser) return;

    const content = messageInput.trim();
    setMessageInput(''); // Clear input immediately

    const receiverId = partnerUser.id;

    const success = await vm.sendTextMessage(
      currentUserId,
      receiverId,
      content
    );

    if (!success) {
      Alert.alert('Error', 'Failed to send message');
      setMessageInput(content);
    }
  };

  // Handler: Voice call
  const handleVoiceCall = () => {
    if (!features.voiceCall) {
      handleLockedFeature('Voice Call', 'getting_to_know');
      return;
    }
    Alert.alert('Voice Call', 'Voice call feature coming soon!');
  };

  // Handler: Video call
  const handleVideoCall = () => {
    if (!features.videoCall) {
      handleLockedFeature('Video Call', 'trial_period');
      return;
    }
    Alert.alert('Video Call', 'Video call feature coming soon!');
  };

  // Handle voice message send
  const handleVoiceSend = async () => {
    if (isSendingVoice) return;
    setIsSendingVoice(true);

    try {
      const result = await stopRecording();
      if (!result || !result.uri) {
        Alert.alert('Recording Error', 'Failed to record voice message. Please try again.');
        return;
      }

      // Determine typed context for upload
      const uploadContext = vm.currentChatContext === 'preMatch' && vm.currentApplicationId
        ? { type: 'preMatch' as const, applicationId: vm.currentApplicationId }
        : vm.currentRelationshipId
          ? { type: 'relationship' as const, relationshipId: vm.currentRelationshipId }
          : null;

      if (!uploadContext) {
        Alert.alert('Error', 'No active chat context');
        return;
      }

      // Upload to Supabase Storage
      const mediaUrl = await uploadVoiceMessage(result.uri, uploadContext, currentUserId!);

      // Send via ViewModel
      const success = await vm.sendVoiceMessage(mediaUrl, result.durationSeconds);

      if (!success) {
        Alert.alert('Error', vm.errorMessage || 'Failed to send voice message');
      }
    } catch (error) {
      console.error('[ChatScreen] Voice message error:', error);
      Alert.alert('Error', 'Failed to send voice message. Please try again.');
    } finally {
      setIsSendingVoice(false);
    }
  };

  // Simple tap-to-toggle voice recording: tap once to start, tap again to stop and send
  const handleVoicePress = async () => {
    if (isRecording) {
      // Currently recording - stop and send
      await handleVoiceSend();
    } else {
      // Not recording - start recording
      await startRecording();
    }
  };

  // Handler: Photo sharing
  const handlePhotoShare = () => {
    if (!features.photoSharing) {
      handleLockedFeature('Photo Sharing', 'official_ceremony');
      return;
    }
    Alert.alert('Photo Share', 'Photo sharing feature coming soon!');
  };

  // Handler: Locked feature alert
  const handleLockedFeature = (featureName: string, requiredStage: string) => {
    const stageNames: Record<string, string> = {
      getting_to_know: 'Stage 1: Getting Acquainted',
      trial_period: 'Stage 2: Building Trust',
      official_ceremony: 'Stage 3: Official Ceremony',
      family_life: 'Stage 4: Family Life',
    };

    Alert.alert(
      `${featureName} Locked 🔒`,
      `This feature will be unlocked in ${stageNames[requiredStage]}.`,
      [{ text: 'OK' }]
    );
  };

  // Handler: Report/Warning
  const handleReport = () => {
    Alert.alert(
      'Report Issue',
      'What would you like to report?',
      [
        {
          text: 'Inappropriate Content',
          onPress: () => {
            // TODO: Navigate to report screen
            Alert.alert('Report', 'Report inappropriate content feature coming soon!');
          }
        },
        {
          text: 'Safety Concern',
          onPress: () => {
            // TODO: Navigate to safety report
            Alert.alert('Report', 'Safety concern report feature coming soon!');
          },
          style: 'destructive'
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Render message item using ChatBubble from components/ui
  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.sender_id === currentUserId;
    const timestamp = new Date(item.sent_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Get voice playback state for voice messages
    const voicePlayback = item.message_type === 'voice' && item.media_url
      ? audioPlayer.getPlaybackForMessage(item.id, item.media_url, item.call_duration_minutes || 0)
      : undefined;

    return (
      <ChatBubble
        type={item.message_type === 'text' ? 'text' : 'voice'}
        content={item.content || undefined}
        voicePlayback={voicePlayback}
        isOwn={isOwn}
        timestamp={timestamp}
        status={item.is_read ? 'read' : 'delivered'}
        isRead={item.is_read}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <View style={styles.headerRow}>
              <IconCircle
                icon={partnerUser?.profile_data?.avatar_meta?.type === 'default' ? '👵' : '👤'}
                size={40}
                backgroundColor="#C8ADD6"
                contentScale={0.6}
              />
              <View style={styles.headerText}>
                <Text style={styles.partnerName}>{partnerUser?.full_name || 'Partner'}</Text>
                <Text style={styles.dayLabel}>{headerInfo}</Text>
              </View>
            </View>
          </View>

          {/* Call Buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleVoiceCall}
              style={[styles.headerButton, !features.voiceCall && styles.headerButtonLocked]}
            >
              <Image
                source={require('@/assets/images/icon-voiceCall.png')}
                style={styles.headerIcon}
              />
              {!features.voiceCall && (
                <Image
                  source={require('@/assets/images/icon-lock.png')}
                  style={styles.miniLockIcon}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleVideoCall}
              style={[styles.headerButton, !features.videoCall && styles.headerButtonLocked]}
            >
              <Image
                source={require('@/assets/images/icon-videoCall.png')}
                style={styles.headerIcon}
              />
              {!features.videoCall && (
                <Image
                  source={require('@/assets/images/icon-lock.png')}
                  style={styles.miniLockIcon}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleReport} style={styles.headerButton}>
              <Image
                source={require('@/assets/images/icon-warning.png')}
                style={styles.headerIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          data={messages}
          extraData={messages.length}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* Input Area */}
        <Animated.View style={[styles.inputContainer, { marginBottom: keyboardHeight }]}>
          {/* Recording overlay - shown when recording */}
          {isRecording ? (
            <View style={styles.recordingOverlay}>
              {/* Recording info */}
              <View style={styles.recordingInfo}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingDurationText}>
                  {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                </Text>
              </View>

              {/* Recording text */}
              <Text style={styles.recordingText}>Recording...</Text>

              {/* Cancel button (trash icon) */}
              <TouchableOpacity
                onPress={cancelRecording}
                style={styles.cancelRecordingButton}
              >
                <Image
                  source={require('@/assets/images/icon-bin.png')}
                  style={styles.cancelRecordingIcon}
                />
              </TouchableOpacity>

              {/* Send button */}
              <TouchableOpacity
                onPress={handleVoicePress}
                style={[
                  styles.voiceButtonHold,
                  isSendingVoice && styles.voiceButtonSending,
                ]}
              >
                {isSendingVoice ? (
                  <Text style={styles.sendingIndicator}>...</Text>
                ) : (
                  <Text style={styles.sendButtonIcon}>➤</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputRow}>
              {/* Voice Message Button - tap to start recording */}
              <TouchableOpacity
                onPress={handleVoicePress}
                style={[
                  styles.inputActionButton,
                  isSendingVoice && styles.inputActionButtonSending,
                ]}
              >
                {isSendingVoice ? (
                  <Text style={styles.sendingIndicator}>...</Text>
                ) : (
                  <Image
                    source={require('@/assets/images/icon-voice.png')}
                    style={styles.inputActionIcon}
                  />
                )}
              </TouchableOpacity>

              {/* Photo/Image Button */}
              <TouchableOpacity
                onPress={handlePhotoShare}
                style={[styles.inputActionButton, !features.photoSharing && styles.inputActionButtonLocked]}
              >
                <Image
                  source={require('@/assets/images/icon-image.png')}
                  style={styles.inputActionIcon}
                />
                {!features.photoSharing && (
                  <Image
                    source={require('@/assets/images/icon-lock.png')}
                    style={styles.miniLockIconInput}
                  />
                )}
              </TouchableOpacity>

              {/* Text Input */}
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor="#999"
                value={messageInput}
                onChangeText={setMessageInput}
                multiline
                maxLength={1000}
              />

              {/* Send Button */}
              <TouchableOpacity
                onPress={handleSendMessage}
                style={[
                  styles.sendButton,
                  !messageInput.trim() && styles.sendButtonDisabled,
                ]}
                disabled={!messageInput.trim()}
              >
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },
  contentContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
    padding: 32,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: Colors.light.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF',
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
    fontSize: 20,
    color: '#000000',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dayLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerButtonLocked: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
  },
  headerIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  miniLockIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  inputActionButtonLocked: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
  },
  inputActionIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  miniLockIconInput: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    resizeMode: 'contain',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendIcon: {
    fontSize: 18,
    color: '#FFF',
  },
  // Voice Recording Styles
  inputActionButtonRecording: {
    backgroundColor: '#EB8F80',
    minWidth: 80,
    paddingHorizontal: 12,
  },
  inputActionButtonSending: {
    backgroundColor: '#CCC',
    opacity: 0.7,
  },
  sendingIndicator: {
    fontSize: 16,
    color: '#666',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
  recordingDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  // Hold-to-Record Overlay Styles
  recordingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDurationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  voiceButtonHold: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonSending: {
    backgroundColor: '#CCC',
    opacity: 0.7,
  },
  recordingText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#FF0000',
    fontWeight: '500',
  },
  cancelRecordingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelRecordingIcon: {
    width: 20,
    height: 20,
    tintColor: '#FF3B30',
  },
  sendButtonIcon: {
    fontSize: 20,
    color: '#FFF',
  },
});

export default ChatScreen;
