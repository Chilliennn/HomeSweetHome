/**
 * Route: /(main)/pre-match-started
 * UC101_5: Confirmation screen when elderly accepts youth's interest
 * 
 * This route file only re-exports the PreMatchStarted from MatchingUI.
 * All UI and logic are contained in MatchingUI/PreMatchStarted.tsx
 * 
 * Query params:
 * - matchId: Application ID of the accepted pre-match
 */
export { PreMatchStarted as default } from '@/MatchingUI';
