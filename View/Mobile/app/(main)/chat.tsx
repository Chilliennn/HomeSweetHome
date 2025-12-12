/**
 * Route: /(main)/chat
 * 
 * Smart routing for chat feature:
 * 
 * WITHOUT applicationId or relationshipId param:
 * - Entry point from bottom navigation bar
 * - Shows ChatListHub which routes to:
 *   - PreMatchChatList (if user in pre-match stage)
 *   - RelationshipChat (if user has active relationship)
 * 
 * WITH applicationId param:
 * - Direct link to specific pre-match chat
 * - Shows ChatScreen for that specific application
 * 
 * WITH relationshipId param:
 * - Direct link to relationship chat
 * - Shows ChatScreen for that relationship with stage-based features
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

  // If ID provided, go directly to chat (pre-match or relationship)
  if (applicationId || relationshipId) {
    return <ChatScreen />;
  }

  // Otherwise, show chat list hub (routes based on user stage)
  return <ChatListHub />;
}
