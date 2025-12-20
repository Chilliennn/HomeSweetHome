// Model/Service/CoreService/ContentFilterService.ts

/**
 * Content Filter Service
 * 
 * Filters and blocks harmful, inappropriate, or abusive content from being sent in messages.
 * This is a safety feature to protect users from harassment and abuse.
 */

// List of blocked words/phrases - will be matched case-insensitively
const BLOCKED_WORDS: string[] = [
    // Violence & threats
    'kill', 'murder', 'die', 'death threat',

    // Sexual content & abuse
    'rape', 'naked', 'nude', 'sex', 'porn', 'pedophile', 'molest',

    // Profanity & slurs
    'fuck', 'fucking', 'fucked', 'fucker',
    'shit', 'bullshit', 'bitch', 'asshole', 'bastard',
    'cunt', 'dick', 'cock', 'pussy',
    'whore', 'slut', 'hoe',

    // Hate speech
    'nigger', 'nigga', 'faggot', 'retard', 'retarded',

    // Self-harm
    'suicide', 'kill myself', 'kill yourself',

    // Harassment
    'stalk', 'stalking', 'harass', 'blackmail',

    // Abuse indicators
    'abuse', 'abuser', 'abusive', 'beat you', 'hit you', 'hurt you',
];

export interface ContentFilterResult {
    isBlocked: boolean;
    blockedWord?: string;
    reason?: string;
}

/**
 * Normalize text for comparison - handles evasion attempts
 */
function normalizeText(text: string): string {
    let normalized = text.toLowerCase();

    // Step 1: Remove all spaces, dots, dashes, underscores (catches "f u c k", "f.u.c.k", "f-u-c-k")
    normalized = normalized.replace(/[\s\.\-_]+/g, '');

    // Step 2: Replace common character substitutions
    const substitutions: { [key: string]: string } = {
        '@': 'a',
        '4': 'a',
        '3': 'e',
        '1': 'i',
        '!': 'i',
        '|': 'i',
        '0': 'o',
        '$': 's',
        '5': 's',
        '7': 't',
        '+': 't',
    };

    for (const [sub, char] of Object.entries(substitutions)) {
        // Escape special regex characters
        const escapedSub = sub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        normalized = normalized.replace(new RegExp(escapedSub, 'g'), char);
    }

    // Step 3: Collapse repeated characters (fuuuuck -> fuck, but keep 'oo' in 'cool')
    // Only collapse if more than 2 of the same character
    normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');

    // Step 4: Final collapse to single char for matching (fuuck -> fuck)
    normalized = normalized.replace(/(.)\1+/g, '$1');

    return normalized;
}

/**
 * Check if message contains blocked content
 */
export function filterMessage(message: string): ContentFilterResult {
    if (!message || message.trim().length === 0) {
        return { isBlocked: false };
    }

    // Normalize both the message and check against normalized blocked words
    const normalizedMessage = normalizeText(message);

    for (const blockedWord of BLOCKED_WORDS) {
        const normalizedBlockedWord = normalizeText(blockedWord);

        // Check if normalized message contains the normalized blocked word
        if (normalizedMessage.includes(normalizedBlockedWord)) {
            console.log(`[ContentFilter] Blocked word detected: "${blockedWord}" in normalized: "${normalizedMessage}"`);
            return {
                isBlocked: true,
                blockedWord: blockedWord,
                reason: 'This message contains inappropriate content and cannot be sent.',
            };
        }
    }

    // Also check the original lowercase message for multi-word phrases
    const originalLower = message.toLowerCase();
    for (const blockedWord of BLOCKED_WORDS) {
        if (originalLower.includes(blockedWord.toLowerCase())) {
            console.log(`[ContentFilter] Blocked word detected (original): "${blockedWord}"`);
            return {
                isBlocked: true,
                blockedWord: blockedWord,
                reason: 'This message contains inappropriate content and cannot be sent.',
            };
        }
    }

    return { isBlocked: false };
}

/**
 * Get a user-friendly error message
 */
export function getBlockedMessageAlert(): string {
    return 'Your message contains content that violates our community guidelines and cannot be sent. Please revise your message.';
}

/**
 * Add a word to the blocked list (for dynamic updates)
 */
export function addBlockedWord(word: string): void {
    if (!BLOCKED_WORDS.includes(word.toLowerCase())) {
        BLOCKED_WORDS.push(word.toLowerCase());
    }
}

/**
 * Check if the content filter is enabled
 */
export function isContentFilterEnabled(): boolean {
    return true; // Always enabled for safety
}
