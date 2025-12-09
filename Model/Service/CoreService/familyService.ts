import { familyRepository } from '../../Repository/UserRepository';
import type {
  MediaItem,
  DiaryEntry,
  CalendarEvent,
  AISuggestion,
  MoodType,
  EventType,
  Relationship
} from '../../types';

/**
 * FamilyService - Business logic for Family Life & Memory features
 * 
 * Handles:
 * - Media validation and upload logic (FR 3.1)
 * - Diary entry validation (FR 3.3)
 * - Calendar event validation (FR 3.2)
 * - AI suggestion coordination (FR 3.4)
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

export const familyService = {
  // ===========================
  // MEDIA / FAMILY ALBUM
  // ===========================

  /**
   * Validate media file before upload
   * FR 3.1.5, 3.1.6, 3.1.11, 3.1.12
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
   * FR 3.1 - Must be Stage 2 (trial_period) or higher
   */
  canAccessFamilyAlbum(relationship: Relationship): boolean {
    const allowedStages = ['trial_period', 'official_ceremony', 'family_life'];
    return allowedStages.includes(relationship.current_stage);
  },

  /**
   * Upload media with validation
   * FR 3.1.1, 3.1.2, 3.1.8, 3.1.9
   */
  async uploadMedia(
    uploader_id: string,
    relationship_id: string,
    file: { size: number; type: string; name: string },
    file_url: string,
    caption?: string
  ): Promise<MediaItem> {
    // Validate file
    const fileValidation = this.validateMediaFile(file);
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
    const mediaType = file.type.startsWith('video') ? 'video' : 'photo';

    // Upload to repository
    return familyRepository.uploadMedia(
      uploader_id,
      relationship_id,
      mediaType,
      file_url,
      caption
    );
  },

  /**
   * Get media for relationship organized by date
   * FR 3.1.3
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
   * FR 3.1.2
   */
  async removeMedia(id: string): Promise<void> {
    return familyRepository.deleteMedia(id);
  },

  /**
   * Update media caption
   * FR 3.1.4
   */
  async updateMediaCaption(id: string, caption: string): Promise<MediaItem> {
    const captionValidation = this.validateCaption(caption);
    if (!captionValidation.valid) {
      throw new Error(captionValidation.error);
    }

    return familyRepository.updateMediaCaption(id, caption);
  },

  // ===========================
  // DIARY ENTRIES
  // ===========================

  /**
   * Check if diary is available based on relationship stage
   * FR 3.3 - Available from Stage 1 onwards
   */
  canWriteDiary(): boolean {
    // Available in all stages
    return true;
  },

  /**
   * Validate diary entry content
   * FR 3.3.4, 3.3.10
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
   * FR 3.3.1, 3.3.2, 3.3.4, 3.3.5
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
   * FR 3.3.7
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
   * FR 3.3.1
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
   * FR 3.3.1
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
   * FR 3.2 - Available from Stage 2 onwards
   */
  canAccessCalendar(relationship: Relationship): boolean {
    const allowedStages = ['trial_period', 'official_ceremony', 'family_life'];
    return allowedStages.includes(relationship.current_stage);
  },

  /**
   * Validate event date (must be future date)
   * FR 3.2.10
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
   * FR 3.2.1, 3.2.2, 3.2.7
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

    return familyRepository.createCalendarEvent(
      relationship_id,
      creator_id,
      title,
      event_type,
      event_date,
      event_time,
      description,
      location
    );
  },

  /**
   * Update calendar event
   * FR 3.2.1, 3.2.9
   */
  async updateCalendarEvent(
    id: string,
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

    return familyRepository.updateCalendarEvent(id, updates);
  },

  /**
   * Delete calendar event
   * FR 3.2.1, 3.2.11, 3.2.12
   */
  async deleteCalendarEvent(id: string): Promise<void> {
    return familyRepository.deleteCalendarEvent(id);
  },

  /**
   * Get calendar events for relationship
   * FR 3.2.4
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
   * FR 3.4.2, 3.4.5
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
   * FR 3.2.5, 3.4.4 (maximum 3 recommendations)
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
   * FR 3.4.6, 3.4.7
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
