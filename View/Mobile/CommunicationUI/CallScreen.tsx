import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { communicationViewModel } from '@home-sweet-home/viewmodel';
import { Colors } from '@/constants/theme';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';

interface CallScreenProps {
    type: 'voice' | 'video';
    url?: string;
}

export const CallScreen = observer(({ type, url }: CallScreenProps) => {
    const router = useRouter();
    const vm = communicationViewModel;
    const [roomUrl, setRoomUrl] = useState<string | null>(url || null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'denied'>('checking');

    // Request camera and microphone permissions
    useEffect(() => {
        const requestPermissions = async () => {
            try {
                // Request camera permission (for video calls)
                const cameraPermission = await Camera.requestCameraPermissionsAsync();

                // Request microphone permission
                const audioPermission = await Audio.requestPermissionsAsync();

                console.log('[CallScreen] Permissions:', {
                    camera: cameraPermission.status,
                    audio: audioPermission.status
                });

                if (cameraPermission.status === 'granted' && audioPermission.status === 'granted') {
                    setHasPermissions(true);
                    setPermissionStatus('granted');
                } else {
                    setPermissionStatus('denied');
                    // Show alert if permissions denied
                    Alert.alert(
                        'Permissions Required',
                        'Camera and microphone permissions are required for calls. Please enable them in your device settings.',
                        [
                            {
                                text: 'Open Settings',
                                onPress: () => {
                                    if (Platform.OS === 'ios') {
                                        Linking.openURL('app-settings:');
                                    } else {
                                        Linking.openSettings();
                                    }
                                }
                            },
                            {
                                text: 'Cancel',
                                style: 'cancel',
                                onPress: () => router.back()
                            }
                        ]
                    );
                }
            } catch (error) {
                console.error('[CallScreen] Permission error:', error);
                setPermissionStatus('denied');
                Alert.alert('Error', 'Failed to request permissions.');
                router.back();
            }
        };

        requestPermissions();
    }, []);

    // Initialize call after permissions granted
    useEffect(() => {
        if (!hasPermissions) return;

        const initCall = async () => {
            try {
                let finalUrl = roomUrl;

                if (!finalUrl) {
                    // Create new room if not provided
                    const newRoomUrl = await vm.startCall(type === 'video');
                    if (!newRoomUrl) {
                        throw new Error('Failed to create call room');
                    }
                    finalUrl = newRoomUrl;
                }

                // Add URL parameters for Daily.co Prebuild
                // - t=: join token (optional)
                // - prejoin=false: skip the lobby/prejoin screen
                // - startVideoOff=true: start with camera off for voice calls
                // - startAudioOff=false: start with mic on
                const urlParams = new URLSearchParams();
                urlParams.append('prejoin', 'false'); // Skip lobby, join directly

                if (type === 'voice') {
                    // Voice call: disable camera
                    urlParams.append('startVideoOff', 'true');
                } else {
                    // Video call: enable camera
                    urlParams.append('startVideoOff', 'false');
                }

                // Construct final URL with parameters
                const separator = finalUrl.includes('?') ? '&' : '?';
                const urlWithParams = `${finalUrl}${separator}${urlParams.toString()}`;

                console.log('[CallScreen] Final URL:', urlWithParams);
                setRoomUrl(urlWithParams);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to start call:', error);
                Alert.alert('Error', 'Failed to start call.');
                router.back();
            }
        };

        initCall();
    }, [hasPermissions]);

    // Show permission checking state
    if (permissionStatus === 'checking') {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
                <Text style={styles.text}>Requesting Permissions...</Text>
            </View>
        );
    }

    // Show denied state
    if (permissionStatus === 'denied') {
        return (
            <View style={styles.center}>
                <Text style={styles.text}>Camera and microphone access required</Text>
                <Text style={[styles.text, { fontSize: 14, opacity: 0.7 }]}>
                    Please enable permissions in settings
                </Text>
            </View>
        );
    }

    if (!roomUrl || isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
                <Text style={styles.text}>Initializing Call...</Text>
            </View>
        );
    }

    // JavaScript to inject into Daily.co WebView
    // For voice calls: COMPLETELY disable camera - hide buttons AND stop video tracks
    const injectedJavaScript = type === 'voice' ? `
        (function() {
            console.log('[VoiceCall] Initializing voice-only mode...');
            
            // Function to stop all video tracks
            const stopAllVideoTracks = () => {
                // Get all media streams and stop video tracks
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    // Override getUserMedia to block video
                    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
                    navigator.mediaDevices.getUserMedia = function(constraints) {
                        console.log('[VoiceCall] Intercepted getUserMedia, removing video');
                        if (constraints && constraints.video) {
                            constraints.video = false;
                        }
                        return originalGetUserMedia(constraints);
                    };
                }
                
                // Stop existing video tracks
                const videos = document.querySelectorAll('video');
                videos.forEach(video => {
                    if (video.srcObject) {
                        const tracks = video.srcObject.getTracks();
                        tracks.forEach(track => {
                            if (track.kind === 'video') {
                                console.log('[VoiceCall] Stopping video track');
                                track.stop();
                                track.enabled = false;
                            }
                        });
                    }
                    // Hide the video element
                    video.style.display = 'none';
                });
            };
            
            // Function to hide camera UI elements
            const hideCameraUI = () => {
                // Hide camera toggle button
                const cameraButtons = document.querySelectorAll(
                    '[data-testid="camera-toggle"], ' +
                    '[aria-label*="camera"], ' +
                    '[aria-label*="Camera"], ' +
                    '[aria-label*="video"], ' +
                    '[aria-label*="Video"], ' +
                    'button[class*="cam"], ' +
                    'button[class*="video"]'
                );
                cameraButtons.forEach(btn => btn.style.display = 'none');
                
                // Hide by text content
                document.querySelectorAll('button').forEach(btn => {
                    const text = (btn.innerText || '').toLowerCase();
                    const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
                    if (text.includes('camera') || text.includes('video') || 
                        aria.includes('camera') || aria.includes('video')) {
                        btn.style.display = 'none';
                    }
                });
                
                // Hide all video elements
                document.querySelectorAll('video').forEach(v => {
                    v.style.display = 'none';
                    v.pause();
                });
                
                // Hide video-related containers
                document.querySelectorAll('[class*="video"], [class*="Video"], [class*="cam"], [class*="Cam"]').forEach(el => {
                    if (el.tagName !== 'BUTTON') {
                        el.style.opacity = '0';
                        el.style.height = '0';
                        el.style.overflow = 'hidden';
                    }
                });
            };
            
            // Run functions
            stopAllVideoTracks();
            hideCameraUI();
            
            // Keep running periodically
            setInterval(() => {
                stopAllVideoTracks();
                hideCameraUI();
            }, 500);
            
            // Watch for DOM changes
            const observer = new MutationObserver(() => {
                stopAllVideoTracks();
                hideCameraUI();
            });
            observer.observe(document.body, { childList: true, subtree: true });
            
            console.log('[VoiceCall] Voice-only mode active');
        })();
        true;
    ` : `true;`;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <WebView
                source={{ uri: roomUrl }}
                style={styles.webview}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                scalesPageToFit
                // Enable camera/mic permissions
                androidLayerType="hardware"
                originWhitelist={['*']}
                // Additional WebView settings for media
                mediaCapturePermissionGrantType="grant"
                // Inject JavaScript to hide camera for voice calls
                injectedJavaScript={injectedJavaScript}
                onMessage={() => { }} // Required for injectedJavaScript to work
            />
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    text: {
        color: '#FFF',
        marginTop: 10,
        fontSize: 16,
    }
});
