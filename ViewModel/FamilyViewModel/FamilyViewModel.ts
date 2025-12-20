import { makeAutoObservable, runInAction } from 'mobx';
import { familyService, familyAIService, relationshipService, voiceTranscriptionService } from '@home-sweet-home/model';
import type {
  MediaItem,
  DiaryEntry,
  CalendarEvent,
  AISuggestion,
  Memory,
  MoodType,
  EventType,
  Relationship
} from '@home-sweet-home/model';

/**
 * File data interface for uploads
 * View layer is responsible for reading files as base64 before calling ViewModel methods
 */
export interface FileData {
  base64: string;
  name: string;
  type: string;
  size: number;
}

/**
 * Download result interface
 * ViewModel returns URLs, View layer handles actual download to device
 */
export interface DownloadableMedia {
  id: string;
  url: string;
  mediaType: 'photo' | 'video';
  filename: string;
}

/**
 * FamilyViewModel - MVVM state management for Family Life & Memory features
 * 
 * Manages observable state for:
 * - Family Album (media uploads, downloads, removal)
 * - Personal Diary (entries, moods, filtering)
 * - Shared Calendar (events, reminders, syncing)
 * - AI Recommendations (activity suggestions)
 * 
 * Single Responsibility: UI state and interactions
 * Calls Services for business logic, reads only observable properties
 */

export class FamilyViewModel {
  // =============================================================
  // OBSERVABLE STATE
  // =============================================================

  // Shared state
  currentRelationship: Relationship | null = null;
  currentUserId: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Family Album state
  mediaItems: MediaItem[] = [];
  memories: Memory[] = [];
  selectedMedia: MediaItem | null = null;
  selectedMemory: Memory | null = null;
  uploadProgress = 0;
  isUploading = false;

  // Diary state
  diaryEntries: DiaryEntry[] = [];
  selectedDiary: DiaryEntry | null = null;
  selectedMoodFilter: MoodType | null = null;
  isEditingDiary = false;
  isTranscribing = false;
  transcriptionError: string | null = null;

  // Calendar state
  calendarEvents: CalendarEvent[] = [];
  selectedEvent: CalendarEvent | null = null;
  upcomingEvents: CalendarEvent[] = [];

  // AI Recommendations state
  aiRecommendations: AISuggestion[] = [];
  isGeneratingRecommendations = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // =============================================================
  // SHARED ACTIONS
  // =============================================================

  /**
   * Initialize FamilyViewModel with user's active relationship
   */
  async initialize(userId: string) {
    runInAction(() => {
      this.currentUserId = userId;
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      const relationship = await relationshipService.getActiveRelationship(userId);
      runInAction(() => {
        this.currentRelationship = relationship;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to load relationship';
        this.isLoading = false;
      });
      // Don't throw - let screens handle missing relationship gracefully
      console.warn('[FamilyViewModel] Initialize error:', error.message);
    }
  }

  setRelationship(relationship: Relationship) {
    this.currentRelationship = relationship;
  }

  setError(message: string | null) {
    this.errorMessage = message;
  }

  clearError() {
    this.errorMessage = null;
  }

  setSuccessMessage(message: string | null) {
    this.successMessage = message;
  }

  clearSuccessMessage() {
    this.successMessage = null;
  }

  // =============================================================
  // FAMILY ALBUM ACTIONS (UC-300)
  // =============================================================

  /**
   * Check if family album is accessible
   */
  canAccessFamilyAlbum(): boolean {
    if (!this.currentRelationship) return false;
    return familyService.canAccessFamilyAlbum(this.currentRelationship);
  }

  /**
   * Load media for relationship
   * FR 3.1.3, 3.1.4
   */
  async loadMedia(relationship_id: string) {
    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      const media = await familyService.getMediaByRelationship(relationship_id);
      runInAction(() => {
        this.mediaItems = media;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to load media';
        this.isLoading = false;
      });
    }
  }

  /**
   * Select media item for viewing
   */
  selectMedia(media: MediaItem | null) {
    this.selectedMedia = media;
  }

