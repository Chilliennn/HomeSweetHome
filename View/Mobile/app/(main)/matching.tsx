/**
 * Route: /(main)/matching
 * Main matching interface for browsing and expressing interest
 * 
 * This route file only re-exports the MatchingScreenComponent from MatchingUI.
 * All UI and logic are contained in MatchingUI/MatchingScreen.tsx
 * 
 * Query params:
 * - userId: User ID
 * - userName: User display name
 * - userType: 'youth' | 'elderly'
 * - isFirstTime: 'true' if first time after profile completion (shows walkthrough)
 */
export { MatchingScreenComponent as default } from '@/MatchingUI';
