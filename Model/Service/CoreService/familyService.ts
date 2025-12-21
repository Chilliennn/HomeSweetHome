import { familyRepository } from '../../Repository/UserRepository';
import { relationshipRepository } from '../../Repository/UserRepository/relationshipRepository';
import { notificationRepository } from '../../Repository/UserRepository/notificationRepository';
import { notificationService } from './notificationService';
import type {
  MediaItem,
  DiaryEntry,
  CalendarEvent,
  AISuggestion,
  Memory,
  MoodType,
  EventType,
  Relationship,
  NotificationType
} from '../../types';

/**
 * FamilyService - Business logic for Family Life & Memory features
 * 
 * Handles:
 * - Media validation and upload logic 
 * - Diary entry validation 
 * - Calendar event validation 
 * - AI suggestion coordination 
 * 
 * Single Responsibility: Enforces business rules and constraints
 * No direct database access - uses familyRepository
 */

// Constants for file validation
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_PHOTO_FORMATS = ['image/jpeg', 'image/png'];
const ALLOWED_VIDEO_FORMATS = ['video/mp4'];
const MAX_CAPTION_LENGTH = 500;
const MAX_DIARY_LENGTH = 10000;
const MIN_DIARY_LENGTH = 1;

async function getPartnerUserId(
  relationshipId: string,
  actorUserId: string
): Promise<string | null> {
  const relationship = await relationshipRepository.getRelationshipById(relationshipId);
  if (!relationship) return null;

  if (relationship.youth_id === actorUserId) return relationship.elderly_id;
  if (relationship.elderly_id === actorUserId) return relationship.youth_id;
  return null;
}

async function notifyPartner(
  relationshipId: string,
  actorUserId: string,
  payload: {
    type: NotificationType;
    title: string;
    message: string;
    reference_id?: string;
    reference_table?: string;
  }
): Promise<void> {
  try {
    const partnerId = await getPartnerUserId(relationshipId, actorUserId);
    if (!partnerId) {
      console.warn('[familyService] Partner not found for relationship', relationshipId);
      return;
    }

    await notificationRepository.createNotification({
      user_id: partnerId,
      ...payload,
    });

    await notificationService.sendPushNotification(
      partnerId,
      payload.title,
      payload.message,
      {
        reference_id: payload.reference_id,
        reference_table: payload.reference_table,
        type: payload.type,
      }
    );
  } catch (error) {
    console.error('[familyService] Failed to notify partner:', error);
  }
}

