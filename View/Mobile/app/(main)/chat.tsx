/**
 * Route: /(main)/chat
 * 
 * Smart routing for chat feature:
 * 
 * WITHOUT params:
 * - Entry point from bottom navigation bar
 * - Shows ChatListHub which routes to:
 *   - PreMatchChatList (if user in pre-match stage)
 *   - Redirects with relationshipId (if user has relationship)
 * 
 * WITH applicationId param:
 * - Direct link to pre-match chat (e.g., from notification)
 * - Shows ChatScreen for that specific pre-match chat
 * 
 * WITH relationshipId param:
 * - Direct link to relationship chat
 * - Shows ChatScreen for that relationship
 * 
 * Query params:
 * - applicationId?: Application ID for pre-match chat access
 * - relationshipId?: Relationship ID for relationship chat access
 */
import { useLocalSearchParams } from 'expo-router';
import { ChatScreen } from '@/CommunicationUI/ChatScreen';
import { ChatListHub } from '@/CommunicationUI/ChatListHub';

export default function ChatRoute() {
  const params = useLocalSearchParams();
  const applicationId = params.applicationId as string | undefined;
  const relationshipId = params.relationshipId as string | undefined;

  // If applicationId or relationshipId provided, go directly to chat
  if (applicationId || relationshipId) {
    return <ChatScreen />;
  }

  // Otherwise, show chat list hub (routes based on user stage)
  return <ChatListHub />;
}
