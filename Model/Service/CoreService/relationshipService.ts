import { userRepository } from "../../Repository/UserRepository";
import type { Relationship, User } from "../../types";

/**
 * RelationshipService - Business logic for relationship management
 *
 * Single Responsibility: Handles relationship-related business logic
 * - Checking active relationships
 * - Relationship status queries
 * - No direct database access - uses Repository layer
 */
export const relationshipService = {
  /**
   * Check if user has an active relationship
   */
  async hasActiveRelationship(userId: string): Promise<boolean> {
    const relationship = await userRepository.getActiveRelationship(userId);
    return !!relationship;
  },

  /**
   * Get user's active relationship if exists
   */
  async getActiveRelationship(userId: string): Promise<Relationship | null> {
    return userRepository.getActiveRelationship(userId);
  },

  /**
   * Get user's relationship regardless of status (active, paused, etc.)
   * Used to check if user is in a cooling period
   */
  async getAnyRelationship(userId: string): Promise<Relationship | null> {
    return userRepository.getAnyRelationship(userId);
  },

  /**
   * Get the partner in a relationship
   * @param userId - Current user ID
   * @param relationship - The relationship to check
   * @returns Partner's user ID or null
   */
  getPartnerId(userId: string, relationship: Relationship): string | null {
    if (relationship.youth_id === userId) {
      return relationship.elderly_id;
    }
    if (relationship.elderly_id === userId) {
      return relationship.youth_id;
    }
    return null;
  },

  /**
   * Check if user is the youth in the relationship
   */
  isYouthInRelationship(userId: string, relationship: Relationship): boolean {
    return relationship.youth_id === userId;
  },

  /**
   * Check if user is the elderly in the relationship
   */
  isElderlyInRelationship(userId: string, relationship: Relationship): boolean {
    return relationship.elderly_id === userId;
  },

  /**
   * Get current relationship stage
   */
  getCurrentStage(relationship: Relationship): string {
    return relationship.current_stage;
  },

  /**
   * Check if relationship is in a specific stage
   */
  isInStage(relationship: Relationship, stage: string): boolean {
    return relationship.current_stage === stage;
  },
};
