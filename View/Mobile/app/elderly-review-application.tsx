/**
 * Elderly Review Application Route (Admin Approved)
 * Routes to: /elderly-review-application?applicationId=xxx
 * 
 * This is different from /review-application which handles pending_review status
 * This handles 'approved' status (after admin approval, waiting for elderly decision)
 */
import { ElderlyReviewApplicationScreen } from '@/MatchingUI/ElderlyReviewApplicationScreen';

export default ElderlyReviewApplicationScreen;
