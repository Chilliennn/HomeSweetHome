// Model/Service/CoreService/ActivityVerificationService.ts

import { supabase } from '../APIService/supabase';

/**
 * AI-powered Activity Verification Service
 * 
 * Analyzes chat messages to verify if topic-based activities have been completed.
 * For example: "Share Future Family Plans" → AI checks if users actually discussed this topic.
 * 
 * Note: Video calls and days together are tracked manually in the database.
 * This AI only verifies TOPIC-BASED activities that require conversation analysis.
 */

// Activity topic keywords - these define what topics need to be discussed
// Keys must match EXACTLY the activity titles in the database
const ACTIVITY_TOPIC_KEYWORDS: Record<string, string[]> = {
    // ========== Getting Acquainted Stage ==========
    'Send unlimited text messages': [], // Not topic-based - tracked by message count
    'Share photos and memories': [], // Not topic-based - tracked by photo uploads
    'Schedule meetups': ['meet', 'meetup', 'schedule', 'coffee', 'lunch', 'dinner', 'visit'],

    // ========== Building Trust Stage ==========
    'Weekly video calls': [], // Not topic-based - tracked by video call count
    'Shared diary entries': [], // Not topic-based - tracked by diary entries
    'Complete trust exercises': [
        'trust', 'believe', 'honest', 'rely on', 'depend on',
        'open up', 'share with you', 'tell you something'
    ],

    // ========== Family Bond Stage ==========
    'One offline meetup (coffee/meal)': [], // Manual verification required
    'Weekly video call for 3 weeks': [], // Not topic-based - tracked by count
    'Help with simple weekly tasks': [
        'help', 'assist', 'support', 'task', 'errand', 'grocery',
        'shopping', 'appointment', 'remind', 'reminder'
    ],

    // ========== Full Adoption Stage (from screenshot) ==========
    'Share Future Family Plans': [
        'future', 'family plan', 'plan', 'together', 'adopt', 'adoption',
        'family', 'grandchild', 'grandchildren', 'generation', 'legacy',
        'hope for', 'looking forward', 'dream', 'wish', 'want to'
    ],
    'Final Long Video Call': [], // Not topic-based - tracked by video call duration
    'Agree & Sign Digital Confirmation': [], // Not topic-based - requires form submission

    // ========== Generic topic activities (may exist in DB) ==========
    'Share about your childhood': [
        'childhood', 'grew up', 'when i was young', 'when i was a kid',
        'my parents', 'my family', 'born', 'raised', 'school', 'hometown'
    ],
    'Discuss your hobbies': [
        'hobby', 'hobbies', 'like to do', 'enjoy', 'fun', 'free time',
        'interest', 'passion', 'love doing', 'favorite activity'
    ],
    'Share favorite memories': [
        'favorite memory', 'remember when', 'best time', 'happiest moment',
        'unforgettable', 'cherish', 'special moment', 'good times'
    ],
    'Discuss family values': [
        'family values', 'important to me', 'believe in', 'tradition',
        'respect', 'honesty', 'trust', 'loyalty', 'generation'
    ],
    'Share life experiences': [
        'experience', 'went through', 'learned', 'life lesson',
        'challenge', 'overcome', 'growth', 'journey'
    ],
    'Discuss future goals': [
        'goal', 'future', 'dream', 'hope', 'plan', 'want to',
        'looking forward', 'wish', 'aspiration'
    ],
    'Share health concerns': [
        'health', 'doctor', 'medicine', 'feeling', 'well-being',
        'exercise', 'diet', 'sleep', 'stress', 'care'
    ],
    'Discuss daily routines': [
        'routine', 'daily', 'morning', 'evening', 'schedule',
        'typical day', 'usually', 'every day'
    ],
};

export interface ActivityVerificationResult {
    activityTitle: string;
    isCompleted: boolean;
    matchedKeywords: string[];
    confidence: number; // 0.0 to 1.0
    messageCount: number;
}

/**
 * Analyze messages to verify if a topic-based activity was completed
 */
