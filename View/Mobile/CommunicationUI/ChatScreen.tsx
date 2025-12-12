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

// TODO: This will come from StageViewModel in the future
interface FeatureUnlock {
  name: string;
  isUnlocked: boolean;
  stage: number;
}

/**
 * ChatScreen - UC104: Pre-match and relationship chat interface
 * 
 * Features (104_3 design):
 * - Video call and voice call buttons in header
 * - Warning/report button in header
 * - Image and voice message buttons in input area
 * - Stage-based feature unlocks
 * 
 * Architecture:
 * - Observer component (reactive to ViewModel state)
 * - Uses reusable UI components from components/ui
 * - Follows MVVM pattern
 */
export const ChatScreen = observer(function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vm = communicationViewModel;

  const applicationId = params.applicationId as string | undefined;
  const currentUserId = vm.currentUser;
  const currentUserType = vm.currentUserType;

  const [messageInput, setMessageInput] = useState('');
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  // TODO: Get current stage from StageViewModel
  // For now, we'll use mock data based on days passed
  const [currentStage, setCurrentStage] = useState(1);

  // Load chat on mount
  useEffect(() => {
    if (!applicationId) {
      Alert.alert('Error', 'No chat ID provided');
      router.back();
      return;
    }

    if (!currentUserId) {
      Alert.alert('Error', 'User not logged in');
      router.back();
      return;
    }

    vm.openChat(applicationId);

    return () => {
      vm.closeChat();
    };
  }, [applicationId, currentUserId]);

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

  // Show loading state
  if (vm.isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  // Show error state
  if (!vm.currentChat || vm.errorMessage) {
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

  const chat = vm.currentChat;
  const partnerUser = chat.partnerUser;
  const messages = vm.currentChatMessages;

  // Calculate day label
  const applicationDate = new Date(chat.application.applied_at);
  const now = new Date();
  const daysPassed = Math.floor((now.getTime() - applicationDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const dayLabel = `Day ${daysPassed} of 14`;

  // TODO: Replace with actual feature flags from StageViewModel/RelationshipViewModel
  // This is mock data for demonstration
  const features: FeatureUnlock[] = [
    { name: 'Voice', isUnlocked: currentStage >= 1, stage: 1 },
    { name: 'VideoCall', isUnlocked: currentStage >= 2, stage: 2 },
    { name: 'Photo', isUnlocked: currentStage >= 3, stage: 3 },
  ];

  const isVoiceUnlocked = features.find(f => f.name === 'Voice')?.isUnlocked ?? false;
  const isVideoCallUnlocked = features.find(f => f.name === 'VideoCall')?.isUnlocked ?? false;
  const isPhotoUnlocked = features.find(f => f.name === 'Photo')?.isUnlocked ?? false;

  // Handler: Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentUserId) return;

    const content = messageInput.trim();
    setMessageInput(''); // Clear input immediately for better UX

    const receiverId = currentUserType === 'youth'
      ? chat.application.elderly_id
      : chat.application.youth_id;

    console.log('[ChatScreen] Sending message:', {
      currentUserId,
      receiverId,
      content,
      chatContext: vm.currentChatContext,
      applicationId: vm.currentApplicationId,
    });

    const success = await vm.sendTextMessage(
      currentUserId,
      receiverId,
      content
    );

    console.log('[ChatScreen] Send result:', success, 'Error:', vm.errorMessage);

    if (!success) {
      const errorMsg = vm.errorMessage || 'Failed to send message - unknown error';
      Alert.alert('Error', errorMsg);
      vm.clearError();
      setMessageInput(content); // Restore message on error
    }
  };

  // Handler: Voice call (placeholder)
  const handleVoiceCall = () => {
    if (!isVoiceUnlocked) {
      Alert.alert('Feature Locked', 'Voice calls will be unlocked in Stage 1');
      return;
    }
    // TODO: Implement voice call
    Alert.alert('Voice Call', 'Voice call feature coming soon!');
  };

  // Handler: Video call (placeholder)
  const handleVideoCall = () => {
    if (!isVideoCallUnlocked) {
      Alert.alert('Feature Locked', 'Video calls will be unlocked in Stage 2');
      return;
    }
    // TODO: Implement video call
    Alert.alert('Video Call', 'Video call feature coming soon!');
  };

  // Handler: Voice message (placeholder)
  const handleVoiceMessage = () => {
    if (!isVoiceUnlocked) {
      Alert.alert('Feature Locked', 'Voice messages will be unlocked in Stage 1');
      return;
    }
    // TODO: Implement voice recording
    Alert.alert('Voice Message', 'Voice message feature coming soon!');
  };

  // Handler: Photo sharing (placeholder)
  const handlePhotoShare = () => {
    if (!isPhotoUnlocked) {
      Alert.alert('Feature Locked', 'Photo sharing will be unlocked in Stage 3');
      return;
    }
    // TODO: Implement photo sharing
    Alert.alert('Photo Share', 'Photo sharing feature coming soon!');
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

  // Handler: Play voice message (placeholder)
  const handlePlayVoice = (messageId: string) => {
    Alert.alert('Voice Playback', 'Playing voice message...');
  };

  // Render message item using ChatBubble from components/ui
  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.sender_id === currentUserId;
    const timestamp = new Date(item.sent_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <ChatBubble
        type={item.message_type === 'text' ? 'text' : 'voice'}
        content={item.content || undefined}
        voiceDuration={item.call_duration_minutes ? item.call_duration_minutes * 60 : undefined}
        isOwn={isOwn}
        timestamp={timestamp}
        status={item.is_read ? 'read' : 'delivered'}
        onPlayVoice={() => handlePlayVoice(item.id)}
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
                icon={partnerUser.profile_data?.avatar_meta?.type === 'default' ? '👵' : '👤'}
                size={40}
                backgroundColor="#C8ADD6"
                contentScale={0.6}
              />
              <View style={styles.headerText}>
                <Text style={styles.partnerName}>{partnerUser.full_name || 'Partner'}</Text>
                <Text style={styles.dayLabel}>{dayLabel}</Text>
              </View>
            </View>
          </View>

          {/* Call Buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleVoiceCall}
              style={[styles.headerButton, !isVoiceUnlocked && styles.headerButtonLocked]}
            >
              <Image
                source={require('@/assets/images/icon-voiceCall.png')}
                style={styles.headerIcon}
              />
              {!isVoiceUnlocked && (
                <Image
                  source={require('@/assets/images/icon-lock.png')}
                  style={styles.miniLockIcon}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleVideoCall}
              style={[styles.headerButton, !isVideoCallUnlocked && styles.headerButtonLocked]}
            >
              <Image
                source={require('@/assets/images/icon-videoCall.png')}
                style={styles.headerIcon}
              />
              {!isVideoCallUnlocked && (
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
          <View style={styles.inputRow}>
            {/* Voice Message Button */}
            <TouchableOpacity
              onPress={handleVoiceMessage}
              style={[styles.inputActionButton, !isVoiceUnlocked && styles.inputActionButtonLocked]}
            >
              <Image
                source={require('@/assets/images/icon-voice.png')}
                style={styles.inputActionIcon}
              />
              {!isVoiceUnlocked && (
                <Image
                  source={require('@/assets/images/icon-lock.png')}
                  style={styles.miniLockIconInput}
                />
              )}
            </TouchableOpacity>

            {/* Photo/Image Button */}
            <TouchableOpacity
              onPress={handlePhotoShare}
              style={[styles.inputActionButton, !isPhotoUnlocked && styles.inputActionButtonLocked]}
            >
              <Image
                source={require('@/assets/images/icon-image.png')}
                style={styles.inputActionIcon}
              />
              {!isPhotoUnlocked && (
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
});

export default ChatScreen;
