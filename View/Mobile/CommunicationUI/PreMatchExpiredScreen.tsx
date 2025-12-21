/**
 * PreMatchExpiredScreen - Forced decision page (104_2)
 * 
 * Shown when pre-match period reaches 14 days
 * Forces user to make a decision: Apply or End
 * 
 * MVVM: View layer - UI only, logic in CommunicationViewModel
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { communicationViewModel } from '@home-sweet-home/viewmodel';
import { IconCircle } from '@/components/ui';
import { Colors } from '@/constants/theme';

// Project asset icons
const IconClock = require('@/assets/images/icon-clock.png');

export const PreMatchExpiredScreen = observer(function PreMatchExpiredScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const applicationId = params.applicationId as string;
    const vm = communicationViewModel;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const hasRedirected = useRef(false);

    // Get chat data
    const chat = vm.getChatByApplicationId(applicationId);
    const partner = chat?.partnerUser;
    const application = chat?.application;

    // If application is already submitted (pending_review or approved), 
    // don't show this screen - just go back or return null
    // This prevents redirect loops
    const status = application?.status;
    const isAlreadySubmitted = status === 'pending_review' || status === 'approved';

    useEffect(() => {
        if (isAlreadySubmitted && !hasRedirected.current) {
            hasRedirected.current = true;
            console.log('[PreMatchExpiredScreen] Application already submitted, going back...');
            // Just go back instead of redirecting to status screen
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(main)/chat' as any);
            }
        }
    }, [isAlreadySubmitted]);

    // Handle Apply - navigate to formal application form
    const handleApply = () => {
        router.push({
            pathname: '/formal-application',
            params: { applicationId }
        } as any);
    };

    // Handle End - navigate to end confirmation
    const handleEnd = () => {
        router.push({ pathname: '/end-pre-match', params: { applicationId, fromExpired: 'true' } } as any);
    };

    // Loading state
    if (!chat) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Clock Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Image source={IconClock} style={styles.clockIcon} />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>Time's Up!</Text>
                <Text style={styles.subtitle}>
                    Your 14-day pre-match period with{'\n'}
                    <Text style={styles.partnerHighlight}>{partner?.full_name || 'your partner'}</Text>
                    {'\n'}has concluded.
                </Text>

                {/* Partner Card */}
                <View style={styles.partnerCard}>
                    <IconCircle
                        icon={partner?.profile_data?.avatar_meta?.type === 'default' ? '👵' : '👤'}
                        size={64}
                        backgroundColor="#C8ADD6"
                        contentScale={0.6}
                    />
                    <View style={styles.partnerInfo}>
                        <Text style={styles.partnerName}>{partner?.full_name || 'Partner'}</Text>
                        <Text style={styles.partnerDuration}>14 days of communication</Text>
                    </View>
                </View>

                {/* Message */}
                <View style={styles.messageBox}>
                    <Text style={styles.messageText}>
                        It's time to decide. Would you like to proceed with a formal adoption application,
                        or end this pre-match to explore other profiles?
                    </Text>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                <View style={styles.buttonColumn}>
                    <Text style={styles.buttonHint}>Not ready to commit?</Text>
                    <View
                        style={[styles.endButton, isSubmitting && styles.buttonDisabled]}
                        onTouchEnd={!isSubmitting ? handleEnd : undefined}
                    >
                        <Text style={styles.endButtonText}>End Pre-Match</Text>
                    </View>
                </View>

                <View style={styles.buttonColumn}>
                    <Text style={styles.buttonHint}>Ready to adopt?</Text>
                    <View
                        style={[styles.applyButton, isSubmitting && styles.buttonDisabled]}
                        onTouchEnd={!isSubmitting ? handleApply : undefined}
                    >
                        <Text style={styles.applyButtonText}>
                            {isSubmitting ? "Submitting..." : "Apply Formally"}
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFDF5',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFF3E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clockIcon: {
        width: 64,
        height: 64,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FF9800',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    partnerHighlight: {
        fontWeight: '600',
        color: Colors.light.text,
    },
    partnerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        width: '100%',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    partnerInfo: {
        flex: 1,
        marginLeft: 16,
    },
    partnerName: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.text,
    },
    partnerDuration: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    messageBox: {
        backgroundColor: '#F0F8FF',
        padding: 16,
        borderRadius: 12,
        width: '100%',
    },
    messageText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        textAlign: 'center',
    },
    actionContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    buttonColumn: {
        flex: 1,
        alignItems: 'center',
    },
    buttonHint: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    endButton: {
        width: '100%',
        backgroundColor: '#FFE5E5',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    endButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EB8F80',
    },
    applyButton: {
        width: '100%',
        backgroundColor: Colors.light.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    applyButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default PreMatchExpiredScreen;