export const familyService = {
  // ===========================
  // MEDIA / FAMILY ALBUM
  // ===========================

  /**
   * Validate media file before upload
   */
  validateMediaFile(
    file: {
      size: number;
      type: string;
      name: string;
    }
  ): { valid: boolean; error?: string } {
    // Normalize MIME type and check file extension
    let fileType = (file.type || '').toLowerCase().trim();
    const fileName = (file.name || '').toLowerCase();

    console.log('[validateMediaFile] Input:', { type: fileType, name: fileName, size: file.size });

    // Try to determine type from extension if MIME type is missing/unclear
    if (!fileType || fileType === 'application/octet-stream' || fileType.includes('unknown')) {
      if (fileName.endsWith('.png')) {
        fileType = 'image/png';
      } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        fileType = 'image/jpeg';
      } else if (fileName.endsWith('.mp4')) {
        fileType = 'video/mp4';
      }
    }

    // Normalize common MIME type variations
    if (fileType.includes('png')) fileType = 'image/png';
    if (fileType.includes('jpg') || fileType.includes('jpeg')) fileType = 'image/jpeg';
    if (fileType.includes('mp4') || fileType.includes('video')) fileType = 'video/mp4';

    console.log('[validateMediaFile] Normalized type:', fileType);

    // Check file type
    const isPhoto = ALLOWED_PHOTO_FORMATS.includes(fileType);
    const isVideo = ALLOWED_VIDEO_FORMATS.includes(fileType);

    console.log('[validateMediaFile] Type check:', { isPhoto, isVideo, fileType });

    if (!isPhoto && !isVideo) {
      return {
        valid: false,
        error: `Unsupported format "${fileType}". Allowed formats: JPG, PNG, MP4`
      };
    }

    // Check file size
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_PHOTO_SIZE;
    const maxSizeLabel = isVideo ? '50MB' : '10MB';

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File exceeds maximum size of ${maxSizeLabel}`
      };
    }

    console.log('[validateMediaFile] Validation passed');
    return { valid: true };
  },

  /**
   * Validate caption
   */
  validateCaption(caption: string): { valid: boolean; error?: string } {
    if (caption && caption.length > MAX_CAPTION_LENGTH) {
      return {
        valid: false,
        error: `Caption must not exceed ${MAX_CAPTION_LENGTH} characters`
      };
    }
    return { valid: true };
  },

  /**
   * Check if media upload is allowed based on relationship stage
   */
  canAccessFamilyAlbum(relationship: Relationship): boolean {
    const allowedStages = ['trial_period', 'official_ceremony', 'family_life'];
    return allowedStages.includes(relationship.current_stage);
  },

  /**
   * Upload media with validation
   * 
   * Accepts file data with base64 content for upload to storage
   */
  async uploadMedia(
    uploader_id: string,
    relationship_id: string,
    fileData: {
      base64: string;
      type: string;
      name: string;
      size: number;
    },
    caption?: string
  ): Promise<MediaItem> {
    // Validate file
    const fileValidation = this.validateMediaFile(fileData);
    if (!fileValidation.valid) {
      throw new Error(fileValidation.error);
    }

    // Validate caption if provided
    if (caption) {
      const captionValidation = this.validateCaption(caption);
      if (!captionValidation.valid) {
        throw new Error(captionValidation.error);
      }
    }

    // Determine media type
    const mediaType = fileData.type.startsWith('video') ? 'video' : 'photo';

    // Upload to repository with base64 data
    return familyRepository.uploadMedia(
      uploader_id,
      relationship_id,
      mediaType,
      {
        base64: fileData.base64,
        name: fileData.name,
        type: fileData.type,
      },
      caption
    );
  },

  /**
   * Get media for relationship organized by date
   */
  async getMediaByRelationship(
    relationship_id: string,
    mediaType?: string
  ): Promise<MediaItem[]> {
    return familyRepository.getMediaByRelationship(
      relationship_id,
      mediaType as any
    );
  },

  /**
   * Remove media from album
   */
  async removeMedia(id: string): Promise<void> {
    return familyRepository.deleteMedia(id);
  },

  /**
   * Update media caption
   */
  async updateMediaCaption(id: string, caption: string): Promise<MediaItem> {
    const captionValidation = this.validateCaption(caption);
    if (!captionValidation.valid) {
      throw new Error(captionValidation.error);
    }

    return familyRepository.updateMediaCaption(id, caption);
  },

  /**
   * Save chat media to family album as a memory
   * Creates Memory wrapper + Media entry from existing chat-media URL (no re-upload needed)
   * Called by CommunicationViewModel for "Save to Memories" feature
   * 
   * @param uploaderId - Current user ID
   * @param relationshipId - Active relationship ID (must exist)
   * @param mediaUrl - Existing chat media URL
   * @param mediaType - 'photo' or 'video'
   * @param caption - Optional caption
   */
  async saveChatMediaToMemory(
    uploaderId: string,
    relationshipId: string,
    mediaUrl: string,
    mediaType: 'photo' | 'video',
    caption?: string
  ): Promise<MediaItem> {
    // Validate caption if provided (reuse existing validation)
    if (caption) {
      const captionValidation = this.validateCaption(caption);
      if (!captionValidation.valid) {
        throw new Error(captionValidation.error);
      }
    }

    // Step 1: Create a Memory wrapper first (so it appears in AlbumScreen)
    const memory = await familyRepository.createMemory(
      relationshipId,
      uploaderId,
      mediaUrl, // Use chat media URL as thumbnail
      caption || 'Saved from chat'
    );

    // Step 2: Create media entry from existing URL and link to memory
    const mediaItem = await familyRepository.createMediaFromUrl(
      uploaderId,
      relationshipId,
      mediaType,
      mediaUrl,
      caption
    );

    // Step 3: Link media to memory
    await familyRepository.linkMediaToMemory(memory.id, [mediaItem.id]);

    console.log('[familyService] Chat media saved as memory:', memory.id);

    await notifyPartner(relationshipId, uploaderId, {
      type: 'stage_milestone',
      title: 'New memory added',
      message: caption ? caption : 'A new memory was added to your album.',
      reference_id: memory.id,
      reference_table: 'memories',
    });

    return mediaItem;
  },

  /**
   * Upload multiple media files as a single memory
   * Groups multiple files under one memory entry with shared metadata
   */
  async uploadMultipleMediaAsMemory(
    uploader_id: string,
    relationship_id: string,
    filesData: Array<{
      base64: string;
      type: string;
      name: string;
      size: number;
    }>,
    caption?: string
  ): Promise<{
    memory: Memory;
    mediaItems: MediaItem[];
  }> {
    if (!filesData || filesData.length === 0) {
      throw new Error('At least one file is required');
    }

    if (filesData.length > 5) {
      throw new Error('Maximum 5 files per upload');
    }

    // Validate all files before processing
    const validationErrors: string[] = [];
    filesData.forEach((file, index) => {
      const validation = this.validateMediaFile(file);
      if (!validation.valid) {
        validationErrors.push(`File ${index + 1}: ${validation.error}`);
      }
    });

    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('; '));
    }

    // Validate caption if provided
    if (caption) {
      const captionValidation = this.validateCaption(caption);
      if (!captionValidation.valid) {
        throw new Error(captionValidation.error);
      }
    }

    // Create memory first (will be updated with media count)
    const thumbnailUrl = ''; // Will be set to first uploaded file's URL
    const memory = await familyRepository.createMemory(
      relationship_id,
      uploader_id,
      thumbnailUrl,
      caption
    );

    // Upload each media file and link to memory
    const mediaItems: MediaItem[] = [];
    try {
      for (let i = 0; i < filesData.length; i++) {
        const fileData = filesData[i];
        const mediaType = fileData.type.startsWith('video') ? 'video' : 'photo';

        // Upload to repository
        const mediaItem = await familyRepository.uploadMedia(
          uploader_id,
          relationship_id,
          mediaType,
          {
            base64: fileData.base64,
            name: fileData.name,
            type: fileData.type,
          },
          i === 0 ? caption : undefined // Only attach caption to first item
        );

        // Link media to memory
        await familyRepository.linkMediaToMemory(memory.id, [mediaItem.id]);

        // Set thumbnail from first file
        if (i === 0) {
          await familyRepository.updateMemory(memory.id, {
            thumbnail_url: mediaItem.file_url
          });
        }

        mediaItems.push(mediaItem);
      }

      // Update memory media count
      await familyRepository.updateMemoryMediaCount(memory.id, mediaItems.length);

      await notifyPartner(relationship_id, uploader_id, {
        type: 'stage_milestone',
        title: 'New memory added',
        message: caption ? caption : 'A new memory was added to your album.',
        reference_id: memory.id,
        reference_table: 'memories',
      });

      return {
        memory: {
          ...memory,
          thumbnail_url: mediaItems[0]?.file_url || memory.thumbnail_url,
          media_count: mediaItems.length,
          media: mediaItems,
        },
        mediaItems,
      };
    } catch (error: any) {
      // If upload fails, delete the memory (cascade will delete orphaned media)
      await familyRepository.deleteMemory(memory.id);
      throw error;
    }
  },

  /**
   * Get all memories for a relationship
   */
  async getMemoriesByRelationship(
    relationship_id: string
  ): Promise<Memory[]> {
    return familyRepository.getMemoriesByRelationship(relationship_id);
  },

  /**
   * Get a single memory with all associated media
   */
  async getMemoryById(memory_id: string): Promise<Memory | null> {
    return familyRepository.getMemoryById(memory_id);
  },

  /**
   * Remove a memory and all associated media
   */
  async removeMemory(memory_id: string, actor_id: string): Promise<void> {
    const existing = await familyRepository.getMemoryById(memory_id);
    if (!existing) {
      throw new Error('Memory not found');
    }

    await familyRepository.deleteMemory(memory_id);

    await notifyPartner(existing.relationship_id, actor_id, {
      type: 'stage_milestone',
      title: 'Memory removed',
      message: existing.caption ? existing.caption : 'A memory was removed from your album.',
      reference_id: memory_id,
      reference_table: 'memories',
    });
  },

  /**
   * Update memory caption
   */
  async updateMemoryCaption(memory_id: string, caption: string): Promise<Memory> {
    const captionValidation = this.validateCaption(caption);
    if (!captionValidation.valid) {
      throw new Error(captionValidation.error);
    }

    return familyRepository.updateMemory(memory_id, { caption });
  },

  // ===========================
  // DIARY ENTRIES
  // ===========================

  /**
   * Check if diary is available based on relationship stage
   */
  canWriteDiary(): boolean {
    // Available in all stages
    return true;
  },

  /**
   * Validate diary entry content
   */
  validateDiaryEntry(content: string): { valid: boolean; error?: string } {
    if (!content || content.trim().length < MIN_DIARY_LENGTH) {
      return {
        valid: false,
        error: 'Diary entry cannot be empty'
      };
    }

    if (content.length > MAX_DIARY_LENGTH) {
      return {
        valid: false,
        error: `Diary entry must not exceed ${MAX_DIARY_LENGTH} characters`
      };
    }

    return { valid: true };
  },

  /**
   * Create diary entry
   */
  async createDiaryEntry(
    user_id: string,
    relationship_id: string,
    content: string,
    mood: MoodType
  ): Promise<DiaryEntry> {
    // Validate content
    const validation = this.validateDiaryEntry(content);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    return familyRepository.createDiaryEntry(
      user_id,
      relationship_id,
      content,
      mood,
      true
    );
  },

  /**
   * Get diary entries filtered by mood
   */
  async getDiaryEntriesByMood(
    user_id: string,
    relationship_id: string,
    mood?: MoodType
  ): Promise<DiaryEntry[]> {
    return familyRepository.getDiaryEntriesByUser(user_id, relationship_id, mood);
  },

  /**
   * Update diary entry
   */
  async updateDiaryEntry(
    id: string,
    content: string,
    mood: MoodType
  ): Promise<DiaryEntry> {
    // Validate content
    const validation = this.validateDiaryEntry(content);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    return familyRepository.updateDiaryEntry(id, content, mood);
  },

  /**
   * Delete diary entry
   */
  async deleteDiaryEntry(id: string): Promise<void> {
    return familyRepository.deleteDiaryEntry(id);
  },

  /**
   * Get single diary entry by ID
   */
  async getDiaryEntryById(id: string): Promise<DiaryEntry | null> {
    return familyRepository.getDiaryEntryById(id);
  },

  // ===========================
  // CALENDAR EVENTS
  // ===========================

  /**
   * Check if calendar events are available
   */
  canAccessCalendar(relationship: Relationship): boolean {
    const allowedStages = ['trial_period', 'official_ceremony', 'family_life'];
    return allowedStages.includes(relationship.current_stage);
  },

  /**
   * Validate event date (must be future date)
   */
  validateEventDate(event_date: string): { valid: boolean; error?: string } {
    const eventDate = new Date(event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      return {
        valid: false,
        error: 'Event date must be in the future'
      };
    }

    return { valid: true };
  },

  /**
   * Create calendar event
   */
  async createCalendarEvent(
    relationship_id: string,
    creator_id: string,
    title: string,
    event_type: EventType,
    event_date: string,
    event_time?: string,
    description?: string,
    location?: string
  ): Promise<CalendarEvent> {
    // Validate date
    const dateValidation = this.validateEventDate(event_date);
    if (!dateValidation.valid) {
      throw new Error(dateValidation.error);
    }

    const event = await familyRepository.createCalendarEvent(
      relationship_id,
      creator_id,
      title,
      event_type,
      event_date,
      event_time,
      description,
      location
    );

    await notifyPartner(relationship_id, creator_id, {
      type: 'calendar_reminder',
      title: 'New event scheduled',
      message: `${title} on ${event_date}${event_time ? ` at ${event_time}` : ''}`,
      reference_id: event.id,
      reference_table: 'calendar_events',
    });

    return event;
  },

  /**
   * Update calendar event
   */
  async updateCalendarEvent(
    id: string,
    actor_id: string,
    updates: {
      title?: string;
      description?: string;
      event_type?: EventType;
      event_date?: string;
      event_time?: string;
      location?: string;
    }
  ): Promise<CalendarEvent> {
    // Validate date if being updated
    if (updates.event_date) {
      const dateValidation = this.validateEventDate(updates.event_date);
      if (!dateValidation.valid) {
        throw new Error(dateValidation.error);
      }
    }

    const existing = await familyRepository.getCalendarEventById(id);
    if (!existing) {
      throw new Error('Event not found');
    }

    const updated = await familyRepository.updateCalendarEvent(id, updates);

    await notifyPartner(existing.relationship_id, actor_id, {
      type: 'calendar_reminder',
      title: 'Event updated',
      message: `${updated.title || existing.title} has been updated`,
      reference_id: updated.id,
      reference_table: 'calendar_events',
    });

    return updated;
  },

  /**
   * Delete calendar event
   */
  async deleteCalendarEvent(id: string, actor_id: string): Promise<void> {
    const existing = await familyRepository.getCalendarEventById(id);
    if (!existing) {
      throw new Error('Event not found');
    }

    await familyRepository.deleteCalendarEvent(id);

    await notifyPartner(existing.relationship_id, actor_id, {
      type: 'calendar_reminder',
      title: 'Event cancelled',
      message: `${existing.title} was cancelled`,
      reference_id: id,
      reference_table: 'calendar_events',
    });
  },

  /**
   * Get calendar events for relationship
   */
  async getCalendarEvents(relationship_id: string): Promise<CalendarEvent[]> {
    return familyRepository.getCalendarEventsByRelationship(relationship_id);
  },

  /**
   * Get upcoming events within specified days
   */
  async getUpcomingEvents(
    relationship_id: string,
    days?: number
  ): Promise<CalendarEvent[]> {
    return familyRepository.getUpcomingEvents(relationship_id, days);
  },

  /**
   * Get single event by ID
   */
  async getCalendarEventById(id: string): Promise<CalendarEvent | null> {
    return familyRepository.getCalendarEventById(id);
  },

  // ===========================
  // AI SUGGESTIONS
  // ===========================

  /**
   * Create AI activity suggestion
   */
  async createAISuggestion(
    relationship_id: string,
    activity_title: string,
    activity_description: string
  ): Promise<AISuggestion> {
    return familyRepository.createAISuggestion(
      relationship_id,
      'activity',
      activity_title,
      activity_description
    );
  },

  /**
   * Get AI recommendations for event creation
   */
  async getActivityRecommendations(
    relationship_id: string
  ): Promise<AISuggestion[]> {
    return familyRepository.getAISuggestions(
      relationship_id,
      'activity',
      3
    );
  },

  /**
   * Mark suggestion as used
   */
  async useSuggestion(id: string): Promise<AISuggestion> {
    return familyRepository.markSuggestionAsUsed(id);
  },

  /**
   * Get all suggestions for a relationship
   */
  async getAllSuggestions(relationship_id: string): Promise<AISuggestion[]> {
    return familyRepository.getAllAISuggestions(relationship_id);
  }
};
