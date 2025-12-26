import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { communicationViewModel } from '@home-sweet-home/viewmodel';
import { PreMatchChatList } from './PreMatchChatList';

export const ChatListHub = observer(function ChatListHub() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vm = communicationViewModel;

  const currentUserId = vm.currentUser;
  const currentUserType = vm.currentUserType;

  // Track if we've checked expired for THIS focus cycle
  const hasCheckedExpired = useRef(false);
  const hasRedirectedToRelationship = useRef(false);
  const [isLoadingFresh, setIsLoadingFresh] = useState(true);

  console.log('[ChatListHub] Render - isLoadingFresh:', isLoadingFresh, 'hasCheckedExpired:', hasCheckedExpired.current);

  useFocusEffect(
    useCallback(() => {
      console.log('[ChatListHub] useFocusEffect - screen focused, loading fresh data...');

      if (!currentUserId || !currentUserType) {
        router.replace('/login');
        return;
      }

      // Reset flags for fresh check on each focus
      hasCheckedExpired.current = false;
      hasRedirectedToRelationship.current = false;
      setIsLoadingFresh(true);

      // Load fresh data
      const loadData = async () => {
        console.log('[ChatListHub] loadData START');
        await vm.loadActiveChats();
        await vm.checkActiveRelationship();
        console.log('[ChatListHub] loadData COMPLETE - hasActiveRelationship:', vm.hasActiveRelationship);

        // Check if should redirect to relationship chat IMMEDIATELY after loading
        if (vm.hasActiveRelationship && vm.currentRelationship && !hasRedirectedToRelationship.current) {
          hasRedirectedToRelationship.current = true;
          console.log('[ChatListHub] Redirecting to relationship chat immediately');
          router.replace(`/(main)/chat?relationshipId=${vm.currentRelationship.id}`);
          return; // Don't set isLoadingFresh to false, keep showing loading until redirect
        }

        console.log('[ChatListHub] No relationship, setting isLoadingFresh=false');
        setIsLoadingFresh(false);
      };
      loadData();

      // Cleanup function (optional)
      return () => {
        console.log('[ChatListHub] useFocusEffect cleanup - screen unfocused');
      };
    }, [currentUserId, currentUserType])
  );

  useEffect(() => {
    console.log('[ChatListHub] useEffect[relationship] - hasActiveRelationship:', vm.hasActiveRelationship, 'isLoadingFresh:', isLoadingFresh, 'hasRedirected:', hasRedirectedToRelationship.current);
    if (vm.hasActiveRelationship && vm.currentRelationship && !isLoadingFresh && !hasRedirectedToRelationship.current) {
      hasRedirectedToRelationship.current = true;
      console.log('[ChatListHub] Redirecting to relationship chat');
      router.replace(`/(main)/chat?relationshipId=${vm.currentRelationship.id}`);
    }
  }, [vm.hasActiveRelationship, vm.currentRelationship, isLoadingFresh]);

  useEffect(() => {
    console.log('[ChatListHub] useEffect[expired] - isLoadingFresh:', isLoadingFresh, 'hasCheckedExpired:', hasCheckedExpired.current, 'userType:', currentUserType);
    // Only redirect youth users to expired decision screen
    // Wait until fresh data is loaded
    if (!isLoadingFresh && !hasCheckedExpired.current && !vm.hasActiveRelationship && currentUserType === 'youth') {
      hasCheckedExpired.current = true;

      const expiredChat = vm.getFirstExpiredChat();
      console.log('[ChatListHub] Checking expired chat:', expiredChat?.application?.id, 'status:', expiredChat?.application?.status);
      // Only redirect to expired screen if status is still pre_chat_active
      // If pending_review or approved, youth already submitted - show chat list normally
      if (expiredChat && expiredChat.application.status === 'pre_chat_active') {
        console.log('[ChatListHub] Found expired pre-match for youth, redirecting to decision screen');
        router.replace({
          pathname: '/pre-match-expired',
          params: { applicationId: expiredChat.application.id }
        } as any);
      } else {
        console.log('[ChatListHub] No redirect needed - status is:', expiredChat?.application?.status || 'no expired chat');
      }
    }
  }, [isLoadingFresh, vm.hasActiveRelationship, currentUserType]);

  if (isLoadingFresh) {
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