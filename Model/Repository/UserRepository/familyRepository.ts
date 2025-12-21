import { supabase } from '../../Service/APIService/supabase';
import { storageService } from '../../Service/APIService/storageService';
import type {
  MediaItem,
  DiaryEntry,
  CalendarEvent,
  AISuggestion,
  Memory,
  MoodType,
  EventType,
  MediaType,
} from '../../types';

/**
 * FamilyRepository - Data access layer for family life & memory features
 * 
 * Handles CRUD operations for:
 * - Media (photos, videos) in family album
 * - Diary entries
 * - Calendar events
 * - AI activity suggestions
 */
export const familyRepository = {
  // ===========================
  // MEDIA / FAMILY ALBUM
  // ===========================

  /**
   * Upload media to family album with file storage
   * 
   * Uploads the actual file to Supabase Storage and stores the public URL
   */
  async uploadMedia(
    uploader_id: string,
    relationship_id: string,
    media_type: MediaType,
    fileData: {
      base64: string;
      name: string;
      type: string;
    },
    caption?: string,
    tags?: string[]
  ): Promise<MediaItem> {
    try {
      // Upload file to Supabase Storage with base64 data
      console.log('[familyRepository] Starting file upload to storage...');

      const folderPath = `relationships/${relationship_id}/media`;
      const bucket = storageService.getMediaBucket();

      const publicUrl = await storageService.uploadMediaFileWithRetry(
        bucket,
        fileData,
        folderPath
      );

      console.log('[familyRepository] File uploaded, storing metadata in database...');

      // Store media metadata with public URL in database
      const { data, error } = await supabase
        .from('media')
        .insert({
          uploader_id,
          relationship_id,
          media_type,
          media_category: 'family_album',
          file_url: publicUrl, // Store the public URL instead of local path
          caption: caption || null,
          tags: tags || null,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[familyRepository] Media metadata saved successfully');
      return data;
    } catch (error: any) {
      console.error('[familyRepository] Media upload failed:', error);
      throw error;
    }
  },

  /**
   * Create media entry from existing URL (no file upload needed)
   * Used for saving chat media to family album
   * Reuses existing URL from chat-media bucket
   */
  async createMediaFromUrl(
    uploader_id: string,
    relationship_id: string,
    media_type: MediaType,
    file_url: string,
    caption?: string
  ): Promise<MediaItem> {
    try {
      console.log('[familyRepository] Creating media from existing URL...');

      const { data, error } = await supabase
        .from('media')
        .insert({
          uploader_id,
          relationship_id,
          media_type,
          media_category: 'family_album',
          file_url,
          caption: caption || null,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[familyRepository] Media created from URL successfully');
      return data;
    } catch (error: any) {
      console.error('[familyRepository] createMediaFromUrl failed:', error);
      throw error;
    }
  },

  /**
   * Get all media for a relationship, organized by date
   */
  async getMediaByRelationship(
    relationship_id: string,
    media_type?: MediaType
  ): Promise<MediaItem[]> {
    let query = supabase
      .from('media')
      .select('*')
      .eq('relationship_id', relationship_id)
      .eq('media_category', 'family_album')
      .order('uploaded_at', { ascending: false });

    if (media_type) {
      query = query.eq('media_type', media_type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get single media item by ID
   */
  async getMediaById(id: string): Promise<MediaItem | null> {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  /**
   * Update media caption
   */
  async updateMediaCaption(
    id: string,
    caption: string
  ): Promise<MediaItem> {
    const { data, error } = await supabase
      .from('media')
      .update({ caption })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete media
   */
  async deleteMedia(id: string): Promise<void> {
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ===========================
  // MEMORIES (grouped media)
  // ===========================

  /**
   * Create a new memory (groups multiple media files)
   * Associates multiple media items under one memory with shared metadata
   */
  async createMemory(
    relationship_id: string,
    uploader_id: string,
    thumbnail_url: string,
    caption?: string
  ): Promise<Memory> {
    try {
      const { data, error } = await supabase
        .from('memories')
        .insert({
          relationship_id,
          uploader_id,
          caption: caption || null,
          thumbnail_url,
          media_count: 1, // Will be updated when media is added
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('[familyRepository] Failed to create memory:', error);
      throw error;
    }
  },

  /**
   * Get all memories for a relationship, ordered by date
   * Returns memory timeline for album view
   */
  async getMemoriesByRelationship(
    relationship_id: string
  ): Promise<Memory[]> {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('relationship_id', relationship_id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[familyRepository] Failed to fetch memories:', error);
      throw error;
    }
  },

  /**
   * Get a single memory by ID with all associated media
   * Used for detail view of a grouped memory
   */
  async getMemoryById(id: string): Promise<Memory | null> {
    try {
      const { data: memory, error: memoryError } = await supabase
        .from('memories')
        .select('*')
        .eq('id', id)
        .single();

      if (memoryError && memoryError.code !== 'PGRST116') throw memoryError;
      if (!memory) return null;

      // Fetch all media in this memory
      const { data: media, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('memory_id', id)
        .order('uploaded_at', { ascending: true });

      if (mediaError) throw mediaError;

      return {
        ...memory,
        media: media || [],
      };
    } catch (error: any) {
      console.error('[familyRepository] Failed to fetch memory:', error);
      throw error;
    }
  },

  /**
   * Get all media items in a memory
   */
  async getMediaByMemory(memory_id: string): Promise<MediaItem[]> {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('memory_id', memory_id)
        .order('uploaded_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[familyRepository] Failed to fetch media by memory:', error);
      throw error;
    }
  },

  /**
   * Update memory metadata (caption)
   */
  async updateMemory(
    id: string,
    updates: {
      caption?: string;
      thumbnail_url?: string;
    }
  ): Promise<Memory> {
    try {
      const { data, error } = await supabase
        .from('memories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('[familyRepository] Failed to update memory:', error);
      throw error;
    }
  },

  /**
   * Update media_count for a memory
   * Called when adding/removing media from a memory
   */
  async updateMemoryMediaCount(
    id: string,
    media_count: number
  ): Promise<Memory> {
    try {
      const { data, error } = await supabase
        .from('memories')
        .update({ media_count })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('[familyRepository] Failed to update memory count:', error);
      throw error;
    }
  },

  /**
   * Delete a memory and all associated media (cascaded via DB constraint)
   */
  async deleteMemory(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('[familyRepository] Failed to delete memory:', error);
      throw error;
    }
  },

  /**
   * Link existing media to a memory (for batch operations)
   */
  async linkMediaToMemory(
    memory_id: string,
    media_ids: string[]
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('media')
        .update({ memory_id })
        .in('id', media_ids);

      if (error) throw error;
    } catch (error: any) {
      console.error('[familyRepository] Failed to link media to memory:', error);
      throw error;
    }
  },

  // ===========================
  // DIARY ENTRIES
  // ===========================

  /**
   * Create new diary entry
   */
  async createDiaryEntry(
    user_id: string,
    relationship_id: string,
    content: string,
    mood: MoodType,
    is_private: boolean = true
  ): Promise<DiaryEntry> {
    const { data, error } = await supabase
      .from('diary_entries')
      .insert({
        user_id,
        relationship_id,
        content,
        mood,
        is_private,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all diary entries for a user
   */
  async getDiaryEntriesByUser(
    user_id: string,
    relationship_id: string,
    mood_filter?: MoodType
  ): Promise<DiaryEntry[]> {
    let query = supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user_id)
      .eq('relationship_id', relationship_id)
      .order('created_at', { ascending: false });

    if (mood_filter) {
      query = query.eq('mood', mood_filter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get single diary entry
   */
  async getDiaryEntryById(id: string): Promise<DiaryEntry | null> {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  /**
   * Update diary entry
   */
  async updateDiaryEntry(
    id: string,
    content: string,
    mood: MoodType
  ): Promise<DiaryEntry> {
    const { data, error } = await supabase
      .from('diary_entries')
      .update({ content, mood })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete diary entry
   */
  async deleteDiaryEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ===========================
  // CALENDAR EVENTS
  // ===========================

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
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        relationship_id,
        creator_id,
        title,
        description: description || null,
        event_type,
        event_date,
        event_time: event_time || null,
        location: location || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all calendar events for a relationship
   */
  async getCalendarEventsByRelationship(
    relationship_id: string
  ): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('relationship_id', relationship_id)
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get single calendar event
   */
  async getCalendarEventById(id: string): Promise<CalendarEvent | null> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  /**
   * Update calendar event
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
      reminder_sent?: boolean;
    }
  ): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('calendar_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete calendar event
   */
  async deleteCalendarEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get upcoming events for a relationship
   */
  async getUpcomingEvents(
    relationship_id: string,
    days: number = 7
  ): Promise<CalendarEvent[]> {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('relationship_id', relationship_id)
      .gte('event_date', today)
      .lte('event_date', futureDateStr)
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // ===========================
  // AI SUGGESTIONS
  // ===========================

  /**
   * Create AI suggestion
   */
  async createAISuggestion(
    relationship_id: string,
    suggestion_type: 'activity' | 'conversation_topic',
    activity_title?: string,
    activity_description?: string,
    topic_text?: string,
    topic_for_stage?: string
  ): Promise<AISuggestion> {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .insert({
        relationship_id,
        suggestion_type,
        activity_title: activity_title || null,
        activity_description: activity_description || null,
        topic_text: topic_text || null,
        topic_for_stage: topic_for_stage || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get recent AI suggestions for a relationship
   */
  async getAISuggestions(
    relationship_id: string,
    suggestion_type: 'activity' | 'conversation_topic',
    limit: number = 3
  ): Promise<AISuggestion[]> {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('relationship_id', relationship_id)
      .eq('suggestion_type', suggestion_type)
      .eq('is_used', false)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Mark suggestion as used
   */
  async markSuggestionAsUsed(id: string): Promise<AISuggestion> {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .update({ is_used: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all AI suggestions for a relationship
   */
  async getAllAISuggestions(relationship_id: string): Promise<AISuggestion[]> {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('relationship_id', relationship_id)
      .order('generated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
