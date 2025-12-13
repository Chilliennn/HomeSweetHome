import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import type { VoicePlayback } from '@/hooks/useAudioPlayer';

// ============================================================================
// TYPES
// ============================================================================
interface VoiceBubbleProps {
    /** Playback state and controls */
    playback: VoicePlayback;
    /** Whether this message is from the current user */
    isOwn: boolean;
    /** Custom container style */
    style?: ViewStyle;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Format seconds to MM:SS display
 */
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * VoiceBubble - Reusable voice message player UI
 * 
 * Features:
 * - Custom play/pause icons
 * - Duration display (shows current position / total during playback)
 * - Visual waveform progress indicator
 * 
 * Note: Using View-based waveform instead of Slider to avoid
 * React version conflicts with @react-native-community/slider
 * 
 * ViewModel bindings needed:
 * - playback: VoicePlayback from useAudioPlayer.getPlaybackForMessage()
 * 
 * Usage:
 * ```tsx
 * const playback = audioPlayer.getPlaybackForMessage(message.id, message.media_url, duration);
 * <VoiceBubble playback={playback} isOwn={isOwn} />
 * ```
 */
export const VoiceBubble: React.FC<VoiceBubbleProps> = ({
    playback,
    isOwn,
    style,
}) => {
    const { isPlaying, positionSeconds, durationSeconds, onPlayPause } = playback;

    // Calculate progress percentage
    const progress = durationSeconds > 0 ? (positionSeconds / durationSeconds) * 100 : 0;

    // Display: current position during playback, total duration when paused
    const displayTime = isPlaying
        ? `${formatTime(positionSeconds)} / ${formatTime(durationSeconds)}`
        : formatTime(durationSeconds);

    return (
        <View style={[styles.container, style]}>
            {/* Play/Pause Button */}
            <TouchableOpacity
                style={[styles.playButton, isOwn && styles.playButtonOwn]}
                onPress={onPlayPause}
                activeOpacity={0.7}
            >
                <Image
                    source={
                        isPlaying
                            ? require('@/assets/images/icon-pause.png')
                            : require('@/assets/images/icon-play.png')
                    }
                    style={styles.playIcon}
                />
            </TouchableOpacity>

            {/* Waveform Progress Bar */}
            <View style={styles.waveformContainer}>
                <View style={styles.waveformBars}>
                    {Array.from({ length: 20 }).map((_, index) => {
                        const barProgress = (index / 20) * 100;
                        const isActive = barProgress < progress;
                        // Create variable bar heights for waveform effect
                        const heightVariation = Math.sin(index * 0.5) * 8 + 8;
                        return (
                            <View
                                key={index}
                                style={[
                                    styles.waveformBar,
                                    { height: 8 + heightVariation },
                                    isActive && (isOwn ? styles.waveformBarActiveOwn : styles.waveformBarActive),
                                ]}
                            />
                        );
                    })}
                </View>
            </View>

            {/* Duration Display */}
            <Text style={[styles.duration, isOwn && styles.durationOwn]}>
                {displayTime}
            </Text>
        </View>
    );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 200,
        paddingVertical: 4,
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButtonOwn: {
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    playIcon: {
        width: 16,
        height: 16,
        tintColor: '#333',
    },
    waveformContainer: {
        flex: 1,
        marginHorizontal: 8,
        height: 24,
        justifyContent: 'center',
    },
    waveformBars: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
    },
    waveformBar: {
        width: 3,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 2,
    },
    waveformBarActive: {
        backgroundColor: '#666',
    },
    waveformBarActiveOwn: {
        backgroundColor: '#2A9D8F',
    },
    duration: {
        fontSize: 12,
        color: '#666',
        minWidth: 65,
        textAlign: 'right',
    },
    durationOwn: {
        color: '#333',
    },
});

export default VoiceBubble;