export async function verifyActivityCompletion(
    relationshipId: string,
    activityTitle: string,
    lookbackDays: number = 7
): Promise<ActivityVerificationResult> {
    console.log(`[ActivityVerification] Checking: "${activityTitle}" for relationship ${relationshipId}`);

    // Get keywords for this activity
    const keywords = ACTIVITY_TOPIC_KEYWORDS[activityTitle];

    // If no keywords or empty array, this is not a topic-based activity
    if (!keywords || keywords.length === 0) {
        console.log(`[ActivityVerification] "${activityTitle}" is not a topic-based activity (manual tracking)`);
        return {
            activityTitle,
            isCompleted: false,
            matchedKeywords: [],
            confidence: 0,
            messageCount: 0
        };
    }

    // Fetch recent messages for this relationship
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

    const { data: messages, error } = await supabase
        .from('messages')
        .select('content, sent_at')
        .eq('relationship_id', relationshipId)
        .gte('sent_at', cutoffDate.toISOString())
        .not('content', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('[ActivityVerification] Error fetching messages:', error);
        return {
            activityTitle,
            isCompleted: false,
            matchedKeywords: [],
            confidence: 0,
            messageCount: 0
        };
    }

    console.log(`[ActivityVerification] Found ${messages?.length || 0} messages to analyze`);

    // Analyze messages for keyword matches
    const matchedKeywords: string[] = [];
    let totalMatches = 0;

    messages?.forEach(msg => {
        if (!msg.content) return;
        const contentLower = msg.content.toLowerCase();

        keywords.forEach(keyword => {
            if (contentLower.includes(keyword.toLowerCase())) {
                totalMatches++;
                if (!matchedKeywords.includes(keyword)) {
                    matchedKeywords.push(keyword);
                }
            }
        });
    });

    // Calculate confidence based on matches
    // Require at least 2 different keywords and 3+ total matches for high confidence
    const uniqueKeywordRatio = matchedKeywords.length / keywords.length;
    const matchDensity = Math.min(totalMatches / 5, 1); // Cap at 5 matches
    const confidence = (uniqueKeywordRatio * 0.6) + (matchDensity * 0.4);

    // Consider completed if confidence > 0.3 (at least some keyword matches)
    const isCompleted = confidence >= 0.3;

    console.log(`[ActivityVerification] Result for "${activityTitle}":`, {
        isCompleted,
        matchedKeywords,
        confidence: confidence.toFixed(2),
        totalMatches
    });

    return {
        activityTitle,
        isCompleted,
        matchedKeywords,
        confidence,
        messageCount: messages?.length || 0
    };
}

/**
 * Verify all topic-based activities for a relationship's current stage
 */
export async function verifyAllActivities(
    relationshipId: string,
    activities: { id: string; title: string; is_completed: boolean }[]
): Promise<{ verified: ActivityVerificationResult[]; newlyCompleted: string[] }> {
    const results: ActivityVerificationResult[] = [];
    const newlyCompleted: string[] = [];

    for (const activity of activities) {
        // Skip already completed activities
        if (activity.is_completed) {
            continue;
        }

        // Check if this is a topic-based activity (has non-empty keywords)
        const keywords = ACTIVITY_TOPIC_KEYWORDS[activity.title];
        if (!keywords || keywords.length === 0) {
            continue; // Skip non-topic activities
        }

        const result = await verifyActivityCompletion(relationshipId, activity.title);
        results.push(result);

        if (result.isCompleted) {
            newlyCompleted.push(activity.id);
            console.log(`[ActivityVerification] ✅ Activity "${activity.title}" verified as complete!`);
        }
    }

    return { verified: results, newlyCompleted };
}

/**
 * Mark activities as completed in the database
 */
export async function markActivitiesComplete(activityIds: string[]): Promise<void> {
    if (activityIds.length === 0) return;

    console.log(`[ActivityVerification] Marking ${activityIds.length} activities as complete`);

    const { error } = await supabase
        .from('activities')
        .update({
            is_completed: true,
            completed_at: new Date().toISOString()
        })
        .in('id', activityIds);

    if (error) {
        console.error('[ActivityVerification] Error marking activities complete:', error);
        throw error;
    }

    console.log('[ActivityVerification] Activities marked complete successfully');
}

/**
 * Run full verification check - fetches activities, verifies, and marks complete
 */
export async function runActivityVerificationCheck(
    relationshipId: string,
    stage: string
): Promise<{ verified: number; completed: number }> {
    console.log(`[ActivityVerification] Running check for relationship ${relationshipId}, stage: ${stage}`);

    // Fetch activities for this stage
    const { data: activities, error } = await supabase
        .from('activities')
        .select('id, title, is_completed')
        .eq('relationship_id', relationshipId)
        .eq('stage', stage);

    if (error) {
        console.error('[ActivityVerification] Error fetching activities:', error);
        return { verified: 0, completed: 0 };
    }

    if (!activities || activities.length === 0) {
        console.log('[ActivityVerification] No activities found for this stage');
        return { verified: 0, completed: 0 };
    }

    console.log(`[ActivityVerification] Found ${activities.length} activities to check`);

    // Verify and mark complete
    const { verified, newlyCompleted } = await verifyAllActivities(relationshipId, activities);

    if (newlyCompleted.length > 0) {
        await markActivitiesComplete(newlyCompleted);
    }

    return {
        verified: verified.length,
        completed: newlyCompleted.length
    };
}

// Export helper to get available topic activities
export function getTopicBasedActivities(): string[] {
    return Object.entries(ACTIVITY_TOPIC_KEYWORDS)
        .filter(([_, keywords]) => keywords.length > 0)
        .map(([title]) => title);
}
