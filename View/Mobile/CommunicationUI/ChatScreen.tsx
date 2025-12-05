import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconCircle } from '@/components/ui';
import { ChatBubble } from '@/components/ui/ChatBubble';

// ============================================================================
// TYPES
// ============================================================================
type MessageType = 'text' | 'voice';
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

interface ChatMessage {
  id: string;
  type: MessageType;
  content?: string;
  voiceDuration?: number;
  isOwn: boolean;
  timestamp: string;
  status?: MessageStatus;
}

interface ChatScreenProps {
  /** Pre-match or relationship ID */
  chatId?: string;
  /** Name of the chat partner */
  partnerName: string;
  /** Partner's avatar emoji */
  partnerAvatarEmoji?: string;
  /** Partner's avatar color */
  partnerAvatarColor?: string;
  /** Whether partner is online */
  isOnline?: boolean;
  /** Current day in pre-match (e.g., "Day 3 of 14") */
  dayLabel?: string;
  /** Chat messages */
  messages?: ChatMessage[];
  /** Called when back button is pressed */
  onBack?: () => void;
  /** Called when more options (⋮) is pressed */
  onMoreOptions?: () => void;
  /** Called when send button is pressed */
  onSendMessage?: (message: string) => void;
  /** Called when voice record button is pressed */
  onStartVoiceRecord?: () => void;
  /** Called when voice message play button is pressed */
  onPlayVoice?: (messageId: string) => void;
}

// ============================================================================
// MOCK DATA - For UI demonstration
// ============================================================================
const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    type: 'text',
    content: "Hello! I'm so happy you reached out. I love to share cooking recipes! 😊",
    isOwn: false,
    timestamp: '10:30 AM',
  },
  {
    id: '2',
    type: 'text',
    content: "Hi Ah Ma! Thank you for accepting. I'd love to learn your traditional recipes! 🍲",
    isOwn: true,
    timestamp: '10:32 AM',
    status: 'read',
  },
  {
    id: '3',
    type: 'text',
    content: "That's wonderful! What kind of dishes do you like?",
    isOwn: false,
    timestamp: '10:35 AM',
  },
  {
    id: '4',
    type: 'text',
    content: 'I love Nyonya food! Especially laksa and kuih.',
    isOwn: true,
    timestamp: '10:36 AM',
    status: 'read',
  },
  {
    id: '5',
    type: 'voice',
    voiceDuration: 83,
    isOwn: true,
    timestamp: '10:40 AM',
    status: 'delivered',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * ChatScreen - Full chat interface for pre-match communication
 * 
 * Features:
 * - Chat header with partner info and online status
 * - Messages list (text and voice bubbles)
 * - Message input with send and voice record buttons
 * - Day counter for pre-match period
 * 
 * ViewModel bindings needed:
 * - messages: ChatMessage[] (from CommunicationViewModel.currentChat.messages)
 * - partnerInfo: from CommunicationViewModel.currentChat.partner
 * - onSendMessage: (text) => void (sends text message)
 * - onStartVoiceRecord: () => void (starts voice recording)
 * - onPlayVoice: (id) => void (plays voice message)
 * 
 * Usage:
 * ```tsx
 * <ChatScreen
 *   chatId="123"
 *   partnerName="Ah Ma Mei"
 *   partnerAvatarEmoji="👵"
 *   partnerAvatarColor="#C8ADD6"
 *   isOnline={true}
 *   dayLabel="Day 3 of 14"
 *   messages={communicationViewModel.messages}
 *   onBack={() => navigation.goBack()}
 *   onSendMessage={(msg) => communicationViewModel.sendMessage(msg)}
 * />
 * ```
 */
export const ChatScreen: React.FC<ChatScreenProps> = ({
  chatId,
  partnerName,
  partnerAvatarEmoji = '👵',
  partnerAvatarColor = '#C8ADD6',
  isOnline = false,
  dayLabel = 'Day 3 of 14',
  messages = MOCK_MESSAGES,
  onBack,
  onMoreOptions,
  onSendMessage,
  onStartVoiceRecord,
  onPlayVoice,
}) => {
  // Local state for input (this is View-layer UI state, not business data)
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage?.(inputText.trim());
      setInputText('');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <ChatBubble
      type={item.type}
      content={item.content}
      voiceDuration={item.voiceDuration}
      isOwn={item.isOwn}
      timestamp={item.timestamp}
      status={item.status}
      onPlayVoice={() => onPlayVoice?.(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <IconCircle
          icon={partnerAvatarEmoji}
          size={44}
          backgroundColor={partnerAvatarColor}
          contentScale={0.65}
        />

        <View style={styles.headerInfo}>
          <Text style={styles.partnerName}>{partnerName}</Text>
          <View style={styles.statusRow}>
            {isOnline && <View style={styles.onlineIndicator} />}
            <Text style={styles.statusText}>
              {isOnline ? 'Online' : 'Offline'} • {dayLabel}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={onMoreOptions}
          activeOpacity={0.7}
        >
          <Text style={styles.moreIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        inverted={false}
      />

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={styles.voiceButton}
            onPress={onStartVoiceRecord}
            activeOpacity={0.7}
          >
            <Text style={styles.voiceIcon}>🎙️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            activeOpacity={0.7}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 18,
    color: '#FFF',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  partnerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: '#666',
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreIcon: {
    fontSize: 24,
    color: '#666',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFDF5',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
    minHeight: 44,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C8ADD6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  voiceIcon: {
    fontSize: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EB8F80',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  sendIcon: {
    fontSize: 18,
    color: '#FFF',
  },
});

export default ChatScreen;
