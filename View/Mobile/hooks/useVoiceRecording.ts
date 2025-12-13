import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================
export interface RecordingResult {
    uri: string;
    durationSeconds: number;
    /** True if recording was auto-stopped due to max duration limit */
    wasAutoStopped: boolean;
}

interface UseVoiceRecordingReturn {
    /** Whether currently recording */
    isRecording: boolean;
    /** Current recording duration in seconds */
    duration: number;
    /** Start recording (on press in) */
    startRecording: () => Promise<boolean>;
    /** Stop recording and get file URI (on press out) */
    stopRecording: () => Promise<RecordingResult | null>;
    /** Cancel recording without saving (on slide to cancel) */
    cancelRecording: () => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const MAX_DURATION_SECONDS = 120; // 2 minutes as per UC101 pre-match limit

// ============================================================================
// HOOK
// ============================================================================
/**
 * useVoiceRecording - Hook for recording voice messages with expo-av
 * 
 * Implements "hold to record" interaction:
 * - Press and hold: Start recording
 * - Release: Stop and return audio file
 * - Slide left: Cancel recording
 * 
 * Features:
 * - Automatic permission handling
 * - Duration tracking
 * - Max duration limit (2 minutes) with auto-stop
 * - Cancel recording support
 * - Cleanup on unmount
 */
export function useVoiceRecording(): UseVoiceRecordingReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);

    const recordingRef = useRef<Audio.Recording | null>(null);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);
    const wasAutoStoppedRef = useRef<boolean>(false);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync().catch(() => { });
            }
        };
    }, []);

    /**
     * Request microphone permission
     */
    const requestPermission = useCallback(async (): Promise<boolean> => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Microphone Permission Required',
                    'Please grant microphone permission to record voice messages.',
                    [{ text: 'OK' }]
                );
                return false;
            }
            return true;
        } catch (error) {
            console.error('[useVoiceRecording] Permission error:', error);
            return false;
        }
    }, []);

    /**
     * Stop recording internal helper
     */
    const stopRecordingInternal = useCallback(async (): Promise<RecordingResult | null> => {
        try {
            // Clear duration interval
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

            if (!recordingRef.current) {
                console.warn('[useVoiceRecording] No active recording to stop');
                setIsRecording(false);
                return null;
            }

            // Calculate final duration before stopping
            const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const wasAutoStopped = wasAutoStoppedRef.current;

            // Stop and unload
            await recordingRef.current.stopAndUnloadAsync();

            // Get recording URI
            const uri = recordingRef.current.getURI();
            recordingRef.current = null;

            // Reset audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            setIsRecording(false);
            setDuration(0);
            wasAutoStoppedRef.current = false;

            if (!uri) {
                console.error('[useVoiceRecording] No URI after recording');
                return null;
            }

            console.log('[useVoiceRecording] Recording stopped', {
                uri,
                duration: finalDuration,
                wasAutoStopped
            });

            return {
                uri,
                durationSeconds: finalDuration,
                wasAutoStopped,
            };
        } catch (error) {
            console.error('[useVoiceRecording] Stop recording error:', error);
            setIsRecording(false);
            setDuration(0);
            recordingRef.current = null;
            wasAutoStoppedRef.current = false;
            return null;
        }
    }, []);

    /**
     * Start recording voice
     */
    const startRecording = useCallback(async (): Promise<boolean> => {
        try {
            // Clean up any existing recording first
            if (recordingRef.current) {
                console.log('[useVoiceRecording] Cleaning up previous recording');
                if (durationIntervalRef.current) {
                    clearInterval(durationIntervalRef.current);
                    durationIntervalRef.current = null;
                }
                try {
                    await recordingRef.current.stopAndUnloadAsync();
                } catch (e) {
                    // Ignore cleanup errors
                }
                recordingRef.current = null;
            }

            // Check permission
            const hasPermission = await requestPermission();
            if (!hasPermission) return false;

            // Configure audio mode for recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // Create and start recording
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            recordingRef.current = recording;
            startTimeRef.current = Date.now();
            wasAutoStoppedRef.current = false;
            setIsRecording(true);
            setDuration(0);

            // Start duration tracking
            durationIntervalRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                setDuration(elapsed);

                // Auto-stop at max duration
                if (elapsed >= MAX_DURATION_SECONDS) {
                    console.log('[useVoiceRecording] Max duration reached, auto-stopping');
                    wasAutoStoppedRef.current = true;
                    // We don't call stopRecording here - let the component handle it
                    // by checking duration and calling stopRecording itself
                }
            }, 100); // Update more frequently for smoother UI

            console.log('[useVoiceRecording] Recording started');
            return true;
        } catch (error) {
            console.error('[useVoiceRecording] Start recording error:', error);
            Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
            return false;
        }
    }, [requestPermission]);

    /**
     * Stop recording and return result
     */
    const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
        return stopRecordingInternal();
    }, [stopRecordingInternal]);

    /**
     * Cancel recording without saving
     */
    const cancelRecording = useCallback(async (): Promise<void> => {
        try {
            // Clear duration interval
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

            if (recordingRef.current) {
                await recordingRef.current.stopAndUnloadAsync();
                recordingRef.current = null;
            }

            // Reset audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            setIsRecording(false);
            setDuration(0);
            wasAutoStoppedRef.current = false;

            console.log('[useVoiceRecording] Recording cancelled');
        } catch (error) {
            console.error('[useVoiceRecording] Cancel recording error:', error);
            setIsRecording(false);
            setDuration(0);
            recordingRef.current = null;
        }
    }, []);

    return {
        isRecording,
        duration,
        startRecording,
        stopRecording,
        cancelRecording,
    };
}

export default useVoiceRecording;
