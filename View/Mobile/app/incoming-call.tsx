import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Vibration,
    Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';

/**
 * IncomingCallScreen - Full screen incoming call notification
 * 
 * Shows when user receives a call invite
 * - Displays caller name and call type
 * - Accept/Decline buttons
 * - Vibration and animation
 */
export default function IncomingCallScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const callerName = params.callerName as string || 'Unknown';
    const callType = params.callType as 'voice' | 'video' || 'voice';
    const roomUrl = params.roomUrl as string;

    // Animation for the call icon
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Start pulsing animation
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        // Vibrate pattern for incoming call
        const vibratePattern = Platform.OS === 'android'
            ? [0, 500, 500, 500]
            : [0, 500];

        const vibrateInterval = setInterval(() => {
            Vibration.vibrate(vibratePattern);
        }, 2000);

        // Initial vibration
        Vibration.vibrate(vibratePattern);

        return () => {
            pulse.stop();
            clearInterval(vibrateInterval);
            Vibration.cancel();
        };
    }, []);

    const handleAccept = () => {
        router.replace({
            pathname: '/call',
            params: { type: callType, url: roomUrl }
        });
    };

    const handleDecline = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Caller Info */}
                <View style={styles.callerInfo}>
                    <Animated.View
                        style={[
                            styles.avatarContainer,
                            { transform: [{ scale: pulseAnim }] }
                        ]}
                    >
                        <Text style={styles.avatarIcon}>
                            {callType === 'video' ? '📹' : '📞'}
                        </Text>
                    </Animated.View>

                    <Text style={styles.callerName}>{callerName}</Text>
                    <Text style={styles.callTypeText}>
                        Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
                    </Text>
                </View>

                {/* Call Actions */}
                <View style={styles.actions}>
                    {/* Decline Button */}
                    <TouchableOpacity
                        style={[styles.actionButton, styles.declineButton]}
                        onPress={handleDecline}
                    >
                        <Text style={styles.actionIcon}>✕</Text>
                        <Text style={styles.actionLabel}>Decline</Text>
                    </TouchableOpacity>

                    {/* Accept Button */}
                    <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={handleAccept}
                    >
                        <Text style={styles.actionIcon}>✓</Text>
                        <Text style={styles.actionLabel}>Accept</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 60,
    },
    callerInfo: {
        alignItems: 'center',
        marginTop: 60,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarIcon: {
        fontSize: 48,
    },
    callerName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    callTypeText: {
        fontSize: 18,
        color: '#AAA',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingHorizontal: 40,
        marginBottom: 40,
    },
    actionButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineButton: {
        backgroundColor: '#FF3B30',
    },
    acceptButton: {
        backgroundColor: '#34C759',
    },
    actionIcon: {
        fontSize: 28,
        color: '#FFF',
        fontWeight: 'bold',
    },
    actionLabel: {
        fontSize: 12,
        color: '#FFF',
        marginTop: 4,
    },
});
