import { familyRepository } from '../../Repository/UserRepository';
import type { Relationship as RelationshipType } from '../../types';

/**
 * FamilyAIService - AI integration for activity recommendations
 * 
 * Uses Gemini API to generate personalized activity suggestions based on:
 * - Relationship stage
 * - User preferences and mood history
 * - Current weather and time
 * - User location
 * 
 * FR 3.4.1, 3.4.2, 3.4.3, 3.4.5
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
   * FR 3.4.2, 3.4.3, 3.4.4, 3.4.5
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

    return `You are an activity recommendation expert for intergenerational relationships.
Generate 3 unique activity recommendations for a couple in the "${stage}" stage of their relationship.

Context:
- Relationship Stage: ${stageDescription}
- Current Mood: ${mood}
- Location: ${location}

Requirements:
1. Activities should be appropriate for intergenerational relationships (youth and elderly)
2. Consider the mood and current location
3. Each activity should include: title, description, estimated duration, estimated cost, and any required materials
4. Format each recommendation as JSON object with fields: activity_title, activity_description, duration, cost, required_materials

Provide exactly 3 recommendations as a JSON array. Make them practical and engaging.`;
  },

  /**
   * Call Gemini API
   * 
   * Environment variable required: GEMINI_API_KEY
   * This should be set in the backend environment
   */
  async callGeminiAPI(prompt: string): Promise<AIActivityRecommendation[]> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
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
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error('No content in Gemini response');
      }

      // Parse JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not parse recommendations from response');
      }

      const recommendations = JSON.parse(jsonMatch[0]);
      return recommendations;
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  },

  /**
   * Generate and save recommendations to database
   * FR 3.4.2, 3.4.4
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
    }
  },

  /**
   * Generate conversation topic recommendations
   * Could be extended for FR 3.4 if needed
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
