import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { communicationViewModel } from '@home-sweet-home/viewmodel';
import { authViewModel } from '@home-sweet-home/viewmodel';
import { PreMatchChatList } from './PreMatchChatList';

/**
 * ChatListHub - Smart router for chat lists
 * 
 * Routes to appropriate chat list based on user's relationship stage:
 * - Pre-match stage: Show PreMatchChatList (from applications table)
 * - Relationship stage: Show RelationshipChatList (from relationships table)
 * 
 * This is the default entry point when user clicks chat icon in bottom nav bar
 * 
 * Navigation bar → /(main)/chat (no params) → ChatListHub → correct chat list
 */
export const ChatListHub = observer(function ChatListHub() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vm = communicationViewModel;

  const currentUserId = vm.currentUser;
  const currentUserType = vm.currentUserType;

  useEffect(() => {
    if (!currentUserId || !currentUserType) {
      router.replace('/login');
      return;
    }
    // Load active chats to determine user's stage
    vm.loadActiveChats();
  }, [currentUserId]);

  // Show loading while checking user's chats
  if (vm.isLoading && vm.activePreMatchChats.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EB8F80" />
      </View>
    );
  }

  // TODO: When relationship stage is implemented, add logic here:
  // if (user has active relationship in relationships table) {
  //   return <RelationshipChatList />;
  // }

  // For now, always show PreMatchChatList
  // This handles users in pre-match stage (applications with status='pre_chat_active')
  return <PreMatchChatList />;
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
  },
});

export default ChatListHub;
