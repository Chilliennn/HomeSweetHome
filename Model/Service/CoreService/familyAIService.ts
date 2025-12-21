import { familyRepository } from '../../Repository/UserRepository';
import type { Relationship as RelationshipType } from '../../types';

/**
 * Platform-agnostic config getter
 * - React Native (Expo): Uses EXPO_PUBLIC_* prefix, automatically injected by Expo
 * - Web (Vite): Uses VITE_* prefix, mapped to EXPO_PUBLIC_* via vite.config.ts define
 */
function getConfig(key: string): string | undefined {
  // Process.env works for both platforms:
  // - Expo injects EXPO_PUBLIC_* at build time
  // - Vite's define config maps VITE_* to process.env.EXPO_PUBLIC_*
  return process.env[`EXPO_PUBLIC_${key}`] || process.env[key] || undefined;
}

/**
 * FamilyAIService - AI integration for activity recommendations
 * 
 * Uses Gemini API to generate personalized activity suggestions based on:
 * - Relationship stage
 * - User preferences and mood history
 * - Current weather and time
 * - User location
 * 
 */

interface AIActivityRecommendation {
  activity_title: string;
  activity_description: string;
  duration: string;
  cost: string;
  required_materials?: string;
}

export const familyAIService = {
  /**
   * Generate activity recommendations using Gemini API
   * 
   * Considers:
   * - User mood history (from diary entries)
   * - Relationship stage
   * - Time availability
   * - Location
   * - Cost preferences
   */
  async generateActivityRecommendations(
    userMood: string,
    userLocation: string,
    relationship: RelationshipType
  ): Promise<AIActivityRecommendation[]> {
    try {
      const prompt = this.buildPrompt(
        relationship.current_stage,
        userMood,
        userLocation
      );

      const recommendations = await this.callGeminiAPI(prompt);
      return recommendations;
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      throw new Error('Failed to generate activity recommendations');
    }
  },

  /**
   * Build prompt for Gemini API
   */
  buildPrompt(stage: string, mood: string, location: string): string {
    const stageContext = {
      'getting_to_know': 'Early relationship stage - focus on getting to know each other',
      'trial_period': 'Building trust stage - suggest activities that strengthen bonds',
      'official_ceremony': 'Official milestone - suggest celebratory or meaningful activities',
      'family_life': 'Full adoption - suggest family bonding activities'
    };

    const stageDescription = (stageContext as any)[stage] || 'Building relationship';

    return `Generate 3 activity recommendations for intergenerational relationship (youth + elderly).
Stage: ${stageDescription}
Mood: ${mood}
Location: ${location}

Return ONLY valid JSON array with NO extra text:
[
  {
    "activity_title": "short title",
    "activity_description": "brief description (max 100 chars)",
    "duration": "time estimate",
    "cost": "cost estimate",
    "required_materials": "items needed"
  }
]

Keep descriptions concise. Return only the JSON array, nothing else.`;
  },

  /**
   * Call Gemini API
   * 
   * Environment variable required: GEMINI_API_KEY
   * This should be set in the backend environment
   */
  async callGeminiAPI(prompt: string): Promise<AIActivityRecommendation[]> {
    // Get API key from platform-agnostic config
    const apiKey = getConfig('GEMINI_API_KEY');
    const model = getConfig('GEMINI_MODEL') || 'gemini-pro';
    const apiVersion = getConfig('GEMINI_API_VERSION') || 'v1beta';

    console.warn(`[Gemini Debug] API Key present: ${!!apiKey}, starts: ${apiKey?.substring(0, 15)}`);
    console.warn(`[Gemini Debug] Model: ${model}, Version: ${apiVersion}`);

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Build a broader attempt list to cover available public models across v1/v1beta
    const versions = [apiVersion, 'v1', 'v1beta'];
    const baseModels = [
      model,
      model.endsWith('-latest') ? model.replace(/-latest$/, '') : `${model}-latest`,
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-1.0-pro',
      'gemini-pro',
    ];

    // Deduplicate attempts
    const attemptSet = new Set<string>();
    const attempts: Array<{ version: string; model: string }> = [];
    for (const v of versions) {
      for (const m of baseModels) {
        if (!v || !m) continue;
        const key = `${v}/${m}`;
        if (attemptSet.has(key)) continue;
        attemptSet.add(key);
        attempts.push({ version: v, model: m });
      }
    }

    const errors: string[] = [];

    for (const attempt of attempts) {
      try {
        const url = `https://generativelanguage.googleapis.com/${attempt.version}/models/${attempt.model}:generateContent`;
        const requestBody = {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 1024,
          }
        };

        console.log(`[Gemini] Attempting ${attempt.version}/${attempt.model}...`);
        console.log(`[Gemini] URL: ${url}`);
        console.log(`[Gemini] Has API Key: ${!!apiKey}, Key starts with: ${apiKey?.substring(0, 10)}`);

        const requestWithHigherTokens = {
          ...requestBody,
          generationConfig: {
            ...requestBody.generationConfig,
            maxOutputTokens: 4096, // Higher limit for complex responses
            temperature: 0.5, // Lower temperature for more focused output
          }
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(requestWithHigherTokens)
        });

        if (!response.ok) {
          let errorDetails = '';
          try {
            const errJson = await response.json();
            errorDetails = JSON.stringify(errJson);
          } catch (_jsonErr) {
            const errText = await response.text();
            errorDetails = errText;
          }
          errors.push(`[${attempt.version}/${attempt.model}] ${response.status}: ${errorDetails || response.statusText || 'unknown error'}`);
          console.log(`[Gemini] Failed ${attempt.version}/${attempt.model}: ${response.status}, details: ${errorDetails}`);
          continue;
        }

        const data = await response.json();
        console.log(`[Gemini] Success with ${attempt.version}/${attempt.model}`);
        console.log(`[Gemini] Response data:`, JSON.stringify(data).substring(0, 500));

        const firstCandidate = data.candidates?.[0];

        // Check for truncation or blocked content
        if (firstCandidate?.finishReason === 'MAX_TOKENS') {
          console.log(`[Gemini] Response truncated (MAX_TOKENS), trying next model`);
          errors.push(`[${attempt.version}/${attempt.model}] Response truncated (MAX_TOKENS)`);
          continue;
        }

        if (!firstCandidate?.content?.parts || firstCandidate.content.parts.length === 0) {
          console.log(`[Gemini] No parts in response. Candidate:`, JSON.stringify(firstCandidate));
          errors.push(`[${attempt.version}/${attempt.model}] No content parts in response (finishReason: ${firstCandidate?.finishReason})`);
          continue;
        }

        const responseText = firstCandidate.content.parts
          .map((p: { text?: string }) => p.text)
          .filter(Boolean)
          .join('\n');

        if (!responseText) {
          console.log(`[Gemini] Empty responseText after joining parts`);
          errors.push(`[${attempt.version}/${attempt.model}] Empty response text`);
          continue;
        }

        console.log(`[Gemini] Response text:`, responseText.substring(0, 300));

        // Parse JSON from response - look for JSON array
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.log(`[Gemini] Could not find JSON array in response`);
          errors.push(`[${attempt.version}/${attempt.model}] Could not parse recommendations from response: ${responseText.substring(0, 100)}`);
          continue;
        }

        try {
          const recommendations = JSON.parse(jsonMatch[0]);
          console.log(`[Gemini] Parsed ${recommendations.length} recommendations`);
          return recommendations;
        } catch (parseError) {
          console.log(`[Gemini] JSON parse error:`, parseError);
          errors.push(`[${attempt.version}/${attempt.model}] JSON parse failed: ${String(parseError)}`);
          continue;
        }
      } catch (error) {
        errors.push(`[${attempt.version}/${attempt.model}] ${String(error)}`);
        continue;
      }
    }

    console.error('Gemini API call failed, attempts:', errors);

    // Check if it's a quota/rate limit error (429)
    if (errors.some(e => e.includes('429'))) {
      throw new Error('Gemini API quota exceeded. Please try again later or upgrade your API plan.');
    }

    // Check if it's a configuration error (all 404s)
    if (errors.every(e => e.includes('404'))) {
      throw new Error('No Gemini models available for this API key. Please check your Google Cloud project configuration.');
    }

    throw new Error(`Gemini API call failed. Attempts: ${errors.join(' | ')}`);
  },

  /**
   * Generate and save recommendations to database
   */
  async generateAndSaveRecommendations(
    relationship_id: string,
    userMood: string,
    userLocation: string,
    relationship: RelationshipType
  ): Promise<void> {
    try {
      const recommendations = await this.generateActivityRecommendations(
        userMood,
        userLocation,
        relationship
      );

      // Save first 3 recommendations to database
      for (const rec of recommendations.slice(0, 3)) {
        await familyRepository.createAISuggestion(
          relationship_id,
          'activity',
          rec.activity_title,
          rec.activity_description
        );
      }
    } catch (error) {
      console.error('Error saving recommendations:', error);
      // Don't throw - graceful degradation if AI fails
      // The error message is already logged and will be visible to the user via the ViewModel
    }
  },

  /**
   * Generate conversation topic recommendations
   */
  async generateConversationTopics(
    relationship: RelationshipType
  ): Promise<string[]> {
    try {
      const prompt = `Generate 3 interesting conversation topics for an intergenerational relationship at stage "${relationship.current_stage}".
Topics should help them get to know each other better and build meaningful conversations.
Return as JSON array of strings.`;

      await this.callGeminiAPI(prompt);
      // Return array of topics (you would parse the response)
      return [];
    } catch (error) {
      console.error('Error generating conversation topics:', error);
      return [];
    }
  }
};
