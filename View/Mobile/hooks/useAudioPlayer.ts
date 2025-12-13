import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

// ============================================================================
// TYPES
// ============================================================================
export interface VoicePlayback {
    /** Whether this message is currently playing */
    isPlaying: boolean;
    /** Current playback position in seconds */
    positionSeconds: number;
    /** Total duration in seconds */
    durationSeconds: number;
    /** Toggle play/pause */
    onPlayPause: () => void;
    /** Seek to position */
    onSeek: (positionSeconds: number) => void;
}

interface UseAudioPlayerReturn {
    /** ID of currently playing message (null if none) */
    currentlyPlayingId: string | null;
    /** Current playback position in seconds */
    playbackPosition: number;
    /** Total duration of current audio in seconds */
    playbackDuration: number;
    /** Play audio from URL */
    playAudio: (url: string, messageId: string, durationHint?: number) => Promise<void>;
    /** Stop current audio */
    stopAudio: () => Promise<void>;
    /** Toggle play/pause for a message */
    togglePlayback: (url: string, messageId: string, durationHint?: number) => Promise<void>;
    /** Seek to position in seconds */
    seekTo: (positionSeconds: number) => Promise<void>;
    /** Get VoicePlayback object for a specific message */
    getPlaybackForMessage: (messageId: string, mediaUrl: string, duration: number) => VoicePlayback;
}

// ============================================================================
// HOOK
// ============================================================================
/**
 * useAudioPlayer - Hook for playing voice messages with position tracking
 * 
 * Features:
 * - Play audio from URL
 * - Track playback position and duration
 * - Seek to specific position
 * - Auto-stop when playback completes
 * - Provides VoicePlayback interface for components
 */
export function useAudioPlayer(): UseAudioPlayerReturn {
    const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
    const [playbackPosition, setPlaybackPosition] = useState(0);
    const [playbackDuration, setPlaybackDuration] = useState(0);

    const soundRef = useRef<Audio.Sound | null>(null);
    const currentUrlRef = useRef<string | null>(null);
    const currentMessageIdRef = useRef<string | null>(null);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync().catch(() => { });
            }
        };
    }, []);

    /**
     * Handle playback status updates
     */
    const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;

        // Update position
        if (status.positionMillis !== undefined) {
            setPlaybackPosition(Math.floor(status.positionMillis / 1000));
        }

        // Update duration
        if (status.durationMillis !== undefined) {
            setPlaybackDuration(Math.floor(status.durationMillis / 1000));
        }

        // Handle playback completion
        if (status.didJustFinish) {
            setCurrentlyPlayingId(null);
            setPlaybackPosition(0);
            if (soundRef.current) {
                soundRef.current.unloadAsync().catch(() => { });
                soundRef.current = null;
            }
            currentUrlRef.current = null;
            currentMessageIdRef.current = null;
        }
    }, []);

    /**
     * Stop current audio playback
     */
    const stopAudio = useCallback(async (): Promise<void> => {
        try {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }
            setCurrentlyPlayingId(null);
            setPlaybackPosition(0);
            setPlaybackDuration(0);
            currentUrlRef.current = null;
            currentMessageIdRef.current = null;
        } catch (error) {
            console.error('[useAudioPlayer] Stop error:', error);
            soundRef.current = null;
            setCurrentlyPlayingId(null);
            setPlaybackPosition(0);
            setPlaybackDuration(0);
        }
    }, []);

    /**
     * Play audio from URL
     */
    const playAudio = useCallback(async (
        url: string,
        messageId: string,
        durationHint?: number
    ): Promise<void> => {
        try {
            // Stop any current playback
            await stopAudio();

            // Configure audio mode for playback
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });

            // Set duration hint immediately for UI
            if (durationHint) {
                setPlaybackDuration(durationHint);
            }

            // Create and load sound
            const { sound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true, progressUpdateIntervalMillis: 100 },
                onPlaybackStatusUpdate
            );

            soundRef.current = sound;
            currentUrlRef.current = url;
            currentMessageIdRef.current = messageId;
            setCurrentlyPlayingId(messageId);
            setPlaybackPosition(0);

            console.log('[useAudioPlayer] Playing audio', { messageId });
        } catch (error) {
            console.error('[useAudioPlayer] Play error:', error);
            setCurrentlyPlayingId(null);
            setPlaybackPosition(0);
        }
    }, [stopAudio, onPlaybackStatusUpdate]);

    /**
     * Seek to position in seconds
     */
    const seekTo = useCallback(async (positionSeconds: number): Promise<void> => {
        try {
            // Update position immediately for responsive UI
            setPlaybackPosition(positionSeconds);

            if (soundRef.current) {
                await soundRef.current.setPositionAsync(positionSeconds * 1000);
            }
        } catch (error) {
            console.error('[useAudioPlayer] Seek error:', error);
        }
    }, []);

    /**
     * Toggle play/pause for a message
     */
    const togglePlayback = useCallback(async (
        url: string,
        messageId: string,
        durationHint?: number
    ): Promise<void> => {
        if (currentlyPlayingId === messageId) {
            // Currently playing this message - stop it
            await stopAudio();
        } else {
            // Play this message (will stop any other)
            await playAudio(url, messageId, durationHint);
        }
    }, [currentlyPlayingId, playAudio, stopAudio]);

    /**
     * Get VoicePlayback object for a specific message
     * Used by VoiceBubble component
     */
    const getPlaybackForMessage = useCallback((
        messageId: string,
        mediaUrl: string,
        duration: number
    ): VoicePlayback => {
        const isPlaying = currentlyPlayingId === messageId;
        return {
            isPlaying,
            positionSeconds: isPlaying ? playbackPosition : 0,
            durationSeconds: isPlaying ? playbackDuration : duration,
            onPlayPause: () => togglePlayback(mediaUrl, messageId, duration),
            onSeek: (position) => {
                if (isPlaying) {
                    seekTo(position);
                }
            },
        };
    }, [currentlyPlayingId, playbackPosition, playbackDuration, togglePlayback, seekTo]);

    return {
        currentlyPlayingId,
        playbackPosition,
        playbackDuration,
        playAudio,
        stopAudio,
        togglePlayback,
        seekTo,
        getPlaybackForMessage,
    };
}

export default useAudioPlayer;