  /**
   * Upload media
   * FR 3.1.1, 3.1.5, 3.1.6, 3.1.8, 3.1.9, 3.1.10
   * 
   * @param fileData - File data with base64 already read (View layer responsibility)
   * @param caption - Optional caption
   */
  async uploadMedia(
    fileData: FileData,
    caption?: string
  ) {
    if (!this.currentRelationship) {
      this.errorMessage = 'No active relationship';
      return;
    }

    if (!this.currentUserId) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    runInAction(() => {
      this.isUploading = true;
      this.uploadProgress = 0;
      this.errorMessage = null;
    });

    try {
      console.log('[FamilyViewModel] Uploading media, base64 length:', fileData.base64.length);

      const media = await familyService.uploadMedia(
        this.currentUserId,
        this.currentRelationship.id,
        fileData,
        caption
      );

      runInAction(() => {
        this.mediaItems.push(media);
        this.isUploading = false;
        this.uploadProgress = 100;
        this.successMessage = 'Media uploaded successfully!';
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        runInAction(() => this.successMessage = null);
      }, 3000);
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to upload media';
        this.isUploading = false;
        this.uploadProgress = 0;
      });
    }
  }

  /**
   * Upload up to 5 media files at once
   * Processes sequentially to avoid device/network overload
   * 
   * @param filesData - Array of FileData (View layer reads files as base64 before calling)
   * @param caption - Optional caption for all files
   */
  async uploadMultipleMedia(
    filesData: FileData[],
    caption?: string
  ) {
    if (!this.currentRelationship) {
      this.errorMessage = 'No active relationship';
      return;
    }

    if (!this.currentUserId) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    const limited = filesData.slice(0, 5);

    runInAction(() => {
      this.isUploading = true;
      this.uploadProgress = 0;
      this.errorMessage = null;
      this.successMessage = null;
    });

    const total = limited.length;
    const successes: number[] = [];
    const failures: { name: string; error: string }[] = [];

    for (let i = 0; i < total; i++) {
      const fileData = limited[i];
      try {
        const media = await familyService.uploadMedia(
          this.currentUserId!,
          this.currentRelationship!.id,
          fileData,
          caption
        );

        runInAction(() => {
          this.mediaItems.unshift(media);
        });
        successes.push(i);
      } catch (err: any) {
        failures.push({ name: fileData.name, error: err?.message || 'Upload failed' });
      } finally {
        runInAction(() => {
          this.uploadProgress = Math.round(((i + 1) / total) * 100);
        });
      }
    }

    runInAction(() => {
      this.isUploading = false;
    });

    if (failures.length === 0) {
      runInAction(() => {
        this.successMessage = `${successes.length} file(s) uploaded successfully`;
      });
      setTimeout(() => runInAction(() => (this.successMessage = null)), 3000);
    } else {
      const msg = `Uploaded ${successes.length}/${total}.` +
        (failures.length > 0 ? ` Failed: ${failures.map(f => f.name).join(', ')}` : '');
      runInAction(() => {
        this.errorMessage = msg;
      });
    }
  }

  /**
   * Update media caption
   * FR 3.1.4
   */
  async updateMediaCaption(mediaId: string, caption: string) {
    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      const updated = await familyService.updateMediaCaption(mediaId, caption);
      runInAction(() => {
        const index = this.mediaItems.findIndex(m => m.id === mediaId);
        if (index !== -1) {
          this.mediaItems[index] = updated;
        }
        if (this.selectedMedia?.id === mediaId) {
          this.selectedMedia = updated;
        }
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to update caption';
        this.isLoading = false;
      });
    }
  }

  /**
   * Remove media from album
   * FR 3.1.2
   */
  async removeMedia(mediaId: string) {
    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      await familyService.removeMedia(mediaId);
      runInAction(() => {
        this.mediaItems = this.mediaItems.filter(m => m.id !== mediaId);
        if (this.selectedMedia?.id === mediaId) {
          this.selectedMedia = null;
        }
        this.isLoading = false;
        this.successMessage = 'Media removed successfully';
      });

      setTimeout(() => {
        runInAction(() => this.successMessage = null);
      }, 3000);
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to remove media';
        this.isLoading = false;
      });
    }
  }

  // =============================================================
  // MEMORY ACTIONS (grouped media)
  // =============================================================

  /**
   * Upload multiple media files as a single memory
   * 
   * @param filesData - Array of FileData (View layer reads files as base64 before calling)
   * @param caption - Optional caption for the memory
   */
  async uploadMultipleMediaAsMemory(
    filesData: FileData[],
    caption?: string
  ) {
    if (!this.currentRelationship) {
      this.errorMessage = 'No active relationship';
      return;
    }

    if (!this.currentUserId) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    const limited = filesData.slice(0, 5);

    runInAction(() => {
      this.isUploading = true;
      this.uploadProgress = 0;
      this.errorMessage = null;
      this.successMessage = null;
    });

    const total = limited.length;

    try {
      // Upload as memory (View already read files as base64)
      const result = await familyService.uploadMultipleMediaAsMemory(
        this.currentUserId!,
        this.currentRelationship!.id,
        limited,
        caption
      );

      runInAction(() => {
        // Add to memories list
        this.memories.unshift(result.memory);
        // Also add individual media items for backward compatibility
        this.mediaItems.unshift(...result.mediaItems.reverse());
        this.isUploading = false;
        this.uploadProgress = 100;
        this.successMessage = `${total} file(s) uploaded as memory successfully`;
      });

      setTimeout(() => {
        runInAction(() => this.successMessage = null);
      }, 3000);
    } catch (err: any) {
      runInAction(() => {
        this.errorMessage = err?.message || 'Failed to upload as memory';
        this.isUploading = false;
      });
    }
  }

  /**
   * Load memories for the current relationship
   */
  async loadMemories() {
    if (!this.currentRelationship) {
      this.errorMessage = 'No active relationship';
      return;
    }

    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      const memories = await familyService.getMemoriesByRelationship(
        this.currentRelationship!.id
      );
      runInAction(() => {
        this.memories = memories;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to load memories';
        this.isLoading = false;
      });
    }
  }

  /**
   * Select a memory for detail view
   */
  async selectMemory(memoryId: string) {
    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      const memory = await familyService.getMemoryById(memoryId);
      runInAction(() => {
        this.selectedMemory = memory;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to load memory';
        this.isLoading = false;
      });
    }
  }

  /**
   * Update memory caption
   */
  async updateMemoryCaption(memoryId: string, caption: string) {
    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      const updated = await familyService.updateMemoryCaption(memoryId, caption);
      runInAction(() => {
        const index = this.memories.findIndex(m => m.id === memoryId);
        if (index !== -1) {
          this.memories[index] = updated;
        }
        if (this.selectedMemory?.id === memoryId) {
          this.selectedMemory = updated;
        }
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to update caption';
        this.isLoading = false;
      });
    }
  }

  /**
   * Remove a memory and all associated media
   */
  async removeMemory(memoryId: string) {
    if (!this.currentUserId) {
      runInAction(() => {
        this.errorMessage = 'You must be signed in to remove memories';
      });
      return;
    }

    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      await familyService.removeMemory(memoryId, this.currentUserId);
      runInAction(() => {
        this.memories = this.memories.filter(m => m.id !== memoryId);
        if (this.selectedMemory?.id === memoryId) {
          this.selectedMemory = null;
        }
        this.isLoading = false;
        this.successMessage = 'Memory removed successfully';
      });

      setTimeout(() => {
        runInAction(() => this.successMessage = null);
      }, 3000);
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to remove memory';
        this.isLoading = false;
      });
    }
  }

  /**
   * Download all media in a memory to device gallery
   */
  async downloadMemory(memoryId: string) {
    if (!this.selectedMemory || !this.selectedMemory.media) {
      this.errorMessage = 'No memory selected';
      return [];
    }

    const media = this.selectedMemory.media;

    // Build list of downloadable media for View layer to handle
    const downloadableMedia: DownloadableMedia[] = media.map(item => {
      const url = item.file_url || '';
      const urlExt = (url.split('?')[0].split('.').pop() || '').toLowerCase();
      let ext = urlExt;
      if (!ext) {
        ext = item.media_type === 'video' ? 'mp4' : 'jpg';
      }

      return {
        id: item.id,
        url: item.file_url,
        mediaType: item.media_type as 'photo' | 'video',
        filename: `HomeSweetHome_${item.id}.${ext}`
      };
    });

    console.log(`[FamilyViewModel] Returning ${downloadableMedia.length} media items for download`);
    return downloadableMedia;
  }

  // =============================================================
  // DIARY ACTIONS (UC-301)
  // =============================================================

  /**
   * Load diary entries
   * FR 3.3.1, 3.3.7
   */
  async loadDiaryEntries(user_id: string, relationship_id: string) {
    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      const entries = await familyService.getDiaryEntriesByMood(
        user_id,
        relationship_id,
        this.selectedMoodFilter || undefined
      );
      runInAction(() => {
        this.diaryEntries = entries;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to load diary entries';
        this.isLoading = false;
      });
    }
  }

  /**
   * Filter diary entries by mood
   * FR 3.3.7
   */
  async filterByMood(mood: MoodType | null) {
    this.selectedMoodFilter = mood;
    // Reload entries with filter
    if (this.currentRelationship && this.currentUserId) {
      await this.loadDiaryEntries(this.currentUserId, this.currentRelationship.id);
    }
  }

  /**
   * Select diary entry for viewing/editing
   */
  selectDiaryEntry(diary: DiaryEntry | null) {
    this.selectedDiary = diary;
    if (diary) {
      this.isEditingDiary = false;
    }
  }

  /**
   * Load specific diary entry by ID
   */
  async loadDiaryEntry(entryId: string) {
    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      const entry = await familyService.getDiaryEntryById(entryId);
      runInAction(() => {
        this.selectedDiary = entry;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to load diary entry';
        this.isLoading = false;
      });
    }
  }

  /**
   * Create new diary entry
   * FR 3.3.1, 3.3.2, 3.3.4, 3.3.5
   */
  async createDiaryEntry(
    user_id: string,
    relationship_id: string,
    content: string,
    mood: MoodType
  ) {
    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      const entry = await familyService.createDiaryEntry(
        user_id,
        relationship_id,
        content,
        mood
      );
      runInAction(() => {
        this.diaryEntries.unshift(entry);
        this.isLoading = false;
        this.successMessage = 'Diary entry saved successfully!';
      });

      setTimeout(() => {
        runInAction(() => this.successMessage = null);
      }, 3000);
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to save diary entry';
        this.isLoading = false;
      });
    }
  }

  /**
   * Update diary entry
   * FR 3.3.1
   */
  async updateDiaryEntry(
    id: string,
    content: string,
    mood: MoodType
  ) {
    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      const updated = await familyService.updateDiaryEntry(id, content, mood);
      runInAction(() => {
        const index = this.diaryEntries.findIndex(d => d.id === id);
        if (index !== -1) {
          this.diaryEntries[index] = updated;
        }
        if (this.selectedDiary?.id === id) {
          this.selectedDiary = updated;
        }
        this.isLoading = false;
        this.successMessage = 'Diary entry updated successfully!';
        this.isEditingDiary = false;
      });

      setTimeout(() => {
        runInAction(() => this.successMessage = null);
      }, 3000);
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to update diary entry';
        this.isLoading = false;
      });
    }
  }

  /**
   * Transcribe voice audio to text for diary entry
   * UC-301: Voice input for diary writing
   * FR 3.3.1, 3.3.2, 3.3.4, 3.3.5
   *
   * Called from WriteDiaryScreen when user stops recording
   * Calls voiceTranscriptionService (AssemblyAI STT)
   * Returns transcribed text for user to review/edit
   *
   * @param base64Audio - Base64-encoded audio from View layer hook
   * @returns Transcribed text that user can review
   */
  async transcribeDiaryVoiceInput(base64Audio: string): Promise<string> {
    runInAction(() => {
      this.isTranscribing = true;
      this.transcriptionError = null;
    });

    try {
      console.log('[FamilyViewModel] Starting voice transcription', {
        audioLength: base64Audio.length,
      });

      // Call Service for business logic - AssemblyAI transcription
      const result = await voiceTranscriptionService.transcribeDiary(base64Audio);

      console.log('[FamilyViewModel] Voice transcription successful', {
        textLength: result.text.length,
      });

      runInAction(() => {
        this.isTranscribing = false;
      });

      return result.text;
    } catch (error: any) {
      console.error('[FamilyViewModel] Voice transcription failed:', error);

      runInAction(() => {
        this.isTranscribing = false;
        this.transcriptionError =
          error.message || 'Failed to transcribe voice input. Please try again.';
      });

      // Clear error after 5 seconds
      setTimeout(() => {
        runInAction(() => {
          this.transcriptionError = null;
        });
      }, 5000);

      throw error;
    }
  }

  /**
   * Delete diary entry
   * FR 3.3.1, 3.3.3
   */
  async deleteDiaryEntry(id: string) {
    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      await familyService.deleteDiaryEntry(id);
      runInAction(() => {
        this.diaryEntries = this.diaryEntries.filter(d => d.id !== id);
        if (this.selectedDiary?.id === id) {
          this.selectedDiary = null;
        }
        this.isLoading = false;
        this.successMessage = 'Diary entry deleted';
      });

      setTimeout(() => {
        runInAction(() => this.successMessage = null);
      }, 3000);
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to delete diary entry';
        this.isLoading = false;
      });
    }
  }

  toggleEditDiary() {
    this.isEditingDiary = !this.isEditingDiary;
  }

  // =============================================================
  // CALENDAR ACTIONS (UC-302)
  // =============================================================

  /**
   * Check if calendar is accessible
   */
  canAccessCalendar(): boolean {
    if (!this.currentRelationship) return false;
    return familyService.canAccessCalendar(this.currentRelationship);
  }

  /**
   * Load calendar events
   * FR 3.2.4
   */
  async loadCalendarEvents(relationship_id: string) {
    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      const events = await familyService.getCalendarEvents(relationship_id);
      const upcoming = await familyService.getUpcomingEvents(relationship_id);
      runInAction(() => {
        this.calendarEvents = events;
        this.upcomingEvents = upcoming;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to load calendar events';
        this.isLoading = false;
      });
    }
  }

  /**
   * Load a specific calendar event by ID
   */
  async loadCalendarEvent(eventId: string) {
    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      // First try to find in already loaded events
      let event = this.calendarEvents.find(e => e.id === eventId);

      // If not found and we have a relationship, load all events
      if (!event && this.currentRelationship) {
        await this.loadCalendarEvents(this.currentRelationship.id);
        event = this.calendarEvents.find(e => e.id === eventId);
      }

      runInAction(() => {
        this.selectedEvent = event || null;
        this.isLoading = false;
        if (!event) {
          this.errorMessage = 'Event not found';
        }
      });
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to load event';
        this.isLoading = false;
      });
    }
  }

  /**
   * Select event for viewing
   */
  selectCalendarEvent(event: CalendarEvent | null) {
    this.selectedEvent = event;
  }

  /**
   * Create calendar event
   * FR 3.2.1, 3.2.2, 3.2.3, 3.2.7
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
  ) {
    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      const event = await familyService.createCalendarEvent(
        relationship_id,
        creator_id,
        title,
        event_type,
        event_date,
        event_time,
        description,
        location
      );
      runInAction(() => {
        this.calendarEvents.push(event);
        this.isLoading = false;
        this.successMessage = 'Event created successfully!';
      });

      setTimeout(() => {
        runInAction(() => this.successMessage = null);
      }, 3000);
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to create event';
        this.isLoading = false;
      });
    }
  }

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
  ) {
    if (!this.currentUserId) {
      runInAction(() => {
        this.errorMessage = 'You must be signed in to update events';
      });
      return;
    }

    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      const updated = await familyService.updateCalendarEvent(id, this.currentUserId, updates);
      runInAction(() => {
        const index = this.calendarEvents.findIndex(e => e.id === id);
        if (index !== -1) {
          this.calendarEvents[index] = updated;
        }
        if (this.selectedEvent?.id === id) {
          this.selectedEvent = updated;
        }
        this.isLoading = false;
        this.successMessage = 'Event updated successfully!';
      });

      setTimeout(() => {
        runInAction(() => this.successMessage = null);
      }, 3000);
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to update event';
        this.isLoading = false;
      });
    }
  }

  /**
   * Delete calendar event
   * FR 3.2.1, 3.2.11, 3.2.12
   */
  async deleteCalendarEvent(id: string) {
    if (!this.currentUserId) {
      runInAction(() => {
        this.errorMessage = 'You must be signed in to delete events';
      });
      return;
    }

    runInAction(() => {
      this.isLoading = true;
      this.errorMessage = null;
    });

    try {
      await familyService.deleteCalendarEvent(id, this.currentUserId);
      runInAction(() => {
        this.calendarEvents = this.calendarEvents.filter(e => e.id !== id);
        if (this.selectedEvent?.id === id) {
          this.selectedEvent = null;
        }
        this.isLoading = false;
        this.successMessage = 'Event deleted successfully';
      });

      setTimeout(() => {
        runInAction(() => this.successMessage = null);
      }, 3000);
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to delete event';
        this.isLoading = false;
      });
    }
  }

  // =============================================================
  // AI RECOMMENDATIONS ACTIONS (UC-303)
  // =============================================================

  /**
   * Load AI activity recommendations
   * FR 3.2.5, 3.4.4
   */
  async loadAIRecommendations(relationship_id: string) {
    runInAction(() => {
      this.isGeneratingRecommendations = true;
      this.errorMessage = null;
    });

    try {
      const recommendations = await familyService.getActivityRecommendations(
        relationship_id
      );
      runInAction(() => {
        this.aiRecommendations = recommendations;
        this.isGeneratingRecommendations = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to load recommendations';
        this.isGeneratingRecommendations = false;
      });
    }
  }

  /**
   * Accept and use an AI recommendation to create event
   * FR 3.4.1, 3.4.6
   */
  async useAIRecommendation(
    suggestionId: string,
    relationship_id: string,
    creator_id: string,
    event_date: string,
    event_time?: string
  ) {
    try {
      const suggestion = this.aiRecommendations.find(s => s.id === suggestionId);
      if (!suggestion || !suggestion.activity_title) {
        throw new Error('Suggestion not found');
      }

      // Mark as used
      await familyService.useSuggestion(suggestionId);

      // Create event with AI recommendation details
      const event = await familyService.createCalendarEvent(
        relationship_id,
        creator_id,
        suggestion.activity_title,
        'activity',
        event_date,
        event_time,
        suggestion.activity_description || undefined
      );

      runInAction(() => {
        this.calendarEvents.push(event);
        this.aiRecommendations = this.aiRecommendations.filter(
          s => s.id !== suggestionId
        );
        this.successMessage = 'Activity scheduled from recommendation!';
      });

      setTimeout(() => {
        runInAction(() => this.successMessage = null);
      }, 3000);
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to use recommendation';
      });
    }
  }

  /**
   * Dismiss an AI recommendation (mark as used/dismissed without creating event)
   * FR 3.4.6, 3.4.7
   */
  async dismissAIRecommendation(suggestionId: string) {
    try {
      // Mark as used in backend (same as accepting, but without creating event)
      await familyService.useSuggestion(suggestionId);

      // Remove from local state immediately
      runInAction(() => {
        this.aiRecommendations = this.aiRecommendations.filter(
          s => s.id !== suggestionId
        );
      });
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to dismiss recommendation';
      });
    }
  }

  /**
   * Generate new AI recommendations
   * FR 3.4.2, 3.4.3
   */
  async generateNewRecommendations(
    relationship_id: string,
    userMood: string = 'neutral',
    userLocation: string = 'Unknown'
  ) {
    if (!this.currentRelationship) {
      this.errorMessage = 'No active relationship';
      return;
    }

    runInAction(() => {
      this.isGeneratingRecommendations = true;
      this.errorMessage = null;
    });

    try {
      await familyAIService.generateAndSaveRecommendations(
        relationship_id,
        userMood,
        userLocation,
        this.currentRelationship
      );

      // Reload recommendations
      await this.loadAIRecommendations(relationship_id);
    } catch (error: any) {
      runInAction(() => {
        this.errorMessage = error.message || 'Failed to generate recommendations';
        this.isGeneratingRecommendations = false;
      });
    }
  }
}

// Singleton instance
export const familyViewModel = new FamilyViewModel();
