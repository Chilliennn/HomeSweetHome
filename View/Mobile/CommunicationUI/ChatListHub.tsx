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
    // Load active chats AND check for relationship
    vm.loadActiveChats();
    vm.checkActiveRelationship();
  }, [currentUserId]);

  // ✅ Handle relationship redirect in separate effect
  useEffect(() => {
    if (vm.hasActiveRelationship && vm.currentRelationship && vm.hasLoadedOnce) {
      router.replace(`/(main)/chat?relationshipId=${vm.currentRelationship.id}`);
    }
  }, [vm.hasActiveRelationship, vm.currentRelationship, vm.hasLoadedOnce]);

  // ✅ Show loading only when first loading (not loaded once yet)
  // This prevents infinite loading when activePreMatchChats is empty
  if (vm.isLoading && !vm.hasLoadedOnce) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EB8F80" />
      </View>
    );
  }

  // For users in pre-match stage (all chat-accessible statuses)
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
