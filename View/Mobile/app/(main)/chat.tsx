/**
 * Route: /(main)/chat
 * 
 * Smart routing for chat feature:
 * 
 * WITHOUT applicationId param:
 * - Entry point from bottom navigation bar
 * - Shows ChatListHub which routes to:
 *   - PreMatchChatList (if user in pre-match stage)
 *   - RelationshipChatList (if user in relationship stage - TODO)
 * 
 * WITH applicationId param:
 * - Direct link to specific chat (e.g., from notification)
 * - Shows ChatScreen for that specific chat
 * 
 * Query params:
 * - applicationId?: Application ID for direct chat access
 */
import { useLocalSearchParams } from 'expo-router';
import { ChatScreen } from '@/CommunicationUI/ChatScreen';
import { ChatListHub } from '@/CommunicationUI/ChatListHub';

export default function ChatRoute() {
  const params = useLocalSearchParams();
  const applicationId = params.applicationId as string | undefined;

  // If applicationId provided, go directly to chat
  if (applicationId) {
    return <ChatScreen />;
  }

  // Otherwise, show chat list hub (routes based on user stage)
  return <ChatListHub />;
}
